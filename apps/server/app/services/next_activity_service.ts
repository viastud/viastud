import type { UUID } from 'node:crypto'

import type { Grade, Subject } from '@viastud/utils'

import Chapter from '#models/chapter'
import Module from '#models/module'
import ModuleToStudent from '#models/module_to_student'
import StudentDetails from '#models/student_details'

export interface NextActivity {
  type: 'chapter' | 'module' | 'sheet' | 'quiz' | 'exercise'
  title: string
  module?: {
    id: number
    name: string
  }
  chapter: {
    id: number
    name: string
  }
  estimatedTime: string
  actionUrl: string
}

export class NextActivityService {
  /**
   * Get the next recommended activity for a student
   */
  async getNextActivity(userId: UUID): Promise<NextActivity | null> {
    const userDetails = await StudentDetails.findBy('userId', userId)
    if (!userDetails?.grade || !userDetails.interestedIn.length) {
      return null
    }

    // Check each subject the student is interested in
    for (const subject of userDetails.interestedIn) {
      const nextActivity = await this.getNextActivityForSubject(userId, userDetails.grade, subject)
      if (nextActivity) {
        return nextActivity
      }
    }

    return null
  }

  /**
   * Get next activity for a specific subject
   */
  private async getNextActivityForSubject(
    userId: UUID,
    grade: Grade,
    subject: Subject
  ): Promise<NextActivity | null> {
    // 1. Check if there's a module currently being done
    const currentModule = await this.getCurrentModule(userId, grade, subject)
    if (currentModule) {
      return this.getNextActivityInModule(currentModule)
    }

    // 2. Find the next chapter to start
    const nextChapter = await this.getNextChapter(userId, grade, subject)
    if (nextChapter) {
      const firstModule = await this.getFirstModuleInChapter(nextChapter.id)
      if (firstModule) {
        return {
          type: 'module',
          title: `Commencer: ${firstModule.name}`,
          module: {
            id: firstModule.id,
            name: firstModule.name,
          },
          chapter: {
            id: nextChapter.id,
            name: nextChapter.name,
          },
          estimatedTime: '15 min',
          actionUrl: `/ressources/${grade.toLowerCase()}/${subject.toLowerCase()}`,
        }
      }
    }

    return null
  }

  /**
   * Get current module being studied (doing = true, done = false)
   */
  private async getCurrentModule(userId: UUID, grade: Grade, subject: Subject) {
    const moduleToStudent = await ModuleToStudent.query()
      .where('userId', userId)
      .where('doing', true)
      .where('done', false)
      .preload('module', (moduleQuery) => {
        void moduleQuery.where('grade', grade).where('subject', subject).preload('chapter')
      })
      .first()

    return moduleToStudent?.module ?? null
  }

  /**
   * Get next activity within a module
   */
  private async getNextActivityInModule(module: Module): Promise<NextActivity> {
    // Simple logic: recommend sheet first, then quiz, then exercise
    // You can make this more sophisticated later

    return {
      type: 'sheet',
      title: `Étudier: ${module.name}`,
      module: {
        id: module.id,
        name: module.name,
      },
      chapter: {
        id: module.chapter.id,
        name: module.chapter.name,
      },
      estimatedTime: '15 min',
      actionUrl: `/ressources/${module.grade.toLowerCase()}/${module.subject.toLowerCase()}`,
    }
  }

  /**
   * Find the next chapter to study based on completion
   */
  private async getNextChapter(
    userId: UUID,
    grade: Grade,
    subject: Subject
  ): Promise<Chapter | null> {
    // Get all completed chapters for this user/grade/subject
    const completedChapters = await this.getCompletedChapters(userId, grade, subject)
    const completedChapterIds = completedChapters.map((c) => c.id)

    // Find next chapter by order
    return await Chapter.query()
      .whereNotIn('id', completedChapterIds)
      .orderBy('orderIndex', 'asc')
      .first()
  }

  /**
   * Get completed chapters for a user
   */
  private async getCompletedChapters(
    userId: UUID,
    grade: Grade,
    subject: Subject
  ): Promise<Chapter[]> {
    // A chapter is completed if all its modules are done
    const modules = await Module.query()
      .where('grade', grade)
      .where('subject', subject)
      .preload('chapter')

    const modulesByChapter = modules.reduce<Record<number, typeof modules>>((acc, module) => {
      if (!acc[module.chapterId]) {
        acc[module.chapterId] = []
      }
      acc[module.chapterId].push(module)
      return acc
    }, {})

    const completedChapters: Chapter[] = []

    for (const [, chapterModules] of Object.entries(modulesByChapter)) {
      const moduleIds = chapterModules.map((m) => m.id)

      const completedModulesCount = await ModuleToStudent.query()
        .where('userId', userId)
        .whereIn('moduleId', moduleIds)
        .where('done', true)
        .count('* as total')

      if (completedModulesCount[0].$extras.total === chapterModules.length) {
        // All modules in chapter are done
        completedChapters.push(chapterModules[0].chapter)
      }
    }

    return completedChapters
  }

  /**
   * Get first module in a chapter (by order)
   */
  private async getFirstModuleInChapter(chapterId: number) {
    return await Module.query()
      .where('chapterId', chapterId)
      .orderBy('orderInChapter', 'asc')
      .first()
  }
}
