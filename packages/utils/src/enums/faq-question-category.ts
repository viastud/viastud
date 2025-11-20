export const faqQuestionCategory = ['GENERAL', 'SUBSCRIPTION', 'OTHER'] as const

export type FaqQuestionCategory = (typeof faqQuestionCategory)[number]

export const faqQuestionCategoryEnum: Record<FaqQuestionCategory, string> = {
  GENERAL: 'Général',
  SUBSCRIPTION: 'Abonnement',
  OTHER: 'Autres sujets',
}
