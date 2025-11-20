import { TRPCError } from '@trpc/server'
import type { Grade, Subject } from '@viastud/utils'
import { addSheetSchema, editSheetSchema, grade, type Level, subject } from '@viastud/utils'
import { z } from 'zod'

import Exercice from '#models/exercice'
import Module from '#models/module'
import Sheet from '#models/sheet'
import SheetRating from '#models/sheet_rating'
import Slot from '#models/slot'
import StudentDetails from '#models/student_details'
import StudentTaskActivity from '#models/student_task_activity'
import SummarizedSheet from '#models/summarized_sheet'
import User from '#models/user'
import { deleteFile, type FileDto, getFile, getFileUrl } from '#services/file_service'
import { authProcedure, router } from '#services/trpc_service'
import env from '#start/env'

export interface SheetDto {
  id: number
  name: string
  description: string
  level: Level
  module: { id: number; name: string }
  grade: Grade
  subject: Subject
  isVisible: boolean
  score: number | null
  content: string
  images: FileDto[]
}

export interface SheetMinimalDto {
  id: number
  name: string
  level: Level
}

export const sheetRouter = router({
  getAll: authProcedure.query<SheetDto[]>(async ({ ctx }) => {
    void ctx
    const sheets = await Sheet.query().preload('module').preload('images').preload('sheetRatings')
    return Promise.all(
      sheets.map(async (sheet) => ({
        id: sheet.id,
        name: sheet.name,
        description: sheet.description,
        level: sheet.level,
        module: { id: sheet.module.id, name: sheet.module.name },
        grade: sheet.module.grade,
        subject: sheet.module.subject,
        isVisible: sheet.isVisible,
        images: await Promise.all(sheet.images.map((image) => getFile(image.id))),
        content: sheet.content,
        score:
          sheet.sheetRatings.length !== 0
            ? Math.round(
                sheet.sheetRatings
                  .map((sheetRating) => sheetRating.rating)
                  .reduce((acc, rating) => acc + rating)
              )
            : null,
      }))
    )
  }),

  getMinimalByGradeSubject: authProcedure
    .meta({ guards: ['user', 'professor'] })
    .input(z.object({ grade: z.enum(grade), subject: z.enum(subject) }))
    .query<SheetMinimalDto[]>(async ({ input }) => {
      const sheets = await Sheet.query().preload('module').where('isVisible', true)
      const filteredSheets = sheets.filter(
        (sheet) => sheet.module.grade === input.grade && sheet.module.subject === input.subject
      )

      const sortedSheets = filteredSheets.sort((a, b) => {
        const getNumberFromName = (name: string): number => {
          const match = /(\d+)/.exec(name)
          return match ? Number.parseInt(match[1]) : 0
        }
        const numA = getNumberFromName(a.name)
        const numB = getNumberFromName(b.name)

        return numA - numB
      })

      return sortedSheets.map((sheet) => ({
        id: sheet.id,
        name: sheet.name,
        level: sheet.level,
      }))
    }),

  getMinimalByModule: authProcedure
    .meta({ guards: ['user', 'professor', 'admin'] })
    .input(z.object({ moduleId: z.number() }))
    .query<SheetMinimalDto[]>(async ({ input }) => {
      const sheets = await Sheet.query()
        .where('moduleId', input.moduleId)
        .andWhere('isVisible', true)

      const sortedSheets = sheets.sort((a, b) => {
        const getNumberFromName = (name: string): number => {
          const match = /(\d+)/.exec(name)
          return match ? Number.parseInt(match[1]) : 0
        }
        const numA = getNumberFromName(a.name)
        const numB = getNumberFromName(b.name)

        return numA - numB
      })

      return sortedSheets.map((sheet) => ({
        id: sheet.id,
        name: sheet.name,
        level: sheet.level,
      }))
    }),

  getSheetAndAssociatedContentById: authProcedure
    .meta({ guards: ['user'] })
    .input(z.object({ sheetId: z.number() }))
    .query(async ({ input, ctx }) => {
      const sheet = await Sheet.query()
        .where('id', '=', input.sheetId)
        .andWhere('isVisible', true)
        .preload('module')
        .preload('images')
        .preload('slots', (slotsQuery) =>
          slotsQuery.where('userId', ctx.genericAuth.id).orderBy('createdAt', 'desc').first()
        )
        .first()
      if (!sheet) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Sheet not found',
        })
      }
      const exercices = await Exercice.query()
        .where('module_id', sheet.moduleId)
        .preload('images')
        .orderBy('is_correction', 'asc') // Exercices (false) en premier, corrections (true) en second

      const applicationExercises = exercices.filter((e) => e.exerciseType === 'application')
      const trainingExercises = exercices.filter((e) => e.exerciseType === 'training')

      const summarizedSheet = await SummarizedSheet.query()
        .where('module_id', sheet.moduleId)
        .first()

      const sheetRatingByStudent = await SheetRating.query()
        .where('sheet_id', sheet.id)
        .andWhere('student_id', ctx.genericAuth.id)
        .first()

      const slot = await Slot.query()
        .where('sheet_id', sheet.id)
        .whereHas('reservations', (reservationQuery) =>
          reservationQuery.where('student_id', ctx.genericAuth.id)
        )
        .orderBy('created_at', 'desc')
        .first()

      return {
        sheet: {
          id: sheet.id,
          name: sheet.name,
          description: sheet.description,
          level: sheet.level,
          images: await Promise.all(sheet.images.map((image) => getFile(image.id))),
          content: sheet.content,
          recording: slot?.recordingId
            ? await getFileUrl(slot.recordingId, env.get('VIDEOSDK_BUCKET'), true)
            : null,
          sheetPdfUrl: sheet.sheetPdfId ? await getFileUrl(sheet.sheetPdfId) : undefined,
          moduleId: sheet.moduleId,
          moduleChapterId: sheet.module.chapterId,
          taskId: sheet.taskId,
        },
        // Backward-compat: keep singular 'exercice' as first non-correction application or first available
        exercice: (applicationExercises.find((e) => !e.isCorrection) ?? exercices[0]) && {
          id: (applicationExercises.find((e) => !e.isCorrection) ?? exercices[0]).id,
          name: (applicationExercises.find((e) => !e.isCorrection) ?? exercices[0]).name,
          content: (applicationExercises.find((e) => !e.isCorrection) ?? exercices[0]).content,
          images: await Promise.all(
            (applicationExercises.find((e) => !e.isCorrection) ?? exercices[0]).images.map(
              (image) => getFile(image.id)
            )
          ),
        },
        applicationExercises: await Promise.all(
          applicationExercises.map(async (ex) => ({
            id: ex.id,
            name: ex.name,
            content: ex.content,
            images: await Promise.all(ex.images.map((image) => getFile(image.id))),
            isCorrection: !!ex.isCorrection,
          }))
        ),
        trainingExercises: await Promise.all(
          trainingExercises.map(async (ex) => ({
            id: ex.id,
            name: ex.name,
            content: ex.content,
            images: await Promise.all(ex.images.map((image) => getFile(image.id))),
            isCorrection: !!ex.isCorrection,
          }))
        ),
        summarizedSheet: summarizedSheet && {
          id: summarizedSheet.id,
          summarizedSheet: summarizedSheet.summarizedSheet
            ? await getFile(summarizedSheet.summarizedSheet)
            : null,
        },
        sheetRatingByStudent: sheetRatingByStudent?.rating ?? null,
      }
    }),

  getOne: authProcedure
    .meta({ guards: ['admin', 'user', 'professor'] })
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const sheet = await Sheet.query()
        .where({
          id: input.id,
        })
        .preload('module', (moduleQuery) => {
          void moduleQuery.preload('chapter')
        })
        .preload('images')
        .andWhere('isVisible', true)
        .first()

      if (!sheet?.isVisible) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid sheet ID',
        })
      }
      return {
        id: sheet.id,
        name: sheet.name,
        description: sheet.description,
        level: sheet.level,
        content: sheet.content,
        images: await Promise.all(sheet.images.map((image) => getFile(image.id))),
        module: {
          id: sheet.module.id.toString(),
          name: sheet.module.name,
          subject: sheet.module.subject,
          chapter: {
            id: sheet.module.chapter.id,
            name: sheet.module.chapter.name,
          },
        },
      }
    }),

  getOneBySlotId: authProcedure
    .meta({ guards: ['professor', 'user'] })
    .input(z.object({ slotId: z.number() }))
    .query(async ({ input }) => {
      const slot = await Slot.query()
        .where('id', input.slotId)
        .preload('sheet', (sheetQuery) =>
          sheetQuery
            .preload('images')
            .preload('module', (moduleQuery) =>
              moduleQuery.preload('exercices', (exerciceQuery) => exerciceQuery.preload('images'))
            )
        )
        .first()
      if (!slot) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid slot ID',
        })
      }
      return {
        sheet: {
          id: slot.sheet.id,
          name: slot.sheet.name,
          description: slot.sheet.description,
          content: slot.sheet.content,
          images: await Promise.all(slot.sheet.images.map((image) => getFile(image.id))),
        },
        exercice: slot.sheet.module.exercices?.[0]
          ? {
              id: slot.sheet.module.exercices[0].id,
              name: slot.sheet.module.exercices[0].name,
              content: slot.sheet.module.exercices[0].content,
              images: await Promise.all(
                slot.sheet.module.exercices[0].images.map((image) => getFile(image.id))
              ),
            }
          : undefined,
      }
    }),

  getRelatedSheets: authProcedure
    .meta({ guards: ['user', 'professor'] })
    .input(z.object({ sheetId: z.string() }))
    .query(async ({ ctx, input }) => {
      const sheet = await Sheet.findBy('id', input.sheetId)
      if (!sheet) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid sheet ID',
        })
      }
      const associatedModule = await Module.findBy('id', sheet.moduleId)
      if (!associatedModule) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid module ID',
        })
      }
      const sameModuleOtherLevelSheet = await Sheet.query()
        .select(['id', 'name', 'level'])
        .where('moduleId', associatedModule.id)
        .andWhere('id', '<>', sheet.id)
        .andWhere('isVisible', true)
        .first()

      if (ctx.genericAuth instanceof User) {
        const studentDetails = await StudentDetails.findBy('userId', ctx.genericAuth.id)
        if (!studentDetails) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You are not authorized to access this ressource',
          })
        }

        const moduleJoinSheetJoinModuleToStudent = await Sheet.query()
          .select(['id', 'name', 'level', 'moduleId'])
          .where('level', sheet.level)
          .andWhere('isVisible', true)
          .andWhere('moduleId', '<>', associatedModule.id)
          .preload('module', (moduleQuery) =>
            moduleQuery
              .preload('moduleStudents', (moduleStudentsQuery) =>
                moduleStudentsQuery
                  .where('user_id', ctx.genericAuth.id)
                  .andWhere('done', false)
                  .andWhere('doing', false)
              )
              .where('grade', associatedModule.grade)
              .andWhere('subject', associatedModule.subject)
          )
          .orderByRaw('RANDOM()')
          .limit(3)

        return {
          sameModuleOtherLevelSheet: sameModuleOtherLevelSheet && {
            id: sameModuleOtherLevelSheet.id,
            name: sameModuleOtherLevelSheet.name,
            level: sameModuleOtherLevelSheet.level,
          },
          otherModulesSheets: moduleJoinSheetJoinModuleToStudent.map((otherModuleSheet) => ({
            id: otherModuleSheet.id,
            name: otherModuleSheet.name,
          })),
        }
      } else {
        const moduleJoinSheet = await Sheet.query()
          .select(['id', 'name', 'level', 'moduleId'])
          .where('level', sheet.level)
          .andWhere('isVisible', true)
          .andWhere('moduleId', '<>', associatedModule.id)
          .preload('module', (moduleQuery) =>
            moduleQuery
              .where('grade', associatedModule.grade)
              .andWhere('subject', associatedModule.subject)
          )
          .orderByRaw('RANDOM()')
          .limit(3)
        return {
          sameModuleOtherLevelSheet: sameModuleOtherLevelSheet && {
            id: sameModuleOtherLevelSheet.id,
            name: sameModuleOtherLevelSheet.name,
            level: sameModuleOtherLevelSheet.level,
          },
          otherModulesSheets: moduleJoinSheet.map((otherModuleSheet) => ({
            id: otherModuleSheet.id,
            name: otherModuleSheet.name,
          })),
        }
      }
    }),

  getRelatedSheetIdsAndNamesForQuiz: authProcedure
    .input(z.object({ sheetId: z.number() }))
    .meta({ guards: ['user'] })
    .query(async ({ input, ctx }) => {
      const studentDetails = await StudentDetails.findBy('userId', ctx.genericAuth.id)
      if (!studentDetails) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not authorized to access this ressource',
        })
      }

      const sheet = await Sheet.findBy('id', input.sheetId)
      if (!sheet) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid sheet ID',
        })
      }

      const associatedModule = await Module.findBy('id', sheet.moduleId)
      if (!associatedModule) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid module ID',
        })
      }

      const moduleJoinSheetJoinModuleToStudent = await Sheet.query()
        .select(['id', 'name', 'module_id'])
        .where('level', sheet.level)
        .andWhere('isVisible', true)
        .andWhere('moduleId', '<>', associatedModule.id)
        .preload('module', (moduleQuery) =>
          moduleQuery
            .preload('moduleStudents', (moduleStudentsQuery) =>
              moduleStudentsQuery
                .where('user_id', ctx.genericAuth.id)
                .andWhere('done', true)
                .andWhere('doing', true)
            )
            .where('grade', associatedModule.grade)
            .andWhere('subject', associatedModule.subject)
        )
        .orderByRaw('RANDOM()')
        .limit(3)

      if (moduleJoinSheetJoinModuleToStudent.length < 3) {
        moduleJoinSheetJoinModuleToStudent.push(
          ...(await Sheet.query()
            .select(['id', 'name', 'module_id'])
            .where('level', sheet.level)
            .andWhere('isVisible', true)
            .andWhere('moduleId', '<>', associatedModule.id)
            .preload('module', (moduleQuery) =>
              moduleQuery
                .preload('moduleStudents', (moduleStudentsQuery) =>
                  moduleStudentsQuery
                    .where('user_id', ctx.genericAuth.id)
                    .andWhere('done', true)
                    .andWhere('doing', true)
                )
                .where('grade', associatedModule.grade)
                .andWhere('subject', associatedModule.subject)
            )
            .orderByRaw('RANDOM()')
            .limit(3 - moduleJoinSheetJoinModuleToStudent.length))
        )
      }

      return moduleJoinSheetJoinModuleToStudent.map((module) => ({
        id: module.id,
        name: module.name,
      }))
    }),

  create: authProcedure
    .input(addSheetSchema.extend({ images: z.array(z.string()), sheetPdfId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const module = await Module.findBy('id', input.moduleId)
      if (!module) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid module ID',
        })
      }

      // Check if a sheet with the same module and level already exists
      const existingSheet = await Sheet.query()
        .where('moduleId', input.moduleId)
        .andWhere('level', input.level)
        .first()

      if (existingSheet) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Une fiche avec le niveau "${input.level}" existe déjà pour ce module.`,
        })
      }

      const sheet = new Sheet()
      sheet.name = input.name
      sheet.description = input.description
      sheet.content = input.content
      sheet.level = input.level
      sheet.isVisible = input.isVisible
      sheet.sheetPdfId = input.sheetPdfId
      await sheet.related('module').associate(module)
      await sheet.save()
      await sheet.related('images').attach(input.images)

      return { message: 'Sheet added successfully' }
    }),

  edit: authProcedure
    .input(editSheetSchema.extend({ images: z.array(z.string()), sheetPdfId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const sheet = await Sheet.findBy('id', input.id)

      if (!sheet) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid sheet ID',
        })
      }

      const imagesToDelete = await sheet
        .related('images')
        .query()
        .whereNotIn('file_id', input.images)

      for (const image of imagesToDelete) {
        await deleteFile(image.id)
      }

      const module = await Module.findBy('id', input.moduleId)
      if (!module) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid module ID',
        })
      }

      // Check if a sheet with the same module and level already exists (excluding current sheet)
      const existingSheet = await Sheet.query()
        .where('moduleId', input.moduleId)
        .andWhere('level', input.level)
        .andWhere('id', '<>', input.id)
        .first()

      if (existingSheet) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Une fiche avec le niveau "${input.level}" existe déjà pour ce module.`,
        })
      }

      sheet.name = input.name
      sheet.description = input.description
      sheet.content = input.content
      sheet.level = input.level
      sheet.isVisible = input.isVisible
      sheet.sheetPdfId = input.sheetPdfId
      await sheet.related('module').associate(module)
      await sheet.related('images').detach()
      await sheet.related('images').attach(input.images)

      await sheet.save()
      return { message: 'Sheet edited successfully' }
    }),

  delete: authProcedure.input(z.number()).mutation(async ({ input }) => {
    const sheet = await Sheet.findBy('id', input)
    if (!sheet) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid sheet ID',
      })
    }
    const images = await sheet.related('images').query()
    for (const image of images) {
      await deleteFile(image.id)
    }
    await sheet.delete()
    return { message: 'Sheet deleted successfully' }
  }),

  rate: authProcedure
    .meta({ guards: ['user'] })
    .input(z.object({ sheetId: z.number(), rating: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const sheetRatingByStudent = await SheetRating.query()
        .where('sheet_id', input.sheetId)
        .andWhere('student_id', ctx.genericAuth.id)
        .first()

      if (sheetRatingByStudent) {
        sheetRatingByStudent.rating = input.rating
        await sheetRatingByStudent.save()
        return { rating: sheetRatingByStudent.rating }
      } else {
        try {
          const newSheetRatingByStudent = new SheetRating()
          newSheetRatingByStudent.sheetId = input.sheetId
          newSheetRatingByStudent.studentId = ctx.genericAuth.id
          newSheetRatingByStudent.rating = input.rating
          await newSheetRatingByStudent.save()

          return { rating: newSheetRatingByStudent.rating }
        } catch {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid sheet ID',
          })
        }
      }
    }),

  markAsRead: authProcedure
    .meta({ guards: ['user'] })
    .input(z.object({ sheetId: z.number(), moduleId: z.number(), taskId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await StudentTaskActivity.create({
        studentId: ctx.genericAuth.id,
        moduleId: input.moduleId,
        taskType: 'sheet',
        taskId: input.taskId,
        attemptNumber: 1,
        timeSpent: 0,
        status: 'succeeded',
        score: null,
        metadata: null,
      })
      return { message: 'Sheet marked as read' }
    }),

  isSheetRead: authProcedure
    .meta({ guards: ['user'] })
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input, ctx }) => {
      const activity = await StudentTaskActivity.query()
        .where('studentId', ctx.genericAuth.id)
        .where('taskId', input.taskId)
        .where('taskType', 'sheet')
        .first()
      return { isRead: !!activity }
    }),
})
