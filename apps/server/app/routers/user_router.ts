import type { UUID } from 'node:crypto'
import { randomUUID } from 'node:crypto'

import { TRPCError } from '@trpc/server'
import type { AddChildSchema, Grade, Subject } from '@viastud/utils'
import {
  addChildSchema,
  addUserSchema,
  editUserSchema,
  freeUserRegistrationSchema,
  parentDetailsSchema,
  userDetailsSchema,
} from '@viastud/utils'
import { DateTime } from 'luxon'
import Stripe from 'stripe'
import twilio from 'twilio'
import { z } from 'zod'

import Invoice from '#models/invoice'
import Module from '#models/module'
import ModuleToStudent from '#models/module_to_student'
import OneTimePeriodData from '#models/one_time_period_data'
import OneTimeSubscription from '#models/one_time_subscription'
import Payment from '#models/payment'
import StudentDetails from '#models/student_details'
import Subscription from '#models/subscription'
import User from '#models/user'
import UserRegisterToken from '#models/user_register_token'
import { createPersonalPromotionalCode } from '#services/referral_program_service'
import { sendMail } from '#services/send_mail_service'
import { authProcedure, publicProcedure } from '#services/trpc_service'
import { findChildrenWithProfileData } from '#services/user/find_children_with_profile_data'
import { findStudentProfileData } from '#services/user/find_student_profile_data'
import { findUserSubscriptionDetails } from '#services/user/find_user_subscription_details'
import env from '#start/env'

import { BrevoEmailProvider } from '../gateway/email_provider_gateway.js'
import { AdonisEmailValidationRepository } from '../infrastructure/adonis_email_validation_repository.js'
import { AdonisModuleToStudentRepository } from '../infrastructure/adonis_module_to_student_repository.js'
import { AdonisPromotionalCodeRepository } from '../infrastructure/adonis_promotional_code_repository.js'
import { AdonisReservationRepository } from '../infrastructure/adonis_reservation_repository.js'
import { AdonisSmsValidationRepository } from '../infrastructure/adonis_sms_validation_repository.js'
import { AdonisStudentDetailsRepository } from '../infrastructure/adonis_student_details_repository.js'
import { AdonisStudentTaskActivityRepository } from '../infrastructure/adonis_student_task_activity_repository.js'
import { AdonisSubscriptionRepository } from '../infrastructure/adonis_subscription_repository.js'
import TokenBalanceRepository from '../infrastructure/adonis_token_balance.repository.js'
import { AdonisUserRepository } from '../infrastructure/adonis_user_repository.js'
import { StripePaymentGateway } from '../infrastructure/stripe_gateway.js'
import { TwilioSmsProvider } from '../infrastructure/twilio_sms_provider_gateway.js'
import { EmailService } from '../services/email_service.js'
import { EmailValidationService } from '../services/email_validation_service.js'
import { loggingService } from '../services/logging_service.js'
import { NextActivityService } from '../services/next_activity_service.js'
import { SmsService } from '../services/sms_service.js'
import { SmsValidationService } from '../services/sms_validation_service.js'
import { findParentSubscriptionDetails } from '../services/user/parent/find_parend_subscription_details.js'
import type { ChapterDto } from './chapter.ts'
import type { UserDto } from './user_auth_router.js'

export interface ModuleForStudent {
  id: number
  name: string
  grade: Grade
  subject: Subject
  chapter: ChapterDto
  doneModule: boolean
  doingModule: boolean
}

export interface StudentWithDetails {
  id: UUID
  firstName: string
  lastName: string
  email: string
  phoneNumber: string | null
  grade: Grade | null
  interestedIn: Subject[]
  modules: ModuleForStudent[]
}

const createChild = async ({ input, parentId }: { input: AddChildSchema; parentId: UUID }) => {
  const parent = await User.query()
    .preload('subscription')
    .preload('oneTimeSubscription')
    .where('id', parentId)
    .firstOrFail()

  if (parent.role !== 'PARENT') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: "Vous n'êtes pas autorisé à avoir des enfants",
    })
  }

  let child = await User.query().whereRaw('LOWER(email) = LOWER(?)', [input.email]).first()

  if (child) {
    // 🧠 L’enfant existe déjà, on vérifie s’il est éligible
    if (child.role !== 'STUDENT') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: "L'email est déjà utilisé par un utilisateur non-élève",
      })
    }

    if (child.parentId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cet enfant est déjà rattaché à un parent',
      })
    }

    // 🛠 Association
    child.parentId = parent.id
    await child.save()
  } else {
    // 👶 On ne crée pas un enfant avec un numéro de téléphone existant
    if (input.phoneNumber) {
      const existingWithPhone = await User.query().where('phoneNumber', input.phoneNumber).first()
      if (existingWithPhone) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Ce numéro est déjà utilisé par un autre compte.',
        })
      }
    }
    child = new User()
    child.firstName = input.firstName
    child.lastName = input.lastName
    child.email = input.email
    child.phoneNumber = input.phoneNumber
    child.role = 'STUDENT'
    child.parentId = parent.id
    await child.save()

    child.promotionalCodeId = await createPersonalPromotionalCode(
      child,
      new AdonisPromotionalCodeRepository()
    )
    await child.save()

    const childDetails = new StudentDetails()
    childDetails.userId = child.id
    await childDetails.save()

    const childRegisterToken = new UserRegisterToken()
    childRegisterToken.token = randomUUID()
    childRegisterToken.userId = child.id
    await childRegisterToken.save()

    await sendMail({
      mailTemplate: 'REGISTER',
      emails: [child.email],
      params: { url: env.get('USER_BASE_URL'), token: childRegisterToken.token },
    })
  }

  // 🎁 Abonnements
  if (parent.oneTimeSubscription) {
    await new OneTimeSubscription()
      .fill({
        userId: child.id,
        customerId: parent.oneTimeSubscription.customerId,
        oneTimePeriodDataId: parent.oneTimeSubscription.oneTimePeriodDataId,
      })
      .save()
  }

  if (parent.subscription) {
    await new Subscription()
      .fill({
        userId: child.id,
        customerId: parent.subscription.customerId,
        endOfSubscriptionDate: DateTime.now(),
      })
      .save()
  }

  return child
}

const createSmsService = () => {
  const twilioAccountSid = env.get('TWILIO_ACCOUNT_SID')
  const twilioAuthToken = env.get('TWILIO_AUTH_TOKEN')
  const twilioPhoneNumber = env.get('TWILIO_PHONE_NUMBER')
  const twilioMessagingServiceSid = env.get('TWILIO_MESSAGING_SERVICE_SID')

  loggingService.info("Vérification des variables d'environnement Twilio", {
    action: 'create_sms_service_env_check',
    hasAccountSid: !!twilioAccountSid,
    hasAuthToken: !!twilioAuthToken,
    hasPhoneNumber: !!twilioPhoneNumber,
    hasMessagingServiceSid: !!twilioMessagingServiceSid,
  })

  if (!twilioAccountSid || !twilioAuthToken) {
    loggingService.error("Variables d'environnement Twilio manquantes", {
      action: 'create_sms_service_env_missing',
      hasAccountSid: !!twilioAccountSid,
      hasAuthToken: !!twilioAuthToken,
      hasPhoneNumber: !!twilioPhoneNumber,
      hasMessagingServiceSid: !!twilioMessagingServiceSid,
    })
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: "Configuration SMS non disponible - variables d'environnement Twilio manquantes",
    })
  }

  if (!twilioMessagingServiceSid && !twilioPhoneNumber) {
    loggingService.error("Aucune méthode d'envoi SMS configurée", {
      action: 'create_sms_service_no_sender',
      hasPhoneNumber: !!twilioPhoneNumber,
      hasMessagingServiceSid: !!twilioMessagingServiceSid,
    })
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: "Configuration SMS non disponible - aucune méthode d'envoi configurée",
    })
  }

  const smsValidationRepository = new AdonisSmsValidationRepository()
  const smsValidationService = new SmsValidationService(smsValidationRepository)
  const twilioClient = twilio(twilioAccountSid, twilioAuthToken)
  const twilioSmsProvider = new TwilioSmsProvider(
    twilioClient,
    twilioPhoneNumber,
    twilioMessagingServiceSid
  )

  loggingService.info('Service SMS créé avec succès', {
    action: 'create_sms_service_success',
    phoneNumber: twilioPhoneNumber,
    messagingServiceSid: twilioMessagingServiceSid,
  })

  return new SmsService(twilioSmsProvider, smsValidationService)
}

const createEmailService = () => {
  const brevoApiKey = env.get('BREVO_API_KEY')
  const brevoFromEmail = env.get('BREVO_FROM_EMAIL')

  loggingService.info("Vérification des variables d'environnement Brevo", {
    action: 'create_email_service_env_check',
    hasApiKey: !!brevoApiKey,
    hasFromEmail: !!brevoFromEmail,
  })

  if (!brevoApiKey || !brevoFromEmail) {
    loggingService.error("Variables d'environnement Brevo manquantes", {
      action: 'create_email_service_env_missing',
      hasApiKey: !!brevoApiKey,
      hasFromEmail: !!brevoFromEmail,
    })
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: "Configuration Email non disponible - variables d'environnement Brevo manquantes",
    })
  }

  const emailValidationRepository = new AdonisEmailValidationRepository()
  const emailValidationService = new EmailValidationService(emailValidationRepository)
  const brevoEmailProvider = new BrevoEmailProvider(brevoApiKey, brevoFromEmail)

  loggingService.info('Service Email créé avec succès', {
    action: 'create_email_service_success',
    fromEmail: brevoFromEmail,
  })

  return new EmailService(brevoEmailProvider, emailValidationService)
}

export const userRouter = {
  getAll: authProcedure.meta({ guards: ['admin'] }).query(async () => {
    const users = await User.query().preload('subscription', (query) => {
      void query.preload('subscriptionPlan')
    })
    const userIds = users.map((user) => user.id)
    const studentDetails = await StudentDetails.query().whereIn('userId', userIds)
    const studentDetailsMap = new Map(studentDetails.map((sd) => [sd.userId, sd]))

    return users.map((user) => ({
      id: user.id,
      role: user.role,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      address: user.address ?? {
        streetNumber: '',
        street: '',
        postalCode: '',
        city: '',
        country: '',
      },
      phoneNumber: user.phoneNumber,
      grade: studentDetailsMap.get(user.id)?.grade ?? null,
      hasSubscription: !!user.subscription,
      subscriptionStatus: user.subscription?.status ?? null,
      subscriptionPlanName: user.subscription?.subscriptionPlan?.name ?? null,
      createdAt: user.createdAt.toJSDate(),
    }))
  }),

  getUserDetails: authProcedure
    .meta({ guards: ['admin', 'user'] })
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      if (ctx.genericAuth instanceof User && ctx.genericAuth.id !== input.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to access this resource',
        })
      }
      const studentDetails = await StudentDetails.findBy('userId', input.id)
      if (!studentDetails) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid user ID',
        })
      }
      return {
        id: studentDetails.userId,
        isFinished: studentDetails.isFinished,
        grade: studentDetails.grade,
        interestedIn: studentDetails.interestedIn,
      }
    }),

  updateUserDetails: authProcedure
    .meta({ guards: ['user'] })
    .input(userDetailsSchema)
    .mutation(async ({ ctx, input }) => {
      const student = await User.findBy('id', ctx.genericAuth.id)
      if (!student) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid user ID',
        })
      }

      if (student.role !== 'STUDENT') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only students can update their details',
        })
      }

      let studentDetails = await StudentDetails.findBy('userId', ctx.genericAuth.id)
      // Auto-create missing student details to avoid blocking onboarding
      if (!studentDetails) {
        studentDetails = new StudentDetails()
        studentDetails.userId = ctx.genericAuth.id
        await studentDetails.save()
      }

      student.firstName = input.firstName
      student.lastName = input.lastName
      // Vérifier l'unicité du numéro avant sauvegarde
      if (input.phoneNumber) {
        const existingWithPhone = await User.query()
          .where('phoneNumber', input.phoneNumber)
          .whereNot('id', ctx.genericAuth.id)
          .first()
        if (existingWithPhone) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Ce numéro est déjà utilisé par un autre compte.',
          })
        }
        student.phoneNumber = input.phoneNumber
      }
      await student.save()

      if (input.grade) {
        studentDetails.grade = input.grade
      }
      studentDetails.interestedIn = input.interestedIn
      studentDetails.isFinished = true
      await studentDetails.save()

      const modules = Array.from(new Set([...input.doingModules, ...input.doneModules]))

      for (const module of modules) {
        const moduleToStudent = await ModuleToStudent.findBy({
          userId: ctx.genericAuth.id,
          moduleId: module,
        })
        if (!moduleToStudent) {
          const newModuleToStudent = new ModuleToStudent()
          newModuleToStudent.userId = ctx.genericAuth.id
          newModuleToStudent.moduleId = module
          newModuleToStudent.done = input.doneModules.includes(module)
          newModuleToStudent.doing = input.doingModules.includes(module)
          await newModuleToStudent.save()
        } else {
          moduleToStudent.done = input.doneModules.includes(module)
          moduleToStudent.doing = input.doingModules.includes(module)
          await moduleToStudent.save()
        }
      }
      return { message: 'Onboarding done successfully' }
    }),

  submitParentOnboarding: authProcedure
    .meta({ guards: ['user'] })
    .input(parentDetailsSchema)
    .mutation(async ({ ctx, input }) => {
      const parent = await User.findBy('id', ctx.genericAuth.id)
      if (!parent) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid user ID',
        })
      }
      parent.firstName = input.firstName
      parent.lastName = input.lastName
      // Vérifier l'unicité du numéro avant sauvegarde
      if (input.phoneNumber) {
        const existingWithPhone = await User.query()
          .where('phoneNumber', input.phoneNumber)
          .whereNot('id', ctx.genericAuth.id)
          .first()
        if (existingWithPhone) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Ce numéro est déjà utilisé par un autre compte.',
          })
        }
        parent.phoneNumber = input.phoneNumber
      }
      await parent.save()

      for (const child of input.children) {
        await createChild({ input: { ...child, parentId: parent.id }, parentId: parent.id })
      }
      return { message: 'Onboarding done successfully' }
    }),

  create: authProcedure
    .meta({ guards: ['admin'] })
    .input(addUserSchema)
    .mutation(async ({ input }) => {
      const user = new User()
      user.firstName = input.firstName
      user.lastName = input.lastName
      user.email = input.email
      // Vérifier l'unicité du numéro avant création
      if (input.phoneNumber) {
        const existingWithPhone = await User.findBy('phoneNumber', input.phoneNumber)
        if (existingWithPhone) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Ce numéro est déjà utilisé par un autre compte.',
          })
        }
        user.phoneNumber = input.phoneNumber
      }
      user.role = 'STUDENT'

      await user.save()

      user.promotionalCodeId = await createPersonalPromotionalCode(
        user,
        new AdonisPromotionalCodeRepository()
      )
      await user.save()

      const oneTimePeriod = await OneTimePeriodData.query().where('isActive', true).first()
      if (
        oneTimePeriod &&
        oneTimePeriod.beginningOfRegistrationDate < DateTime.now() &&
        oneTimePeriod.endOfPeriodDate > DateTime.now()
      ) {
        const oneTimeSubscription = new OneTimeSubscription()
        oneTimeSubscription.userId = user.id
        oneTimeSubscription.oneTimePeriodDataId = oneTimePeriod.id
        oneTimeSubscription.customerId = 'ADMIN'
        await oneTimeSubscription.save()
      }

      const userRegisterToken = new UserRegisterToken()
      userRegisterToken.token = randomUUID()
      userRegisterToken.userId = user.id
      await userRegisterToken.save()

      const studentDetails = new StudentDetails()
      studentDetails.userId = user.id
      await studentDetails.save()

      await sendMail({
        mailTemplate: 'REGISTER',
        emails: [input.email],
        params: { url: env.get('USER_BASE_URL'), token: userRegisterToken.token },
      })
      return user
    }),

  edit: authProcedure
    .meta({ guards: ['user', 'admin'] })
    .input(editUserSchema)
    .mutation<UserDto>(async ({ input, ctx }) => {
      const user = await User.findBy('id', input.id)
      if (!user) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid user ID',
        })
      }
      if (
        ctx.genericAuth instanceof User &&
        input.id !== ctx.genericAuth.id &&
        user.parentId !== ctx.genericAuth.id
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You are not authorized to edit this user',
        })
      }
      user.firstName = input.firstName
      user.lastName = input.lastName
      user.email = input.email
      // Vérifier l'unicité du numéro avant sauvegarde
      if (input.phoneNumber) {
        const existingWithPhone = await User.query()
          .where('phoneNumber', input.phoneNumber)
          .whereNot('id', input.id)
          .first()
        if (existingWithPhone) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Ce numéro est déjà utilisé par un autre compte.',
          })
        }
        user.phoneNumber = input.phoneNumber
      }
      await user.save()

      if (user.role === 'STUDENT') {
        let studentDetails = await StudentDetails.findBy('userId', user.id)
        if (!studentDetails) {
          studentDetails = new StudentDetails()
          studentDetails.userId = user.id
          studentDetails.isFinished = true
          await studentDetails.save()
        }
        if (input.grade) {
          studentDetails.grade = input.grade
        }
        if (input.interestedIn) {
          studentDetails.interestedIn = input.interestedIn
        }

        await studentDetails.save()

        if (input.modules) {
          for (const module of input.modules) {
            const moduleToStudent = await ModuleToStudent.findBy({
              userId: user.id,
              moduleId: module.id,
            })
            if (!moduleToStudent) {
              const newModuleToStudent = new ModuleToStudent()
              newModuleToStudent.userId = user.id
              newModuleToStudent.moduleId = module.id
              newModuleToStudent.done = module.doneModule
              newModuleToStudent.doing = module.doingModule
              await newModuleToStudent.save()
            } else {
              moduleToStudent.done = module.doneModule
              moduleToStudent.doing = module.doingModule
              await moduleToStudent.save()
            }
          }
        }
      }

      const studentDetails = await StudentDetails.findBy('userId', user.id)
      await user.load('subscription', (query) => {
        void query.preload('subscriptionPlan')
      })

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        address: user.address ?? {
          streetNumber: '',
          street: '',
          postalCode: '',
          city: '',
          country: '',
        },
        role: user.role,
        grade: studentDetails?.grade ?? null,
        hasSubscription: !!user.subscription,
        subscriptionStatus: user.subscription?.status ?? null,
        subscriptionPlanName: user.subscription?.subscriptionPlan?.name ?? null,
        createdAt: user.createdAt.toJSDate(),
      }
    }),

  getStudentDetails: authProcedure
    .meta({ guards: ['user', 'admin'] })
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const user = await User.findBy('id', input.id)
      if (!user) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid User ID',
        })
      }
      if (
        ctx.genericAuth instanceof User &&
        input.id !== ctx.genericAuth.id &&
        user.parentId !== ctx.genericAuth.id
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You are not authorized to get this data',
        })
      }
      const studentDetails = await StudentDetails.findBy('userId', input.id)
      if (!studentDetails) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid user ID',
        })
      }
      const modules = await Module.query()
        .preload('chapter')
        .join('chapters', 'chapters.id', 'modules.chapter_id')
        .orderBy('chapters.order', 'asc')
        .orderBy('modules.id', 'asc')
        .select('modules.*')
      const modulesByStudent = await Promise.all(
        modules.map(async (module) => {
          const moduleToStudent = await ModuleToStudent.query()
            .where('module_id', module.id)
            .andWhere('userId', input.id)
            .first()
          return {
            id: module.id,
            name: module.name,
            grade: module.grade,
            subject: module.subject,
            chapter: {
              id: module.chapter.id,
              name: module.chapter.name,
              order: module.chapter.order,
            },
            doneModule: moduleToStudent?.done ?? false,
            doingModule: moduleToStudent?.doing ?? false,
          }
        })
      )
      return {
        id: studentDetails.userId,
        grade: studentDetails.grade,
        interestedIn: studentDetails.interestedIn,
        modules: modulesByStudent,
      }
    }),

  getStudentSubscriptionDetails: authProcedure.meta({ guards: ['user'] }).query(async ({ ctx }) => {
    const student = await User.findBy('id', ctx.genericAuth.id)
    if (!student) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid User ID',
      })
    }
    const subscription = await Subscription.findBy('userId', ctx.genericAuth.id)
    if (!subscription) {
      return {
        status: 'INACTIVE',
        currentPeriodEnd: null,
        amount: null,
        hasParent: !!student.parentId,
      }
    }
    const stripePrivateApiKey = env.get('STRIPE_PRIVATE_API_KEY')
    const stripe = new Stripe(stripePrivateApiKey)
    const subscriptionDetails = await stripe.subscriptions.list({
      customer: subscription.customerId ?? undefined,
      status: 'active',
    })
    const subscriptionData = subscriptionDetails.data
    if (subscriptionData.length > 0) {
      return {
        status:
          subscription.endOfSubscriptionDate === null ||
          subscription.endOfSubscriptionDate > DateTime.now()
            ? 'ACTIVE'
            : 'INACTIVE',
        currentPeriodEnd: subscriptionData[0].current_period_end,
        amount: Number(subscriptionData[0].items.data[0].plan.amount),
        hasParent: !!student.parentId,
      }
    } else {
      // For staging to be able to fake the subscription`
      if (
        subscription.endOfSubscriptionDate &&
        subscription.endOfSubscriptionDate > DateTime.now()
      ) {
        return {
          status: 'ACTIVE',
          currentPeriodEnd: subscription.endOfSubscriptionDate,
          amount: 0,
          hasParent: !!student.parentId,
        }
      }
      return {
        status: 'INACTIVE',
        currentPeriodEnd: null,
        amount: null,
        hasParent: !!student.parentId,
      }
    }
  }),

  getParentSubscriptionDetails: authProcedure.meta({ guards: ['user'] }).query(async ({ ctx }) => {
    return findParentSubscriptionDetails(
      new AdonisUserRepository(),
      new AdonisSubscriptionRepository(),
      new StripePaymentGateway(),
      ctx.genericAuth.id
    )
  }),

  getParentIfExists: authProcedure.meta({ guards: ['user'] }).query(async ({ ctx }) => {
    const student = await User.findBy('id', ctx.genericAuth.id)
    if (!student || student.role === 'PARENT') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid user ID',
      })
    }
    return !!student.parentId
  }),

  getTokenBalance: authProcedure.meta({ guards: ['user'] }).query(async ({ ctx }) => {
    const repo = new TokenBalanceRepository()
    const balance = await repo.getBalance(ctx.genericAuth.id)
    return { balance }
  }),

  getChildren: authProcedure
    .meta({ guards: ['user', 'admin'] })
    .input(z.string())
    .query<UserDto[]>(async ({ ctx, input }) => {
      if (ctx.genericAuth instanceof User && input !== ctx.genericAuth.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You are not authorized to access this data',
        })
      }
      const parent = await User.findBy('id', input)
      if (!parent || parent.role !== 'PARENT') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid parent ID',
        })
      }
      const children = await User.query()
        .where('parentId', input)
        .preload('subscription', (query) => {
          void query.preload('subscriptionPlan')
        })
      const childrenIds = children.map((child) => child.id)
      const studentDetails = await StudentDetails.query().whereIn('userId', childrenIds)
      const studentDetailsMap = new Map(studentDetails.map((sd) => [sd.userId, sd]))

      return children.map((child) => ({
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        email: child.email,
        phoneNumber: child.phoneNumber,
        address: child.address ?? {
          streetNumber: '',
          street: '',
          postalCode: '',
          city: '',
          country: '',
        },
        role: child.role,
        grade: studentDetailsMap.get(child.id)?.grade ?? null,
        hasSubscription: !!child.subscription,
        subscriptionStatus: child.subscription?.status ?? null,
        subscriptionPlanName: child.subscription?.subscriptionPlan?.name ?? null,
        createdAt: child.createdAt.toJSDate(),
      }))
    }),

  getChildrenWithProfilesData: authProcedure.meta({ guards: ['user'] }).query(async ({ ctx }) => {
    return findChildrenWithProfileData(
      new AdonisUserRepository(),
      new AdonisStudentDetailsRepository(),
      new AdonisModuleToStudentRepository(),
      new AdonisStudentTaskActivityRepository(),
      new AdonisReservationRepository(),
      ctx.genericAuth.id
    )
  }),

  getStudentCourseHoursBySubject: authProcedure
    .meta({ guards: ['user'] })
    .input(
      z.object({
        id: z.string().uuid().optional(),
        weekStart: z.string().datetime().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // If id is provided, user must be self or parent of that student; otherwise use auth user
      const targetId = (input?.id ?? ctx.genericAuth.id) as UUID

      if (input?.id) {
        const user = await User.findBy('id', input.id)
        if (!user) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid user ID' })
        }
        if (
          ctx.genericAuth instanceof User &&
          input.id !== ctx.genericAuth.id &&
          user.parentId !== ctx.genericAuth.id
        ) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Not authorized' })
        }
      }

      const repo = new AdonisReservationRepository()
      let rangeStart: Date | undefined
      let rangeEnd: Date | undefined
      if (input?.weekStart) {
        rangeStart = new Date(input.weekStart)
        // weekStart is Monday; set end to Sunday end of day
        rangeEnd = new Date(rangeStart)
        rangeEnd.setDate(rangeStart.getDate() + 6)
        rangeEnd.setHours(23, 59, 59, 999)
      }
      const result = await repo.getStudentHoursBySubject(targetId, rangeStart, rangeEnd)
      return result
    }),

  getStudentWeeklyQuizStats: authProcedure
    .meta({ guards: ['user'] })
    .input(
      z.object({
        id: z.string().uuid().optional(),
        weekStart: z.string().datetime(),
      })
    )
    .query(async ({ ctx, input }) => {
      const targetId = (input?.id ?? ctx.genericAuth.id) as UUID
      if (input?.id) {
        const user = await User.findBy('id', input.id)
        if (!user) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid user ID' })
        if (
          ctx.genericAuth instanceof User &&
          input.id !== ctx.genericAuth.id &&
          user.parentId !== ctx.genericAuth.id
        ) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Not authorized' })
        }
      }

      const rangeStart = new Date(input.weekStart)
      const rangeEnd = new Date(rangeStart)
      rangeEnd.setDate(rangeStart.getDate() + 6)
      rangeEnd.setHours(23, 59, 59, 999)

      const repo = new AdonisStudentTaskActivityRepository()
      const stats = await repo.getWeeklyQuizStats(targetId, rangeStart, rangeEnd)
      return stats
    }),

  getStudentProfileData: authProcedure.meta({ guards: ['user'] }).query(async ({ ctx }) => {
    return findStudentProfileData(
      new AdonisUserRepository(),
      new AdonisStudentDetailsRepository(),
      new AdonisModuleToStudentRepository(),
      new AdonisStudentTaskActivityRepository(),
      ctx.genericAuth.id
    )
  }),

  getTokenInformation: publicProcedure.input(z.string().uuid()).query(async ({ input }) => {
    const userRegisterToken = await UserRegisterToken.findBy('token', input)
    if (!userRegisterToken) {
      return { isLinkValid: false }
    }
    return { isLinkValid: true }
  }),

  createChild: authProcedure
    .meta({ guards: ['user'] })
    .input(addChildSchema)
    .mutation(async ({ input, ctx }) => {
      const child = await createChild({ input, parentId: ctx.genericAuth.id })
      return child
    }),

  delete: authProcedure
    .meta({ guards: ['admin', 'user'] })
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      const user = await User.findBy('id', input)
      if (!user) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid user ID',
        })
      }
      if (
        ctx.genericAuth instanceof User &&
        input !== ctx.genericAuth.id &&
        user.parentId !== ctx.genericAuth.id
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You are not authorized to remove this user',
        })
      }
      await user.delete()
      await ctx.auth.use('user').logout()
      return { message: 'User deleted successfully' }
    }),

  getPromotionalCode: authProcedure
    .meta({ guards: ['user'] })
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      if (ctx.genericAuth instanceof User && ctx.genericAuth.id !== input.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to access this resource',
        })
      }

      const user = await User.query().preload('promotionalCode').where('id', input.id).first()

      if (!user || !user.promotionalCode) {
        return null
      }

      return {
        code: user.promotionalCode.code,
        name: user.promotionalCode.name,
        description: user.promotionalCode.description,
        discountPercentage: user.promotionalCode.discountPercentage,
        discountType: user.promotionalCode.discountType,
        currentUses: user.promotionalCode.currentUses,
      }
    }),

  getUserInvoices: authProcedure.meta({ guards: ['user'] }).query(async ({ ctx }) => {
    const invoices = await Invoice.query()
      .preload('payment', (paymentQuery) => {
        void paymentQuery.preload('subscriptionPlan')
      })
      .where('userId', ctx.genericAuth.id)
      .orderBy('createdAt', 'desc')
      .limit(10)

    return invoices.map((invoice) => {
      // Determine the plan name
      let subscriptionPlanName = 'N/A'
      if (invoice.payment?.subscriptionPlan?.name) {
        subscriptionPlanName = invoice.payment.subscriptionPlan.name
      } else if (invoice.payment?.metadata?.intent === 'LESSON_PACK_3') {
        subscriptionPlanName = 'Pack 3 cours'
      } else if (invoice.lineItems && invoice.lineItems.length > 0) {
        // Try to get the name from line items
        subscriptionPlanName =
          (invoice.lineItems[0] as { description?: string })?.description ?? 'N/A'
      }

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.totalAmount,
        currency: invoice.currency,
        paidAt: invoice.paidAt,
        dueDate: invoice.dueDate,
        status: invoice.paidAt ? 'paid' : 'pending',
        subscriptionPlanName,
        stripeInvoiceId: invoice.stripeInvoiceId,
      }
    })
  }),

  getUserPayments: authProcedure.meta({ guards: ['user'] }).query(async ({ ctx }) => {
    const payments = await Payment.query()
      .preload('subscriptionPlan')
      .where('userId', ctx.genericAuth.id)
      .orderBy('createdAt', 'desc')
      .limit(10)

    return payments.map((payment) => {
      // Determine the plan name
      let subscriptionPlanName = 'N/A'
      if (payment.subscriptionPlan?.name) {
        subscriptionPlanName = payment.subscriptionPlan.name
      } else if (payment.metadata?.intent === 'LESSON_PACK_3') {
        subscriptionPlanName = 'Pack 3 cours'
      }

      return {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paidAt: payment.paidAt,
        subscriptionPlanName,
        stripePaymentIntentId: payment.stripePaymentIntentId,
        stripeInvoiceId: payment.stripeInvoiceId,
      }
    })
  }),

  downloadInvoice: authProcedure
    .meta({ guards: ['user'] })
    .input(z.object({ stripeInvoiceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await Invoice.query()
        .where('stripeInvoiceId', input.stripeInvoiceId)
        .where('userId', ctx.genericAuth.id)
        .first()

      if (!invoice) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Facture non trouvée',
        })
      }

      const stripePrivateApiKey = env.get('STRIPE_PRIVATE_API_KEY')
      const stripe = new Stripe(stripePrivateApiKey)

      try {
        const stripeInvoice = await stripe.invoices.retrieve(input.stripeInvoiceId)

        if (stripeInvoice.invoice_pdf) {
          return {
            pdfUrl: stripeInvoice.invoice_pdf,
            invoiceNumber: invoice.invoiceNumber,
          }
        } else {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'PDF de la facture non disponible',
          })
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors du téléchargement de la facture',
        })
      }
    }),

  getUserSubscriptionDetails: authProcedure.meta({ guards: ['user'] }).query(async ({ ctx }) => {
    return findUserSubscriptionDetails(
      new AdonisUserRepository(),
      new AdonisSubscriptionRepository(),
      ctx.genericAuth.id
    )
  }),

  checkFreeRegistrationAvailability: publicProcedure.query(async () => {
    const now = DateTime.now()

    // Récupérer la période active
    const activePeriod = await OneTimePeriodData.query().where('isActive', true).first()

    if (!activePeriod) {
      return {
        isAvailable: false,
        message: "Aucune période d'inscription gratuite active",
        period: null,
      }
    }

    // Vérifier si on est dans la période d'inscription (début inclus, début des cours exclus)
    const isInRegistrationPeriod =
      now >= activePeriod.beginningOfRegistrationDate && now < activePeriod.beginningOfPeriodDate

    return {
      isAvailable: isInRegistrationPeriod,
      message: isInRegistrationPeriod
        ? 'Inscription gratuite disponible !'
        : 'Inscription gratuite non disponible actuellement',
      period: {
        id: activePeriod.id,
        beginningOfRegistrationDate: activePeriod.beginningOfRegistrationDate,
        beginningOfPeriodDate: activePeriod.beginningOfPeriodDate,
        endOfPeriodDate: activePeriod.endOfPeriodDate,
        isActive: activePeriod.isActive,
      },
    }
  }),

  registerFreeUser: publicProcedure
    .input(freeUserRegistrationSchema)
    .mutation(async ({ input }) => {
      loggingService.info("Début de l'inscription gratuite", {
        action: 'register_free_user',
        email: input.email,
        role: input.role,
      })

      try {
        loggingService.warn("Tentative d'inscription gratuite sans période active", {
          action: 'register_free_user_no_active_period',
          email: input.email,
          role: input.role,
        })

        // Vérifier si un utilisateur avec cet email existe déjà (comparaison insensible à la casse)
        const existingUser = await User.query()
          .whereRaw('LOWER(email) = LOWER(?)', [input.email])
          .first()

        if (existingUser) {
          loggingService.warn("Tentative d'inscription avec un email déjà existant", {
            action: 'register_free_user_email_exists',
            email: input.email,
            role: input.role,
            existingUserId: existingUser.id,
          })

          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Un utilisateur avec cette adresse e-mail existe déjà.',
          })
        }

        // Créer le nouvel utilisateur
        const user = new User()
        user.firstName = input.firstName
        user.lastName = input.lastName
        user.email = input.email
        user.address = input.address
          ? {
            streetNumber: input.address.streetNumber,
            street: input.address.street,
            postalCode: input.address.postalCode,
            city: input.address.city,
            country: input.address.country,
          }
          : null
        user.role = input.role

        // Créer le code promotionnel personnel
        user.promotionalCodeId = await createPersonalPromotionalCode(
          user,
          new AdonisPromotionalCodeRepository()
        )

        // Sauvegarder l'utilisateur
        await user.save()

        // Créer les détails étudiants si c'est un étudiant
        if (user.role === 'STUDENT') {
          const studentDetails = new StudentDetails()
          studentDetails.userId = user.id
          if (input.grade) {
            studentDetails.grade = input.grade
          }
          if (input.parcoursupWishes) {
            studentDetails.parcoursupWishes = input.parcoursupWishes
          }
          await studentDetails.save()
        }

        // Créer le token d'inscription et envoyer l'email
        const userRegisterToken = new UserRegisterToken()
        userRegisterToken.token = randomUUID()
        userRegisterToken.userId = user.id
        await userRegisterToken.save()

        await sendMail({
          mailTemplate: 'REGISTER',
          emails: [user.email],
          params: { url: env.get('USER_BASE_URL'), token: userRegisterToken.token },
        })

        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          message: 'Inscription gratuite réussie. Un email de confirmation a été envoyé.',
        }
      } catch (error) {
        loggingService.error("Erreur lors de l'inscription gratuite", {
          action: 'register_free_user_error',
          email: input.email,
          role: input.role,
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      }
    }),

  getNextActivity: authProcedure.meta({ guards: ['user'] }).query(async ({ ctx }) => {
    const nextActivityService = new NextActivityService()
    return await nextActivityService.getNextActivity(ctx.genericAuth.id)
  }),

  sendPhoneVerificationCode: authProcedure
    .meta({ guards: ['user'] })
    .input(z.object({ phoneNumber: z.string() }))
    .mutation(async ({ ctx, input }) => {
      loggingService.info("Début de l'envoi du code de vérification SMS", {
        action: 'send_phone_verification_code',
        userId: ctx.genericAuth.id,
        phoneNumber: input.phoneNumber,
      })

      try {
        // Empêcher l'utilisation d'un numéro déjà attribué à un autre utilisateur
        const existingWithPhone = await User.query()
          .where('phoneNumber', input.phoneNumber)
          .whereNot('id', ctx.genericAuth.id)
          .first()
        if (existingWithPhone) {
          loggingService.warn('Tentative d’utilisation d’un numéro déjà utilisé', {
            action: 'send_phone_verification_code_phone_already_used',
            userId: ctx.genericAuth.id,
            phoneNumber: input.phoneNumber,
          })
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Ce numéro est déjà utilisé par un autre compte.',
          })
        }

        loggingService.info('Création du service SMS', {
          action: 'send_phone_verification_code_service_creation',
          userId: ctx.genericAuth.id,
          phoneNumber: input.phoneNumber,
        })

        const smsService = createSmsService()

        loggingService.info('Service SMS créé, appel de sendValidationCode', {
          action: 'send_phone_verification_code_service_ready',
          userId: ctx.genericAuth.id,
          phoneNumber: input.phoneNumber,
        })

        const result = await smsService.sendValidationCode(input.phoneNumber, ctx.genericAuth.id)

        if (!result.success) {
          loggingService.warn("Échec de l'envoi du code de vérification SMS", {
            action: 'send_phone_verification_code_failed',
            userId: ctx.genericAuth.id,
            phoneNumber: input.phoneNumber,
            error: result.error,
          })

          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error ?? "Erreur lors de l'envoi du code de vérification",
          })
        }

        loggingService.info('Code de vérification SMS envoyé avec succès', {
          action: 'send_phone_verification_code_success',
          userId: ctx.genericAuth.id,
          phoneNumber: input.phoneNumber,
          messageId: result.messageId,
        })

        return { success: true }
      } catch (error) {
        loggingService.error("Erreur lors de l'envoi du code de vérification SMS", {
          action: 'send_phone_verification_code_error',
          userId: ctx.genericAuth.id,
          phoneNumber: input.phoneNumber,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        })
        throw error
      }
    }),

  verifyPhoneCode: authProcedure
    .meta({ guards: ['user'] })
    .input(
      z.object({
        phoneNumber: z.string(),
        code: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      loggingService.info('Début de la vérification du code SMS', {
        action: 'verify_phone_code',
        userId: ctx.genericAuth.id,
        phoneNumber: input.phoneNumber,
      })

      try {
        const smsService = createSmsService()
        const result = await smsService.validateCode(input.phoneNumber, input.code)

        if (!result.isValid) {
          loggingService.warn('Code de vérification SMS invalide', {
            action: 'verify_phone_code_failed',
            userId: ctx.genericAuth.id,
            phoneNumber: input.phoneNumber,
            attempts: result.attempts,
            error: result.error,
          })

          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error ?? 'Code de vérification invalide',
          })
        }

        // Double-check de l'unicité avant mise à jour pour éviter une condition de course
        const existingWithPhone = await User.query()
          .where('phoneNumber', input.phoneNumber)
          .whereNot('id', ctx.genericAuth.id)
          .first()
        if (existingWithPhone) {
          loggingService.warn('Numéro déjà utilisé au moment de la vérification', {
            action: 'verify_phone_code_phone_already_used',
            userId: ctx.genericAuth.id,
            phoneNumber: input.phoneNumber,
          })
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Ce numéro est déjà utilisé par un autre compte.',
          })
        }

        // Mettre à jour le numéro de téléphone de l'utilisateur
        const user = await User.findBy('id', ctx.genericAuth.id)
        if (user) {
          user.phoneNumber = input.phoneNumber
          await user.save()

          loggingService.info('Numéro de téléphone vérifié et mis à jour avec succès', {
            action: 'verify_phone_code_success',
            userId: ctx.genericAuth.id,
            phoneNumber: input.phoneNumber,
            attempts: result.attempts,
          })
        } else {
          loggingService.warn(
            'Utilisateur non trouvé lors de la mise à jour du numéro de téléphone',
            {
              action: 'verify_phone_code_user_not_found',
              userId: ctx.genericAuth.id,
              phoneNumber: input.phoneNumber,
            }
          )
        }

        return { success: true }
      } catch (error) {
        loggingService.error('Erreur lors de la vérification du code SMS', {
          action: 'verify_phone_code_error',
          userId: ctx.genericAuth.id,
          phoneNumber: input.phoneNumber,
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      }
    }),

  sendEmailVerificationCode: authProcedure
    .meta({ guards: ['user'] })
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      loggingService.info("Début de l'envoi du code de vérification email", {
        action: 'send_email_verification_code',
        userId: ctx.genericAuth.id,
        email: input.email,
      })

      try {
        loggingService.info('Création du service Email', {
          action: 'send_email_verification_code_service_creation',
          userId: ctx.genericAuth.id,
          email: input.email,
        })

        const emailService = createEmailService()

        loggingService.info('Service Email créé, appel de sendVerificationCode', {
          action: 'send_email_verification_code_service_ready',
          userId: ctx.genericAuth.id,
          email: input.email,
        })

        const result = await emailService.sendVerificationCode(input.email, ctx.genericAuth.id)

        if (!result.success) {
          loggingService.warn("Échec de l'envoi du code de vérification email", {
            action: 'send_email_verification_code_failed',
            userId: ctx.genericAuth.id,
            email: input.email,
            error: result.error,
          })

          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error ?? "Erreur lors de l'envoi du code de vérification",
          })
        }

        loggingService.info('Code de vérification email envoyé avec succès', {
          action: 'send_email_verification_code_success',
          userId: ctx.genericAuth.id,
          email: input.email,
          messageId: result.messageId,
        })

        return { success: true }
      } catch (error) {
        loggingService.error("Erreur lors de l'envoi du code de vérification email", {
          action: 'send_email_verification_code_error',
          userId: ctx.genericAuth.id,
          email: input.email,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        })
        throw error
      }
    }),

  verifyEmailCode: authProcedure
    .meta({ guards: ['user'] })
    .input(
      z.object({
        email: z.string().email(),
        code: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      loggingService.info('Début de la vérification du code email', {
        action: 'verify_email_code',
        userId: ctx.genericAuth.id,
        email: input.email,
      })

      try {
        const emailService = createEmailService()
        const result = await emailService.validateCode(input.email, input.code)

        if (!result.success) {
          loggingService.warn('Code de vérification email invalide', {
            action: 'verify_email_code_failed',
            userId: ctx.genericAuth.id,
            email: input.email,
            error: result.error,
          })

          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error ?? 'Code de vérification invalide',
          })
        }

        // Mettre à jour l'email de l'utilisateur
        const user = await User.findBy('id', ctx.genericAuth.id)
        if (user) {
          user.email = input.email
          await user.save()

          loggingService.info("Email de l'utilisateur mis à jour avec succès", {
            action: 'verify_email_code_user_update',
            userId: ctx.genericAuth.id,
            email: input.email,
          })
        }

        loggingService.info('Code de vérification email validé avec succès', {
          action: 'verify_email_code_success',
          userId: ctx.genericAuth.id,
          email: input.email,
        })

        return { success: true }
      } catch (error) {
        loggingService.error('Erreur lors de la vérification du code email', {
          action: 'verify_email_code_error',
          userId: ctx.genericAuth.id,
          email: input.email,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        })
        throw error
      }
    }),

  cleanupExpiredEmailCodes: authProcedure.meta({ guards: ['user'] }).mutation(async ({ ctx }) => {
    loggingService.info('Nettoyage des codes email expirés', {
      action: 'cleanup_expired_email_codes',
      userId: ctx.genericAuth.id,
    })

    try {
      const emailService = createEmailService()
      await emailService.cleanupExpiredCodes()

      loggingService.info('Codes email expirés nettoyés avec succès', {
        action: 'cleanup_expired_email_codes_success',
        userId: ctx.genericAuth.id,
      })

      return { success: true }
    } catch (error) {
      loggingService.error('Erreur lors du nettoyage des codes email expirés', {
        action: 'cleanup_expired_email_codes_error',
        userId: ctx.genericAuth.id,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }),
}
