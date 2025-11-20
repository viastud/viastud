import type { UUID } from 'node:crypto'

import StudentDetails from '#models/student_details'

import type { StudentDetailsRepository } from '../repository/student_details_repository.js'

export class AdonisStudentDetailsRepository implements StudentDetailsRepository {
  async getStudentDetailsById(userId: UUID): Promise<StudentDetails | null> {
    return await StudentDetails.findBy('userId', userId)
  }
}
