import { TRPCError } from '@trpc/server'
import {
  addModuleSchema,
  editModuleSchema,
  type Grade,
  grade,
  type Subject,
  subject,
} from '@viastud/utils'
import { z } from 'zod'

import Chapter from '#models/chapter'
import Module from '#models/module'
import Sheet from '#models/sheet'
import Slot from '#models/slot'
import { authProcedure, router } from '#services/trpc_service'

import type { ChapterDto } from './chapter.ts'

export interface ModuleDto {
  id: number
  name: string
  grade: Grade
  subject: Subject
  chapter: ChapterDto
}

export interface ModuleWithSheetsDto {
  id: number
  name: string
  chapterId: number
  grade: Grade
  subject: Subject
  chapter: {
    id: number
    name: string
  }
  sheets: {
    advancedSheet: { id?: string; name?: string }
    standardSheet: { id?: string; name?: string }
  }
}

export const moduleRouter = router({
  getAll: authProcedure.meta({ guards: ['admin', 'user'] }).query<ModuleDto[]>(async ({ ctx }) => {
    void ctx
    const modules = await Module.query().preload('chapter')
    try {
      const modulesforfrontend = modules.map((module) => ({
        id: module.id,
        name: module.name,
        grade: module.grade,
        subject: module.subject,
        chapter: {
          id: module.chapter.id,
          name: module.chapter.name,
          order: module.chapter.order,
        },
      }))
      return modulesforfrontend
    } catch (error: unknown) {
      console.log(error)
      throw error
    }
  }),

  // Distinct chapters for a given grade and subject (based on existing modules)
  getChaptersByGradeSubject: authProcedure
    .meta({ guards: ['admin', 'user', 'professor'] })
    .input(z.object({ grade: z.enum(grade), subject: z.enum(subject) }))
    .query(async ({ input }) => {
      const modules = await Module.query()
        .where('grade', input.grade)
        .andWhere('subject', input.subject)
        .preload('chapter')

      const uniqueChaptersMap = new Map<number, { id: number; name: string; order: number }>()
      for (const module of modules) {
        if (module.chapter) {
          uniqueChaptersMap.set(module.chapter.id, {
            id: module.chapter.id,
            name: module.chapter.name,
            order: module.chapter.order,
          })
        }
      }
      return Array.from(uniqueChaptersMap.values())
    }),

  getAllWithoutExercices: authProcedure
    .meta({ guards: ['admin'] })
    .query<ModuleDto[]>(async ({ ctx }) => {
      void ctx
      const modules = await Module.query().preload('exercices').preload('chapter')
      const modulesforfrontend = modules
        .filter((module) => (module.exercices?.length ?? 0) === 0)
        .map((module) => ({
          id: module.id,
          name: module.name,
          grade: module.grade,
          subject: module.subject,
          chapter: {
            id: module.chapter.id,
            name: module.chapter.name,
            order: module.chapter.order,
          },
        }))
      return modulesforfrontend
    }),

  getAllWithoutSummarizedSheets: authProcedure
    .meta({ guards: ['admin'] })
    .query(async ({ ctx }) => {
      void ctx
      const modules = await Module.query().preload('summarizedSheet')
      const modulesforfrontend = modules
        .filter((module) => !module.summarizedSheet)
        .map((module) => ({
          id: module.id,
          name: module.name,
        }))
      return modulesforfrontend
    }),

  getAllWithSheets: authProcedure
    .meta({ guards: ['admin', 'user'] })
    .input(
      z.object({
        grade: z.enum(grade),
      })
    )
    .query(async ({ input }) => {
      const modules = await Module.query().where('grade', input.grade).preload('chapter')

      const modulesWithSheets = await Promise.all(
        modules.map(async (module) => {
          const advancedSheet = await Sheet.query()
            .where('moduleId', module.id)
            .andWhere('level', 'ADVANCED')
            .andWhere('isVisible', true)
            .first()

          const standardSheet = await Sheet.query()
            .where('moduleId', module.id)
            .andWhere('level', 'STANDARD')
            .andWhere('isVisible', true)
            .first()

          return {
            id: module.id.toString(),
            name: module.name,
            grade: module.grade,
            subject: module.subject,
            chapter: {
              id: module.chapter.id,
              name: module.chapter.name,
            },
            sheets: {
              advancedSheet: {
                id: advancedSheet?.id.toString(),
                name: advancedSheet?.name,
              },
              standardSheet: {
                id: standardSheet?.id.toString(),
                name: standardSheet?.name,
              },
            },
          }
        })
      )
      return modulesWithSheets.filter(
        (moduleWithSheet) =>
          moduleWithSheet.sheets.advancedSheet.id ?? moduleWithSheet.sheets.standardSheet.id
      )
    }),

  // Get modules for a specific chapter with their visible sheets (STANDARD/ADVANCED)
  getByChapterWithSheets: authProcedure
    .meta({ guards: ['admin', 'user'] })
    .input(
      z.object({
        grade: z.enum(grade),
        subject: z.enum(subject),
        chapterId: z.number(),
      })
    )
    .query<ModuleWithSheetsDto[]>(async ({ input }) => {
      const modules = await Module.query()
        .where('grade', input.grade)
        .andWhere('subject', input.subject)
        .andWhere('chapterId', input.chapterId)
        .preload('chapter')
        .orderBy('orderInChapter', 'asc')

      const modulesWithSheets = await Promise.all(
        modules.map(async (module) => {
          const advancedSheet = await Sheet.query()
            .where('moduleId', module.id)
            .andWhere('level', 'ADVANCED')
            .andWhere('isVisible', true)
            .first()

          const standardSheet = await Sheet.query()
            .where('moduleId', module.id)
            .andWhere('level', 'STANDARD')
            .andWhere('isVisible', true)
            .first()

          return {
            id: module.id,
            name: module.name,
            chapterId: module.chapterId,
            grade: module.grade,
            subject: module.subject,
            chapter: {
              id: module.chapter.id,
              name: module.chapter.name,
            },
            sheets: {
              advancedSheet: advancedSheet
                ? { id: advancedSheet.id.toString(), name: advancedSheet.name }
                : { id: undefined, name: undefined },
              standardSheet: standardSheet
                ? { id: standardSheet.id.toString(), name: standardSheet.name }
                : { id: undefined, name: undefined },
            },
          }
        })
      )

      // Keep only modules that have at least one visible sheet
      return modulesWithSheets.filter(
        (moduleWithSheet) =>
          moduleWithSheet.sheets.advancedSheet.id ?? moduleWithSheet.sheets.standardSheet.id
      )
    }),

  getOneMinimalBySlotId: authProcedure
    .meta({ guards: ['professor', 'user'] })
    .input(z.object({ slotId: z.number() }))
    .query(async ({ input }) => {
      const slot = await Slot.query()
        .where('id', input.slotId)
        .preload('sheet', (sheetQuery) => sheetQuery.preload('module'))
        .first()
      if (!slot) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid slot ID',
        })
      }
      return {
        id: slot.sheet.module.id,
        name: slot.sheet.module.name,
        sheetId: slot.sheet.id,
        grade: slot.sheet.module.grade,
        subject: slot.sheet.module.subject,
        chapterId: slot.sheet.module.chapterId,
      }
    }),

  create: authProcedure.input(addModuleSchema).mutation(async ({ input }) => {
    const chapter = await Chapter.findBy('id', input.chapterId)
    if (!chapter) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid chapter ID',
      })
    }
    const module = new Module()
    module.name = input.name
    module.grade = input.grade
    module.subject = input.subject
    // Compute next order within the chapter to satisfy NOT NULL and uniqueness constraints
    const lastModuleInChapter = await Module.query()
      .where('chapterId', chapter.id)
      .orderBy('orderInChapter', 'desc')
      .first()
    module.orderInChapter = lastModuleInChapter ? lastModuleInChapter.orderInChapter + 1 : 0
    await module.related('chapter').associate(chapter)

    await module.save()
    return { message: 'Module added successfully' }
  }),

  edit: authProcedure.input(editModuleSchema).mutation(async ({ input }) => {
    const module = await Module.findBy('id', input.id)
    if (!module) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid module ID',
      })
    }
    const chapter = await Chapter.findBy('id', input.chapterId)
    if (!chapter) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid chapter ID',
      })
    }
    module.name = input.name
    module.grade = input.grade
    module.subject = input.subject
    await module.related('chapter').associate(chapter)

    await module.save()
    return { message: 'Module edited successfully' }
  }),

  delete: authProcedure.input(z.number()).mutation(async ({ input }) => {
    const module = await Module.findBy('id', input)
    if (!module) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid module ID',
      })
    }
    await module.delete()
    return { message: 'Module deleted successfully' }
  }),
})
