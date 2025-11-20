import type { UUID } from 'node:crypto'

import type ModuleToStudent from '#models/module_to_student'

export interface ModuleToStudentRepository {
  getModuleProgressByUserId(userId: UUID): Promise<ModuleToStudent[]>
}
