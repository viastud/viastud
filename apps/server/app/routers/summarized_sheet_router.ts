import { TRPCError } from '@trpc/server'
import type { Grade, Subject } from '@viastud/utils'
import { z } from 'zod'

import Module from '#models/module'
import SummarizedSheet from '#models/summarized_sheet'
import { deleteFile, type FileDto, getFile } from '#services/file_service'
import { authProcedure, router } from '#services/trpc_service'

export interface SummarizedSheetDto {
  id: string
  moduleId: number
  module: {
    id: number
    name: string
    grade: Grade
    subject: Subject
  }
  summarizedSheet: FileDto | null
}

export const summarizedSheetRouter = router({
  getAll: authProcedure.query<SummarizedSheetDto[]>(async ({ ctx }) => {
    void ctx
    const summarizedSheets = await SummarizedSheet.query().preload('module')
    return Promise.all(
      summarizedSheets.map(async (summarizedSheet) => ({
        id: summarizedSheet.id,
        moduleId: summarizedSheet.moduleId,
        module: {
          id: summarizedSheet.module.id,
          name: summarizedSheet.module.name,
          grade: summarizedSheet.module.grade,
          subject: summarizedSheet.module.subject,
        },
        summarizedSheet: summarizedSheet.summarizedSheet
          ? await getFile(summarizedSheet.summarizedSheet)
          : null,
      }))
    )
  }),

  getByModuleId: authProcedure
    .input(z.object({ moduleId: z.number() }))
    .query<SummarizedSheetDto | null>(async ({ input }) => {
      const summarizedSheet = await SummarizedSheet.query()
        .where('moduleId', input.moduleId)
        .preload('module')
        .first()

      if (!summarizedSheet) {
        return null
      }

      return {
        id: summarizedSheet.id,
        moduleId: summarizedSheet.moduleId,
        module: {
          id: summarizedSheet.module.id,
          name: summarizedSheet.module.name,
          grade: summarizedSheet.module.grade,
          subject: summarizedSheet.module.subject,
        },
        summarizedSheet: summarizedSheet.summarizedSheet
          ? await getFile(summarizedSheet.summarizedSheet)
          : null,
      }
    }),

  create: authProcedure
    .input(
      z.object({
        moduleId: z.number(),
        summarizedSheet: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const module = await Module.findBy('id', input.moduleId)
      if (!module) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Module not found',
        })
      }

      const existingSummarizedSheet = await SummarizedSheet.findBy('moduleId', input.moduleId)
      if (existingSummarizedSheet) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Past paper already exists for this module',
        })
      }

      const summarizedSheet = new SummarizedSheet()
      summarizedSheet.moduleId = input.moduleId
      summarizedSheet.summarizedSheet = input.summarizedSheet ?? null

      await summarizedSheet.save()
      return { success: true }
    }),

  edit: authProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        summarizedSheet: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const summarizedSheet = await SummarizedSheet.findBy('id', input.id)
      if (!summarizedSheet) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Past paper not found',
        })
      }

      // Delete old files if being replaced
      if (input.summarizedSheet !== undefined) {
        if (
          summarizedSheet.summarizedSheet &&
          input.summarizedSheet !== summarizedSheet.summarizedSheet
        ) {
          await deleteFile(summarizedSheet.summarizedSheet)
        }
        summarizedSheet.summarizedSheet = input.summarizedSheet
      }

      await summarizedSheet.save()
      return { success: true }
    }),

  delete: authProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => {
    const summarizedSheet = await SummarizedSheet.findBy('id', input.id)
    if (!summarizedSheet) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Past paper not found',
      })
    }

    // Delete associated files
    if (summarizedSheet.summarizedSheet) {
      await deleteFile(summarizedSheet.summarizedSheet)
    }

    await summarizedSheet.delete()
    return { success: true }
  }),
})
