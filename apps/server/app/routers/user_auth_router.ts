import { randomUUID } from 'node:crypto'

import hash from '@adonisjs/core/services/hash'
import { TRPCError } from '@trpc/server'
import type { Grade, SubscriptionStatus, UserRole } from '@viastud/utils'
import { loginSchema } from '@viastud/utils'
import { z } from 'zod'

import StudentDetails from '#models/student_details'
import User, { type Address } from '#models/user'
import UserRegisterToken from '#models/user_register_token'
import { AdonisUnitOfWork } from '#services/adonis_unit_of_work'
import LessonTokenService from '#services/lesson_token_service'
import { sendMail } from '#services/send_mail_service'
import { authProcedure, publicProcedure } from '#services/trpc_service'
import env from '#start/env'

import TokenBalanceRepository from '../infrastructure/adonis_token_balance.repository.js'
import TokenEventRepository from '../infrastructure/adonis_token_event_repository.js'
import { loggingService } from '../services/logging_service.js'

export interface UserDto {
  id: string
  email: string
  firstName: string
  lastName: string
  phoneNumber: string
  address: Address
  role: UserRole | null
  grade: Grade | null
  hasSubscription: boolean
  subscriptionStatus: SubscriptionStatus | null
  subscriptionPlanName: string | null
  createdAt: Date
}

export interface ReducedUserDto {
  id: string
  email: string
  firstName: string
  lastName: string
  phoneNumber: string | null
}

export const userAuthRouter = {
  register: publicProcedure
    .input(
      z.object({
        token: z.string().uuid(),
        password: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { token, password } = input

      try {
        const userToken = await UserRegisterToken.findBy('token', token)
        if (!userToken) {
          loggingService.warn(
            "Tentative d'inscription avec un token invalide",
            {
              token,
              action: 'register',
            },
            'business'
          )
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: "Ce lien de connexion n'est pas valide",
          })
        }

        const user = await User.findBy('id', userToken.userId)
        if (!user) {
          loggingService.error(
            "Utilisateur non trouvé lors de l'inscription",
            {
              token,
              userId: userToken.userId,
              action: 'register',
            },
            'business'
          )
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: "Ce lien de connexion n'est pas valide.",
          })
        }

        user.password = password
        await user.save()
        await userToken.delete()

        await ctx.auth.use('user').login(user)
        ctx.session.put('user_session_version', user.sessionVersion ?? 1)

        // Crédit d'accueil: 1 jeton gratuit à l'inscription
        try {
          const tokenService = new LessonTokenService(
            new TokenBalanceRepository(),
            new TokenEventRepository(),
            new AdonisUnitOfWork()
          )
          await tokenService.creditSignupBonus(user.id)
          loggingService.info(
            'Crédit de jeton de bienvenue appliqué',
            { userId: user.id, action: 'register' },
            'business'
          )
        } catch (e) {
          loggingService.error(
            'Échec du crédit de jeton de bienvenue',
            {
              userId: user.id,
              action: 'register',
              error: e instanceof Error ? e.message : String(e),
            },
            'business'
          )
        }

        // Charger les détails étudiant et l'abonnement
        const studentDetails = await StudentDetails.findBy('userId', user.id)
        await user.load('subscription', (query) => {
          void query.preload('subscriptionPlan')
        })

        loggingService.info(
          'Inscription réussie',
          {
            userId: user.id,
            email: user.email,
            action: 'register',
          },
          'business'
        )
        return {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            address:
              typeof user.address === 'object' && user.address !== null
                ? user.address
                : {
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
          },
          role: user.role,
        }
      } catch (error) {
        loggingService.error(
          "Erreur lors de l'inscription",
          {
            token,
            action: 'register',
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          },
          'business'
        )
        throw error
      }
    }),

  login: publicProcedure
    .input(loginSchema)
    .mutation<{ user: UserDto; role: UserRole }>(async ({ ctx, input }) => {
      const { email, password } = input

      try {
        const verifiedUser = await User.verifyCredentials(email, password)

        await ctx.auth.use('user').login(verifiedUser)
        ctx.session.put('user_session_version', verifiedUser.sessionVersion ?? 1)

        if (!verifiedUser.role) {
          loggingService.warn(
            'Tentative de connexion avec un utilisateur non enregistré',
            {
              email,
              userId: verifiedUser.id,
              action: 'login',
            },
            'business'
          )
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'User not registered yet',
          })
        }

        // Charger les détails étudiant et l'abonnement
        const studentDetails = await StudentDetails.findBy('userId', verifiedUser.id)
        await verifiedUser.load('subscription', (query) => {
          void query.preload('subscriptionPlan')
        })

        loggingService.info(
          'Connexion réussie',
          {
            userId: verifiedUser.id,
            email: verifiedUser.email,
            action: 'login',
          },
          'business'
        )

        return {
          user: {
            id: verifiedUser.id,
            email: verifiedUser.email,
            firstName: verifiedUser.firstName,
            lastName: verifiedUser.lastName,
            phoneNumber: verifiedUser.phoneNumber,
            address:
              typeof verifiedUser.address === 'object' && verifiedUser.address !== null
                ? verifiedUser.address
                : {
                    streetNumber: '',
                    street: '',
                    postalCode: '',
                    city: '',
                    country: '',
                  },
            role: verifiedUser.role,
            grade: studentDetails?.grade ?? null,
            hasSubscription: !!verifiedUser.subscription,
            subscriptionStatus: verifiedUser.subscription?.status ?? null,
            subscriptionPlanName: verifiedUser.subscription?.subscriptionPlan?.name ?? null,
            createdAt: verifiedUser.createdAt.toJSDate(),
          },
          role: verifiedUser.role,
        }
      } catch (error) {
        loggingService.error(
          'Erreur lors de la connexion',
          {
            email,
            action: 'login',
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          },
          'business'
        )
        throw error
      }
    }),

  logout: authProcedure.meta({ guards: ['user'] }).mutation(async ({ ctx }) => {
    await ctx.auth.use('user').logout()
    return {}
  }),

  getUser: authProcedure.meta({ guards: ['user'] }).query<UserDto>(async ({ ctx }) => {
    const user = await ctx.auth.use('user').authenticate()

    // Charger les détails étudiant et l'abonnement
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
      address:
        typeof user.address === 'object' && user.address !== null
          ? user.address
          : {
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

  changePassword: authProcedure
    .meta({ guards: ['user'] })
    .input(z.object({ oldPassword: z.string(), newPassword: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await User.findBy('id', ctx.genericAuth.id)
      if (!user) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid user ID',
        })
      }
      const isPasswordValid = await hash.verify(user.password ?? '', input.oldPassword)
      if (!isPasswordValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid old password',
        })
      }
      user.password = input.newPassword
      user.sessionVersion = (user.sessionVersion ?? 1) + 1

      await user.save()
      await ctx.auth.use('user').logout()
      return { message: 'Password changed successfully' }
    }),

  sendResetPasswordMail: publicProcedure.input(z.string()).mutation(async ({ input }) => {
    const user = await User.query().whereRaw('LOWER(email) = LOWER(?)', [input]).first()
    if (!user) {
      return
    }

    const registerToken = new UserRegisterToken()
    registerToken.token = randomUUID()
    registerToken.userId = user.id
    await registerToken.save()

    await sendMail({
      mailTemplate: 'RESET_PASSWORD',
      emails: [input],
      params: {
        url: env.get('USER_BASE_URL'),
        token: registerToken.token,
        firstName: user.firstName,
      },
    })
    return { message: 'Email sent successfully' }
  }),

  resetPassword: publicProcedure
    .input(z.object({ token: z.string().uuid(), password: z.string() }))
    .mutation(async ({ input }) => {
      const userToken = await UserRegisterToken.findBy('token', input.token)
      if (!userToken) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: "Ce lien de connexion n'est pas valide",
        })
      }

      const user = await User.findBy('id', userToken.userId)
      if (!user) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: "Ce lien de connexion n'est pas valide.",
        })
      }

      user.password = input.password

      await user.save()
      await userToken.delete()
      return { message: 'Password changed successfully' }
    }),
}
