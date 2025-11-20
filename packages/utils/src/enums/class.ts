export const grade = ['TROISIEME', 'SECONDE', 'PREMIERE', 'TERMINALE'] as const

export type Grade = (typeof grade)[number]

export const GradeEnum: Record<Grade, string> = {
  TROISIEME: 'Troisième',
  SECONDE: 'Seconde',
  PREMIERE: 'Première',
  TERMINALE: 'Terminale',
}
