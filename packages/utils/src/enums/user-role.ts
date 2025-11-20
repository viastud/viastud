export const userRole = ['PARENT', 'STUDENT'] as const

export type UserRole = (typeof userRole)[number]

export const UserRoleEnum: Record<UserRole, string> = {
  PARENT: 'Parent',
  STUDENT: 'Élève',
}
