import type { UUID } from 'node:crypto'

import type { Grade, Subject } from '@viastud/utils'

import Exercice from '#models/exercice'
import Module from '#models/module'
import ModuleToStudent from '#models/module_to_student'
import Sheet from '#models/sheet'
import StudentQuizGrade from '#models/student_quiz_grade'
import StudentTaskActivity from '#models/student_task_activity'

import type {
  Recommendation,
  StudentProgressRepository,
} from '../repository/student_progress_repository.js'
import { alertService } from '../services/alert_service.js'
import { loggingService } from '../services/logging_service.js'

export class AdonisStudentProgressRepository implements StudentProgressRepository {
  async getNextRecommendation(
    studentId: UUID,
    grade: Grade,
    subject: Subject
  ): Promise<Recommendation> {
    // Chercher directement les modules au lieu de passer par les chapitres
    const modules = await Module.query()
      .where('modules.grade', grade)
      .where('modules.subject', subject)
      .preload('chapter')
      .preload('tasks')
      .join('chapters', 'modules.chapter_id', 'chapters.id')
      .orderBy('chapters.order', 'asc')
      .orderBy('modules.order_in_chapter', 'asc')
      .select('modules.*')

    loggingService.info(`Modules trouvés pour ${grade} ${subject}`, {
      userId: studentId,
      grade,
      subject,
      moduleCount: modules.length,
      modules: JSON.stringify(
        modules.map((m) => ({
          id: m.id,
          name: m.name,
          chapterId: m.chapterId,
          orderInChapter: m.orderInChapter,
          chapterOrder: m.chapter?.order,
        }))
      ),
    })

    if (modules.length === 0) {
      // Créer une alerte automatique (qui gère déjà le logging)
      alertService.checkForMissingModules(grade, subject, modules.length)
    }

    const activities = await StudentTaskActivity.query()
      .where('studentId', studentId)
      .orderBy('createdAt', 'desc')
    const moduleProgresses = await ModuleToStudent.query().where('userId', studentId)

    // 1. Chercher les chapitres marqués comme "actuellement étudiés" (doing = true)
    const doingModules = moduleProgresses.filter((mp) => mp.doing)
    const doingChapterIds = doingModules
      .map((mp) => {
        const module = modules.find((m) => m.id === mp.moduleId)
        return module?.chapterId
      })
      .filter(Boolean) as number[]

    let prioritizedModules: typeof modules

    if (doingChapterIds.length > 0) {
      // 2. Si des chapitres sont marqués comme étudiés, les prioriser
      loggingService.info(`Chapitres étudiés trouvés`, {
        userId: studentId,
        doingChapterIds: JSON.stringify(doingChapterIds),
        doingModules: JSON.stringify(doingModules.map((mp) => mp.moduleId)),
      })

      prioritizedModules = [
        // Modules des chapitres étudiés, dans l'ordre déjà trié par la requête
        ...modules.filter((m) => doingChapterIds.includes(m.chapterId)),
        // Autres modules, dans l'ordre déjà trié par la requête
        ...modules.filter((m) => !doingChapterIds.includes(m.chapterId)),
      ]
    } else {
      // 3. Sinon, prendre le chapitre avec le chapter_order le plus bas
      const chaptersByOrder = modules.reduce<Record<number, typeof modules>>((acc, module) => {
        if (!acc[module.chapterId]) {
          acc[module.chapterId] = []
        }
        acc[module.chapterId].push(module)
        return acc
      }, {})

      // Trouver le chapitre avec l'order le plus bas
      const chapterWithLowestOrder = Object.entries(chaptersByOrder).sort(
        ([, modulesA], [, modulesB]) => {
          const orderA = modulesA[0].chapter?.order ?? Number.MAX_SAFE_INTEGER
          const orderB = modulesB[0].chapter?.order ?? Number.MAX_SAFE_INTEGER
          return orderA - orderB
        }
      )[0]

      if (chapterWithLowestOrder) {
        const [lowestOrderChapterId] = chapterWithLowestOrder
        loggingService.info(
          `Aucun chapitre étudié, utilisation du chapitre avec order le plus bas`,
          {
            userId: studentId,
            lowestOrderChapterId,
            chapterOrder: modules.find((m) => m.chapterId === Number(lowestOrderChapterId))?.chapter
              ?.order,
          }
        )

        prioritizedModules = [
          // Modules du chapitre avec l'order le plus bas, dans l'ordre déjà trié
          ...modules.filter((m) => m.chapterId === Number(lowestOrderChapterId)),
          // Autres modules, dans l'ordre déjà trié
          ...modules.filter((m) => m.chapterId !== Number(lowestOrderChapterId)),
        ]
      } else {
        // Fallback: utiliser l'ordre déjà trié par la requête
        prioritizedModules = modules
      }
    }

    for (const module of prioritizedModules) {
      const progress = moduleProgresses.find((mp) => mp.moduleId === module.id)
      if (progress?.done) {
        continue
      }

      const orderedTasks = module.tasks.sort(
        (a, b) => (a.orderIndex ?? a.id) - (b.orderIndex ?? b.id)
      )

      const sheetTask = orderedTasks.find((task) => task.type === 'sheet')
      if (sheetTask) {
        const sheetDone = activities.some(
          (activity) => activity.taskId === sheetTask.id && activity.status === 'succeeded'
        )
        if (!sheetDone) {
          // Recommander la sheet
          const sheet = await Sheet.findBy('taskId', sheetTask.id)
          return {
            type: 'task',
            taskId: sheet?.id ?? 0,
            taskType: 'sheet',
            taskName: sheet?.name ?? '',
            grade: module.grade,
            subject: module.subject,
            level: sheet?.level ?? '',
            moduleId: module.id,
            moduleName: module.name,
            chapterId: module.chapterId,
            chapterName: module.chapter?.name ?? '',
            reason: 'Commencer par lire le cours',
            confidence: 1,
            estimatedTimeMinutes: sheetTask.estimatedTimeMinutes,
          }
        }
      }

      await module.load('quizQuestions')
      if (module.quizQuestions.length > 0) {
        const quizGrade = await StudentQuizGrade.query()
          .where('studentId', studentId)
          .where('moduleId', module.id)
          .first()
        if (!quizGrade) {
          // Try to resolve a sheetId to allow module-level quiz navigation on the frontend
          let sheetIdForModuleQuiz: number | undefined
          try {
            const sheetTaskForModule = orderedTasks.find((t) => t.type === 'sheet')
            if (sheetTaskForModule) {
              const sheetForTask = await Sheet.findBy('taskId', sheetTaskForModule.id)
              sheetIdForModuleQuiz = sheetForTask?.id ?? undefined
            }
            // Fallback: if no sheet task was found (legacy), try by moduleId
            if (!sheetIdForModuleQuiz) {
              const anySheet = await Sheet.query().where('moduleId', module.id).first()
              sheetIdForModuleQuiz = anySheet?.id ?? undefined
            }
          } catch {
            // Ignore resolution errors; frontend will fallback to chapter-level quiz
          }
          return {
            type: 'task',
            // For quizzes, we pass the sheetId via taskId so the UI can route to
            // /ressources/$grade/$subject/$chapterId/$sheetId/quiz; otherwise it will
            // fallback to the chapter-level quiz-general.
            taskId: sheetIdForModuleQuiz,
            taskType: 'quiz',
            taskName: `Quiz - ${module.name}`,
            grade: module.grade,
            subject: module.subject,
            moduleId: module.id,
            level: '',
            moduleName: module.name,
            chapterId: module.chapterId,
            chapterName: module.chapter?.name ?? '',
            reason: `Tester vos connaissances avec le quiz "${module.name}"`,
            confidence: 0.9,
            estimatedTimeMinutes: 15,
          }
        }
      }

      for (const task of orderedTasks) {
        if (task.type === 'sheet') continue // déjà traité
        const isTaskDone = activities.some(
          (activity) => activity.taskId === task.id && activity.status === 'succeeded'
        )
        if (!isTaskDone) {
          let taskName = ''
          let id = 0
          if (task.type === 'exercise') {
            const exercise = await Exercice.findBy('taskId', task.id)
            taskName = exercise?.name ?? ''
            id = exercise?.id ?? 0
          }
          return {
            type: 'task',
            taskId: id,
            taskType: task.type,
            taskName,
            grade: module.grade,
            subject: module.subject,
            level: '',
            moduleId: module.id,
            moduleName: module.name,
            chapterId: module.chapterId,
            chapterName: module.chapter?.name ?? '',
            reason: 'Voici la prochaine tâche à compléter dans ce module',
            confidence: 0.8,
            estimatedTimeMinutes: task.estimatedTimeMinutes,
          }
        }
      }

      const allTasksDone = orderedTasks.every((task) =>
        activities.some(
          (activity) => activity.taskId === task.id && activity.status === 'succeeded'
        )
      )

      if (allTasksDone) {
        if (progress && !progress.done) {
          progress.done = true
          await progress.save()
        } else if (!progress) {
          await ModuleToStudent.create({
            userId: studentId,
            moduleId: module.id,
            done: false,
          })
        }
      }
    }
    return { type: 'no_recommendation' }
  }

  async markSheetAsRead({
    studentId,
    moduleId,
    taskId,
  }: {
    studentId: UUID
    sheetId: number
    moduleId: number
    taskId: number
  }): Promise<void> {
    await StudentTaskActivity.updateOrCreate(
      { studentId, moduleId, taskId, taskType: 'sheet' },
      { status: 'succeeded' }
    )
  }
}
