import type { UUID } from 'node:crypto'

import type User from '#models/user'

import { InvalidParentException } from '../../exceptions/business/index.js'
import type { ModuleToStudentRepository } from '../../repository/module_to_student_repository.js'
import type { ReservationRepository } from '../../repository/reservation_repository.js'
import type { StudentDetailsRepository } from '../../repository/student_details_repository.js'
import type { StudentTaskActivityRepository } from '../../repository/student_task_activity_repository.js'
import type { UserRepository } from '../../repository/user_repository.js'
import { mapToChildProfile } from './child_profile.mapper.js'

export async function findChildrenWithProfileData(
  userRepository: UserRepository,
  studentDetailsRepository: StudentDetailsRepository,
  moduleToStudentRepository: ModuleToStudentRepository,
  studentTaskActivityRepository: StudentTaskActivityRepository,
  reservationRepository: ReservationRepository,
  parentId: UUID
) {
  const parent: User | null = await userRepository.getById(parentId)

  if (!parent || parent.role !== 'PARENT') {
    throw new InvalidParentException()
  }

  const children: User[] = await userRepository.getChildrenByParentId(parent.id)

  const childrenWithProfilesData = await Promise.all(
    children.map((child) =>
      buildChildProfile(
        child,
        studentDetailsRepository,
        moduleToStudentRepository,
        studentTaskActivityRepository,
        reservationRepository
      )
    )
  )

  return childrenWithProfilesData
}

async function buildChildProfile(
  child: User,
  studentDetailsRepository: StudentDetailsRepository,
  moduleToStudentRepository: ModuleToStudentRepository,
  studentTaskActivityRepository: StudentTaskActivityRepository,
  reservationRepository: ReservationRepository
) {
  const [studentDetails, moduleProgress, taskActivity] = await Promise.all([
    studentDetailsRepository.getStudentDetailsById(child.id),
    moduleToStudentRepository.getModuleProgressByUserId(child.id),
    studentTaskActivityRepository.getByUserId(child.id),
  ])

  const now = new Date()
  const startOfWeek = new Date(now)
  const dayOfWeek = now.getDay()
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  startOfWeek.setDate(now.getDate() - daysToSubtract)
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 7)

  const [weeklyReservationsCount, recentReservations] = await Promise.all([
    reservationRepository.countStudentReservationsBetween(child.id, startOfWeek, endOfWeek),
    reservationRepository.getRecentStudentReservations(child.id, 5),
  ])

  const profile = mapToChildProfile(child, studentDetails, moduleProgress, taskActivity)
  return {
    ...profile,
    weeklyCourseHours: weeklyReservationsCount, // each reservation is a 1h course
    recentReservations,
  }
}
