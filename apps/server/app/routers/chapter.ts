import { TRPCError } from '@trpc/server'
import { addChapterSchema, editChapterSchema } from '@viastud/utils'
import { z } from 'zod'

import Chapter from '#models/chapter'
import { authProcedure, router } from '#services/trpc_service'

export interface ChapterDto {
  id: number
  name: string
  order: number
}

export const chapterRouter = router({
  getAll: authProcedure.meta({ guards: ['admin'] }).query<ChapterDto[]>(async ({ ctx }) => {
    void ctx
    const chapters = await Chapter.query().orderBy('order', 'asc').orderBy('id', 'asc')
    return chapters
  }),

  create: authProcedure
    .meta({ guards: ['admin'] })
    .input(addChapterSchema)
    .mutation(async ({ input }) => {
      const chapter = new Chapter()
      chapter.name = input.name

      await chapter.save()
      return { message: 'Chapitre ajouté avec succès' }
    }),

  edit: authProcedure
    .meta({ guards: ['admin'] })
    .input(editChapterSchema)
    .mutation(async ({ input }) => {
      const chapter = await Chapter.findBy('id', input.id)
      if (!chapter) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid chapter ID',
        })
      }
      chapter.name = input.name

      await chapter.save()
      return { message: 'Chapitre modifié avec succès' }
    }),

  delete: authProcedure
    .meta({ guards: ['admin'] })
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const chapter = await Chapter.findBy('id', input.id)
      if (!chapter) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid chapter ID',
        })
      }

      await chapter.delete()
      return { message: 'Chapitre supprimé avec succès' }
    }),
})
