import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import PastPaper from '#models/past_paper'
import { deleteFile, type FileDto, getFile } from '#services/file_service'
import { authProcedure, router } from '#services/trpc_service'

export interface PastPaperDto {
  id: string
  name: string
  pastPaper: FileDto | null
  pastPaperCorrection: FileDto | null
}

export const pastPaperRouter = router({
  getAll: authProcedure
    .meta({ guards: ['admin', 'user'] })
    .query<PastPaperDto[]>(async ({ ctx }) => {
      void ctx
      const pastPapers = await PastPaper.query()
      return Promise.all(
        pastPapers.map(async (pastPaper) => ({
          id: pastPaper.id,
          name: pastPaper.name,
          pastPaper: pastPaper.pastPaper ? await getFile(pastPaper.pastPaper) : null,
          pastPaperCorrection: pastPaper.pastPaperCorrection
            ? await getFile(pastPaper.pastPaperCorrection)
            : null,
        }))
      )
    }),

  getOneById: authProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query<PastPaperDto>(async ({ input }) => {
      const pastPaper = await PastPaper.findBy('id', input.id)
      if (!pastPaper) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Past paper not found',
        })
      }
      return {
        id: pastPaper.id,
        name: pastPaper.name,
        pastPaper: pastPaper.pastPaper ? await getFile(pastPaper.pastPaper) : null,
        pastPaperCorrection: pastPaper.pastPaperCorrection
          ? await getFile(pastPaper.pastPaperCorrection)
          : null,
      }
    }),

  getRelatedPastPapersIdsAndNames: authProcedure
    .input(z.object({ pastPaperId: z.string().uuid() }))
    .meta({ guards: ['user'] })
    .query(async ({ input }) => {
      const pastPaper = await PastPaper.findBy('id', input.pastPaperId)
      if (!pastPaper) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Past paper not found',
        })
      }

      const relatedPastPapers = await PastPaper.query()
        .where('id', '!=', input.pastPaperId)
        .orderByRaw('RANDOM()')
        .limit(3)
      return relatedPastPapers.map((relatedPastPaper) => ({
        id: relatedPastPaper.id,
        name: relatedPastPaper.name,
      }))
    }),

  create: authProcedure
    .input(
      z.object({
        name: z.string(),
        pastPaper: z.string().nullable().optional(),
        pastPaperCorrection: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const pastPaper = new PastPaper()
      pastPaper.name = input.name
      pastPaper.pastPaper = input.pastPaper ?? null
      pastPaper.pastPaperCorrection = input.pastPaperCorrection ?? null

      await pastPaper.save()
      return { success: true }
    }),

  edit: authProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        pastPaper: z.string().nullable().optional(),
        pastPaperCorrection: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const pastPaper = await PastPaper.findBy('id', input.id)
      if (!pastPaper) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Past paper not found',
        })
      }

      pastPaper.name = input.name

      // Delete old files if being replaced
      if (input.pastPaper !== undefined) {
        if (pastPaper.pastPaper && input.pastPaper !== pastPaper.pastPaper) {
          await deleteFile(pastPaper.pastPaper)
        }
        pastPaper.pastPaper = input.pastPaper
      }

      if (input.pastPaperCorrection !== undefined) {
        if (
          pastPaper.pastPaperCorrection &&
          input.pastPaperCorrection !== pastPaper.pastPaperCorrection
        ) {
          await deleteFile(pastPaper.pastPaperCorrection)
        }
        pastPaper.pastPaperCorrection = input.pastPaperCorrection
      }

      await pastPaper.save()
      return { success: true }
    }),

  delete: authProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => {
    const pastPaper = await PastPaper.findBy('id', input.id)
    if (!pastPaper) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Past paper not found',
      })
    }

    // Delete associated files
    if (pastPaper.pastPaper) {
      await deleteFile(pastPaper.pastPaper)
    }
    if (pastPaper.pastPaperCorrection) {
      await deleteFile(pastPaper.pastPaperCorrection)
    }

    await pastPaper.delete()
    return { success: true }
  }),
})
