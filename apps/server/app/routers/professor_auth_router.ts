import { randomUUID } from 'node:crypto'

import hash from '@adonisjs/core/services/hash'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import Professor from '#models/professor'
import ProfessorRegisterToken from '#models/professor_register_token'
import { sendMail } from '#services/send_mail_service'
import { authProcedure, publicProcedure } from '#services/trpc_service'
import env from '#start/env'

export interface ReducedProfessorDto {
  id: string
  email: string
  firstName: string
  lastName: string
  phoneNumber: string
}

export const professorAuthRouter = {
  register: publicProcedure
    .input(z.object({ token: z.string().uuid(), password: z.string() }))
    .mutation<ReducedProfessorDto>(async ({ ctx, input }) => {
      const { token, password } = input

      const professorToken = await ProfessorRegisterToken.findBy('token', token)
      if (!professorToken) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: "Ce lien de connexion n'est pas valide",
        })
      }
      const professor = await Professor.findBy('id', professorToken.professorId)
      if (!professor) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: "Ce lien de connexion n'est pas valide",
        })
      }
      professor.password = password
      await professor.save()
      await professorToken.delete()

      await ctx.auth.use('professor').login(professor)
      ctx.session.put('professor_session_version', professor.sessionVersion ?? 1)
      return {
        id: professor.id,
        email: professor.email,
        firstName: professor.firstName,
        lastName: professor.lastName,
        phoneNumber: professor.phoneNumber,
      }
    }),

  login: publicProcedure
    .input(z.object({ email: z.string(), password: z.string() }))
    .mutation<ReducedProfessorDto>(async ({ ctx, input }) => {
      const { email, password } = input

      const verifiedProfessor = await Professor.verifyCredentials(email, password)

      await ctx.auth.use('professor').login(verifiedProfessor)
      ctx.session.put('professor_session_version', verifiedProfessor.sessionVersion ?? 1)

      return {
        id: verifiedProfessor.id,
        email: verifiedProfessor.email,
        firstName: verifiedProfessor.firstName,
        lastName: verifiedProfessor.lastName,
        phoneNumber: verifiedProfessor.phoneNumber,
      }
    }),

  logout: authProcedure.meta({ guards: ['professor'] }).mutation(async ({ ctx }) => {
    await ctx.auth.use('professor').logout()
    return {}
  }),

  getProfessor: authProcedure
    .meta({ guards: ['professor'] })
    .query<ReducedProfessorDto>(async ({ ctx }) => {
      const professor = await ctx.auth.use('professor').authenticate()

      return {
        id: professor.id,
        email: professor.email,
        firstName: professor.firstName,
        lastName: professor.lastName,
        phoneNumber: professor.phoneNumber,
      }
    }),

  changePassword: authProcedure
    .meta({ guards: ['professor'] })
    .input(z.object({ oldPassword: z.string(), newPassword: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const professor = await Professor.findBy('id', ctx.genericAuth.id)
      if (!professor) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid professor ID',
        })
      }
      const isPasswordValid = await hash.verify(professor.password ?? '', input.oldPassword)
      if (!isPasswordValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid old password',
        })
      }
      professor.password = input.newPassword
      professor.sessionVersion = (professor.sessionVersion ?? 1) + 1

      await professor.save()
      await ctx.auth.use('professor').logout()
      return { message: 'Password changed successfully' }
    }),

  sendResetPasswordMail: publicProcedure.input(z.string()).mutation(async ({ input }) => {
    const professor = await Professor.query().whereRaw('LOWER(email) = LOWER(?)', [input]).first()
    if (!professor) {
      return
    }

    const registerToken = new ProfessorRegisterToken()
    registerToken.token = randomUUID()
    registerToken.professorId = professor.id
    await registerToken.save()

    await sendMail({
      mailTemplate: 'RESET_PASSWORD',
      emails: [input],
      params: {
        url: env.get('PROFESSOR_BASE_URL'),
        token: registerToken.token,
        firstName: professor.firstName,
      },
    })
    return { message: 'Email sent successfully' }
  }),

  resetPassword: publicProcedure
    .input(z.object({ token: z.string().uuid(), password: z.string() }))
    .mutation(async ({ input }) => {
      const professorToken = await ProfessorRegisterToken.findBy('token', input.token)
      if (!professorToken) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: "Ce lien de connexion n'est pas valide",
        })
      }

      const professor = await Professor.findBy('id', professorToken.professorId)
      if (!professor) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: "Ce lien de connexion n'est pas valide.",
        })
      }

      professor.password = input.password

      await professor.save()
      await professorToken.delete()
      return { message: 'Password changed successfully' }
    }),
}
