import hash from '@adonisjs/core/services/hash'
import { TRPCError } from '@trpc/server'
import { editProfileSchema, loginSchema } from '@viastud/utils'
import { z } from 'zod'

import Admin from '#models/admin'
import { authProcedure, publicProcedure } from '#services/trpc_service'

import { loggingService } from '../services/logging_service.js'

export interface AdminDto {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
}

export const adminAuthRouter = {
  login: publicProcedure.input(loginSchema).mutation<AdminDto>(async ({ ctx, input }) => {
    const { email, password } = input

    try {
      const verifiedAdmin = await Admin.verifyCredentials(email, password)

      await ctx.auth.use('admin').login(verifiedAdmin)
      ctx.session.put('admin_session_version', verifiedAdmin.sessionVersion ?? 1)

      loggingService.info(
        'Connexion admin réussie',
        {
          adminId: verifiedAdmin.id,
          email: verifiedAdmin.email,
          action: 'admin_login',
        },
        'business'
      )

      return {
        id: verifiedAdmin.id,
        email: verifiedAdmin.email,
        firstName: verifiedAdmin.firstName,
        lastName: verifiedAdmin.lastName,
        phoneNumber: verifiedAdmin.phoneNumber,
      }
    } catch (error) {
      loggingService.error(
        'Erreur lors de la connexion admin',
        {
          email,
          action: 'admin_login',
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        },
        'business'
      )
      throw error
    }
  }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    await ctx.auth.use('admin').logout()
    return {}
  }),

  changePassword: authProcedure
    .meta({ guards: ['admin'] })
    .input(z.object({ oldPassword: z.string(), newPassword: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const admin = await Admin.findBy('id', ctx.genericAuth.id)
      if (!admin) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid user ID',
        })
      }
      const isPasswordValid = await hash.verify(admin.password ?? '', input.oldPassword)
      if (!isPasswordValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid old password',
        })
      }
      admin.password = input.newPassword
      const oldVersion = admin.sessionVersion ?? 1
      admin.sessionVersion = oldVersion + 1

      await admin.save()
      await ctx.auth.use('admin').logout()
      return { message: 'Password changed successfully' }
    }),

  edit: authProcedure
    .meta({ guards: ['admin'] })
    .input(editProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const admin = await Admin.findBy('id', ctx.genericAuth.id)
      if (!admin) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid user ID',
        })
      }
      if (input.id !== ctx.genericAuth.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You are not authorized to edit this admin',
        })
      }
      admin.email = input.email
      admin.firstName = input.firstName
      admin.lastName = input.lastName
      await admin.save()
      return {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        phoneNumber: admin.phoneNumber,
      }
    }),

  getAdmin: authProcedure.query<AdminDto>(async ({ ctx }) => {
    const admin = await ctx.auth.use('admin').authenticate()

    return {
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      phoneNumber: admin.phoneNumber,
    }
  }),
}
