export const parcoursupWishes = ['DROIT', 'ECONOMIE', 'INGENIEUR', 'PREPA', 'COMMERCE'] as const

export type ParcoursupWish = (typeof parcoursupWishes)[number]

export const ParcoursupWishEnum: Record<ParcoursupWish, string> = {
  DROIT: 'Droit',
  ECONOMIE: 'Économie',
  INGENIEUR: 'Ingénieur',
  PREPA: 'Prépa',
  COMMERCE: 'Commerce',
}
