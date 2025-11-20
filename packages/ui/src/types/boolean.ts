export const boolean = ['true', 'false'] as const

export type Boolean = (typeof boolean)[number]
