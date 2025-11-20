export const level = ['STANDARD', 'ADVANCED'] as const

export type Level = (typeof level)[number]

export const LevelEnum: Record<Level, string> = {
  STANDARD: 'Standard',
  ADVANCED: 'Avancé',
}
