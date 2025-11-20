import { TRPCError } from '@trpc/server'
import type { Grade, Subject } from '@viastud/utils'
import { addQuestionSchema, editQuestionSchema } from '@viastud/utils'
import { z } from 'zod'

import Module from '#models/module'
import QuizQuestion from '#models/quiz_question'
import QuizQuestionAnswer from '#models/quiz_question_answer'
import Sheet from '#models/sheet'
import StudentQuizGrade from '#models/student_quiz_grade'
import User from '#models/user'
import { deleteFile, type FileDto, getFile } from '#services/file_service'
import {
  getLastFourStudentQuizGrades,
  getLastStudentQuizGradesPerModule,
} from '#services/question_service'
import { authProcedure, router } from '#services/trpc_service'

export interface QuestionDto {
  id: number
  module: { id: number; name: string }
  title: string
  detailedAnswer: string
  isMultipleChoice: boolean
  answers: { id: number; content: string; isRightAnswer: boolean }[]
  images: FileDto[]
  grade: Grade
  subject: Subject
}

export interface QuestionMinimalDto {
  id: number
  title: string
  images: FileDto[]
  detailedAnswer: string
  isMultipleChoice: boolean
  answers: { id: number; content: string; isRightAnswer: boolean }[]
}

export interface QuizGrade {
  id: number
  moduleName: string
  moduleSubject: Subject
  grade: number
}

export interface ModuleQuizGradeForStudent {
  moduleId: number
  moduleName: string
  grade: number
}

export const questionRouter = router({
  getAll: authProcedure.meta({ guards: ['admin', 'user'] }).query<QuestionDto[]>(async () => {
    const questions = await QuizQuestion.query()
      .preload('module')
      .preload('answers')
      .preload('images')
    return Promise.all(
      questions.map(async (question) => ({
        id: question.id,
        module: { id: question.module.id, name: question.module.name },
        title: question.title,
        detailedAnswer: question.detailedAnswer,
        isMultipleChoice: question.isMultipleChoice,
        answers: question.answers.map((answer) => ({
          id: answer.id,
          content: answer.content,
          isRightAnswer: answer.isRightAnswer,
        })),
        grade: question.module.grade,
        subject: question.module.subject,
        images: await Promise.all(question.images.map((image) => getFile(image.id))),
      }))
    )
  }),

  getQuestionsForQuiz: authProcedure
    .meta({ guards: ['user'] })
    .input(z.object({ sheetId: z.number() }))
    .query<QuestionMinimalDto[]>(async ({ input }) => {
      const sheet = await Sheet.findBy('id', input.sheetId)
      if (!sheet?.isVisible) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid sheet ID',
        })
      }
      const questions = await QuizQuestion.query()
        .where('moduleId', sheet.moduleId)
        .preload('answers')
        .preload('images')
        .orderByRaw('RANDOM()')
        .limit(10)

      return Promise.all(
        questions.map(async (question) => ({
          id: question.id,
          title: question.title,
          detailedAnswer: question.detailedAnswer,
          isMultipleChoice: question.isMultipleChoice,
          images: await Promise.all(question.images.map((image) => getFile(image.id))),
          answers: question.answers.map((answer) => ({
            id: answer.id,
            content: answer.content,
            isRightAnswer: answer.isRightAnswer,
          })),
        }))
      )
    }),

  getQuestionsForChapterQuiz: authProcedure
    .meta({ guards: ['user'] })
    .input(z.object({ chapterId: z.number() }))
    .query<QuestionMinimalDto[]>(async ({ input }) => {
      const questions = await QuizQuestion.query()
        .whereHas('module', (moduleQuery) => {
          void moduleQuery.where('chapter_id', input.chapterId)
        })
        .preload('answers')
        .preload('images')
        .orderByRaw('RANDOM()')
        .limit(10)

      return Promise.all(
        questions.map(async (question) => ({
          id: question.id,
          title: question.title,
          detailedAnswer: question.detailedAnswer,
          isMultipleChoice: question.isMultipleChoice,
          images: await Promise.all(question.images.map((image) => getFile(image.id))),
          answers: question.answers.map((answer) => ({
            id: answer.id,
            content: answer.content,
            isRightAnswer: answer.isRightAnswer,
          })),
        }))
      )
    }),

  create: authProcedure
    .input(addQuestionSchema)
    .meta({ guards: ['admin'] })
    .mutation(async ({ input }) => {
      const module = await Module.findBy('id', input.moduleId)
      if (!module) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid module ID',
        })
      }
      const question = new QuizQuestion()
      question.title = input.title
      question.detailedAnswer = input.detailedAnswer
      question.isMultipleChoice = input.isMultipleChoice
      await question.related('module').associate(module)
      await question.save()
      await question.related('images').attach(input.images)

      await QuizQuestionAnswer.createMany(
        input.answers.map((answer) => ({
          questionId: question.id,
          ...answer,
        }))
      )

      return { message: 'Question added successfully' }
    }),

  edit: authProcedure.input(editQuestionSchema).mutation(async ({ input }) => {
    const question = await QuizQuestion.findBy('id', input.id)
    if (!question) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid question ID',
      })
    }
    const module = await Module.findBy('id', input.moduleId)
    if (!module) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid module ID',
      })
    }

    const imagesToDelete = await question
      .related('images')
      .query()
      .whereNotIn('file_id', input.images)

    for (const image of imagesToDelete) {
      await deleteFile(image.id)
    }

    question.title = input.title
    question.detailedAnswer = input.detailedAnswer
    question.isMultipleChoice = input.isMultipleChoice
    await question.related('module').associate(module)
    await question.save()
    await question.related('images').detach()
    await question.related('images').attach(input.images)

    await QuizQuestionAnswer.updateOrCreateMany(
      'id',
      input.answers.filter((answer) => answer.id)
    )
    await QuizQuestionAnswer.createMany(
      input.answers
        .filter((answer) => !answer.id)
        .map((answer) => ({
          questionId: question.id,
          ...answer,
        }))
    )

    return { message: 'Question edited successfully' }
  }),

  delete: authProcedure.input(z.number()).mutation(async ({ input }) => {
    const question = await QuizQuestion.findBy('id', input)
    if (!question) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid quiz ID',
      })
    }
    await question.delete()
    return { message: 'Quiz deleted successfully' }
  }),

  getStudentProfileData: authProcedure.meta({ guards: ['user'] }).query(async ({ ctx }) => {
    const student = await User.findBy('id', ctx.genericAuth.id)
    if (!student || student.role !== 'STUDENT') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid student ID',
      })
    }
    const lastFourStudentQuizGrades = await getLastFourStudentQuizGrades(student.id)
    const lastStudentQuizGradesPerModule = await getLastStudentQuizGradesPerModule(student.id)
    return { lastFourStudentQuizGrades, lastStudentQuizGradesPerModule }
  }),

  createQuizGrade: authProcedure
    .meta({ guards: ['user'] })
    .input(z.object({ sheetId: z.number(), grade: z.number(), timeSpent: z.number().optional() }))
    .mutation(async ({ input, ctx }) => {
      const sheet = await Sheet.findBy('id', input.sheetId)
      if (!sheet) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid quiz ID',
        })
      }

      // Créer l'entrée StudentQuizGrade (pour compatibilité avec l'ancien système)
      const studentQuizgrades = new StudentQuizGrade()
      studentQuizgrades.studentId = ctx.genericAuth.id
      studentQuizgrades.moduleId = sheet.moduleId
      studentQuizgrades.grade = input.grade
      await studentQuizgrades.save()

      // Créer aussi une entrée dans StudentTaskActivity pour le tracking des activités récentes
      const { ActivityTrackingService } = await import('#services/activity_tracking_service')
      const activityTrackingService = new ActivityTrackingService()

      const succeeded = input.grade >= 6 // Considérer comme réussi si >= 6/10
      await activityTrackingService.trackQuizCompletion(
        ctx.genericAuth.id,
        sheet.moduleId,
        0, // quizQuestionId - on utilise 0 car c'est un quiz de module complet
        input.grade,
        input.timeSpent ?? 0,
        succeeded
      )

      return { message: 'Quiz grade saved successfully' }
    }),
})
