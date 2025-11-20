import type { UUID } from 'node:crypto'

import type StudentDetails from '#models/student_details'

export interface StudentDetailsRepository {
  getStudentDetailsById(userId: UUID): Promise<StudentDetails | null>
}
