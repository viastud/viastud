import type { Grade, Subject } from '@viastud/utils'

import Chapter from '#models/chapter'

import type { ChapterRepository } from '../repository/chapter_repository.js'

export class AdonisChapterRepository implements ChapterRepository {
  async getByGradeAndSubject(grade: Grade, subject: Subject): Promise<Chapter[]> {
    return await Chapter.query()
      .where('grade', grade)
      .where('subject', subject)
      .preload('module', (moduleQuery) => {
        void moduleQuery.orderBy('orderInChapter', 'asc').preload('tasks')
      })
  }
}
