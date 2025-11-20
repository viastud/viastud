import { TRPCError } from '@trpc/server'
import type { Grade, Subject } from '@viastud/utils'
import { addExerciceSchema, editExerciceSchema } from '@viastud/utils'
import { z } from 'zod'

import Exercice from '#models/exercice'
import Module from '#models/module'
import { type FileDto, getFile } from '#services/file_service'
import { authProcedure, router } from '#services/trpc_service'

export interface ExerciceDto {
  id: number
  name: string
  module?: { id: number; name: string }
  chapter?: { id: number; name: string }
  grade: Grade
  subject: Subject
  type: 'application' | 'training' | 'bilan'
  content: string
  images: FileDto[]
  isCorrection: boolean
}

export const exerciceRouter = router({
  getAll: authProcedure
    .meta({ guards: ['admin', 'user'] })
    .query<ExerciceDto[]>(async ({ ctx }) => {
      void ctx
      const exercices = await Exercice.query()
        .preload('module')
        .preload('chapter', (chapterQuery) => {
          void chapterQuery.preload('module')
        })
        .preload('task', (taskQuery) => {
          void taskQuery.preload('module')
        })
        .preload('images')
        .orderBy('is_correction', 'asc') // Exercices (false) en premier, corrections (true) en second
      return Promise.all(
        exercices.map(async (exercice) => {
          const isBilan = exercice.exerciseType === 'bilan'
          const gradeValue = isBilan
            ? (exercice.chapter?.grade ?? exercice.chapter?.module?.[0]?.grade)
            : (exercice.module?.grade ?? exercice.task?.module?.grade)
          const subjectValue = isBilan
            ? (exercice.chapter?.subject ?? exercice.chapter?.module?.[0]?.subject)
            : (exercice.module?.subject ?? exercice.task?.module?.subject)
          if (!gradeValue || !subjectValue) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Missing grade or subject on exercice',
            })
          }
          return {
            id: exercice.id,
            name: exercice.name,
            module: !isBilan
              ? exercice.moduleId
                ? { id: exercice.module.id, name: exercice.module.name }
                : exercice.task?.module
                  ? { id: exercice.task.module.id, name: exercice.task.module.name }
                  : undefined
              : undefined,
            chapter:
              exercice.chapterId && isBilan
                ? { id: exercice.chapter.id, name: exercice.chapter.name }
                : undefined,
            grade: gradeValue,
            subject: subjectValue,
            type: exercice.exerciseType,
            images: await Promise.all(exercice.images.map((image) => getFile(image.id))),
            content: exercice.content,
            isCorrection: !!exercice.isCorrection,
          }
        })
      )
    }),

  getByChapterId: authProcedure
    .meta({ guards: ['admin', 'user'] })
    .input(z.object({ chapterId: z.number() }))
    .query<ExerciceDto[]>(async ({ input }) => {
      const exercices = await Exercice.query()
        .preload('chapter', (chapterQuery) => {
          void chapterQuery.preload('module')
        })
        .preload('images')
        .where('chapter_id', input.chapterId)
        .andWhere('exercise_type', 'bilan')
        .orderBy('is_correction', 'asc') // Exercices (false) en premier, corrections (true) en second
      return Promise.all(
        exercices.map(async (exercice) => {
          const chapterGrade = exercice.chapter?.grade ?? exercice.chapter?.module?.[0]?.grade
          const chapterSubject = exercice.chapter?.subject ?? exercice.chapter?.module?.[0]?.subject
          if (!chapterGrade || !chapterSubject) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Missing grade or subject on chapter',
            })
          }
          return {
            id: exercice.id,
            name: exercice.name,
            chapter: { id: exercice.chapter.id, name: exercice.chapter.name },
            grade: chapterGrade,
            subject: chapterSubject,
            type: exercice.exerciseType,
            images: await Promise.all(exercice.images.map((image) => getFile(image.id))),
            content: exercice.content,
            isCorrection: !!exercice.isCorrection,
          }
        })
      )
    }),

  create: authProcedure
    .input(
      addExerciceSchema.and(
        z.object({
          images: z.array(z.string()),
          exercicePdfId: z.string().uuid(),
        })
      )
    )
    .meta({ guards: ['admin'] })
    .mutation(async ({ input }) => {
      const exercice = new Exercice()
      exercice.name = input.name
      exercice.content = input.content
      exercice.exerciseType = input.type
      exercice.isCorrection = input.isCorrection ?? false
      if (input.type === 'bilan') {
        const chapterModule = await import('#models/chapter')
        const Chapter = chapterModule.default
        const chapter = await Chapter.findBy('id', Number(input.chapterId))
        if (!chapter) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid chapter ID' })
        }
        await exercice.related('chapter').associate(chapter)
      } else {
        const module = await Module.findBy('id', Number(input.moduleId))
        if (!module) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid module ID' })
        }
        await exercice.related('module').associate(module)
      }
      exercice.exercicePdfId = input.exercicePdfId
      await exercice.save()
      const uniqueImageIds = Array.from(new Set(input.images))
      await exercice.related('images').attach(uniqueImageIds)
      return { message: 'Exercice added successfully' }
    }),

  edit: authProcedure
    .input(
      editExerciceSchema.and(
        z.object({
          images: z.array(z.string()),
          exercicePdfId: z.string().uuid(),
        })
      )
    )
    .meta({ guards: ['admin'] })
    .mutation(async ({ input }) => {
      const exercice = await Exercice.findBy('id', input.id)
      if (!exercice) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid exercice ID',
        })
      }
      exercice.name = input.name
      exercice.exerciseType = input.type
      exercice.isCorrection = input.isCorrection ?? false
      if (input.type === 'bilan') {
        const chapterModule = await import('#models/chapter')
        const Chapter = chapterModule.default
        const chapter = await Chapter.findBy('id', Number(input.chapterId))
        if (!chapter) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid chapter ID' })
        }
        await exercice.related('chapter').associate(chapter)
        exercice.moduleId = null
      } else {
        const module = await Module.findBy('id', Number(input.moduleId))
        if (!module) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid module ID' })
        }
        await exercice.related('module').associate(module)
        exercice.chapterId = null
      }
      exercice.exercicePdfId = input.exercicePdfId
      await exercice.save()
      const uniqueImageIds = Array.from(new Set(input.images))
      await exercice.related('images').sync(uniqueImageIds)
      return { message: 'Exercice edited successfully' }
    }),

  delete: authProcedure
    .input(z.number())
    .meta({ guards: ['admin'] })
    .mutation(async ({ input }) => {
      const exercice = await Exercice.findBy('id', input)
      if (!exercice) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid exercice ID',
        })
      }
      await exercice.delete()
      return { message: 'Exercice deleted successfully' }
    }),
})
