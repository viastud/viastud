import type { UUID } from 'node:crypto'

import ModuleToStudent from '#models/module_to_student'

import type { ModuleToStudentRepository } from '../repository/module_to_student_repository.js'

export class AdonisModuleToStudentRepository implements ModuleToStudentRepository {
  async getModuleProgressByUserId(userId: UUID): Promise<ModuleToStudent[]> {
    return await ModuleToStudent.query()
      .where('userId', userId)
      .preload('module', (moduleQuery) => {
        void moduleQuery.preload('chapter')
      })
  }
}
