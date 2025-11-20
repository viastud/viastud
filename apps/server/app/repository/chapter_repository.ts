import type { Grade, Subject } from '@viastud/utils'

import type Chapter from '#models/chapter'

export interface ChapterRepository {
  getByGradeAndSubject(grade: Grade, subject: Subject): Promise<Chapter[]>
}
