import { dateService } from './date-service'

export interface WeekOption {
  label: string
  value: string
  weekStart: Date
  weekEnd: Date
}

/**
 * Obtient le début de la semaine ISO (lundi) pour une date donnée
 */
export function getStartOfWeek(date: Date): Date {
  return dateService.getStartOfWeek(date)
}

/**
 * Obtient la fin de la semaine ISO (dimanche) pour une date donnée
 */
export function getEndOfWeek(date: Date): Date {
  return dateService.getEndOfWeek(date)
}

/**
 * Ajoute un nombre de jours à une date
 */
export function addDays(date: Date, days: number): Date {
  return dateService.addDays(date, days)
}

/**
 * Ajoute un nombre de semaines à une date
 */
export function addWeeks(date: Date, weeks: number): Date {
  return dateService.addWeeks(date, weeks)
}

/**
 * Soustrait un nombre de semaines à une date
 */
export function subtractWeeks(date: Date, weeks: number): Date {
  return dateService.subtractWeeks(date, weeks)
}

/**
 * Formate une date pour l'affichage
 */
export function formatDate(date: Date, formatStr = 'DD/MM/YYYY'): string {
  return dateService.format(date, formatStr)
}

/**
 * Formate une date pour les inputs HTML de type date
 */
export function formatDateForInput(date: Date): string {
  return dateService.formatForInput(date)
}

/**
 * Parse une date depuis un format d'input HTML
 */
export function parseFromInput(dateString: string): Date | null {
  return dateService.parseFromInput(dateString)
}

/**
 * Génère les options de semaines pour les sélecteurs
 */
export function generateWeekOptions(count = 12, dateFormat = 'DD/MM/YYYY'): WeekOption[] {
  return dateService.generateWeekOptions(count, dateFormat)
}

/**
 * Obtient le label d'une semaine (début - fin)
 */
export function getWeekLabel(weekStart: Date, dateFormat = 'DD/MM/YYYY'): string {
  return dateService.getWeekLabel(weekStart, dateFormat)
}

/**
 * Vérifie si une date est dans le passé
 */
export function isPast(date: Date): boolean {
  return dateService.isPast(date)
}

/**
 * Vérifie si une date est dans le futur
 */
export function isFuture(date: Date): boolean {
  return dateService.isFuture(date)
}

/**
 * Vérifie si une date est dans la semaine courante
 */
export function isCurrentWeek(date: Date): boolean {
  return dateService.isCurrentWeek(date)
}

/**
 * Vérifie si deux dates sont dans la même semaine
 */
export function isSameWeek(date1: Date, date2: Date): boolean {
  return dateService.isSameWeek(date1, date2)
}

/**
 * Obtient tous les jours d'une semaine (lundi à dimanche)
 */
export function getWeekDays(weekStart: Date): Date[] {
  return dateService.getWeekDays(weekStart)
}

/**
 * Vérifie si une date est future par rapport à maintenant
 */
export function isAfterNow(date: Date): boolean {
  return dateService.isAfterNow(date)
}

/**
 * Vérifie si une date est passée par rapport à maintenant
 */
export function isBeforeNow(date: Date): boolean {
  return dateService.isBeforeNow(date)
}

/**
 * Calcule la différence en semaines entre deux dates
 */
export function diffInWeeks(date1: Date, date2: Date): number {
  return dateService.diffInWeeks(date1, date2)
}

/**
 * Obtient le numéro de semaine ISO pour une date donnée
 */
export function getWeekNumber(date: Date): number {
  return dateService.getWeekNumber(date)
}

/**
 * Obtient l'année ISO pour une date donnée
 */
export function getISOYear(date: Date): number {
  return dateService.getISOYear(date)
}

/**
 * Convertit une date en format ISO string avec le fuseau horaire effectif
 */
export function toISOString(date: Date): string {
  return dateService.toISOString(date)
}

/**
 * Obtient le fuseau horaire effectif actuel
 */
export function getEffectiveTimezone(): string {
  return dateService.getEffectiveTimezone()
}

/**
 * Obtient le fuseau horaire de l'utilisateur détecté
 */
export function getUserTimezone(): string {
  return dateService.getUserTimezone()
}

/**
 * Force la mise à jour du fuseau horaire effectif (utile pour les tests)
 */
export function setEffectiveTimezone(timezone: string): void {
  dateService.setEffectiveTimezone(timezone)
}

/**
 * Objet de compatibilité pour les imports existants
 */
export const WeekUtils = {
  getStartOfWeek,
  getEndOfWeek,
  addDays,
  addWeeks,
  subtractWeeks,
  format: formatDate,
  formatDateForInput,
  parseFromInput,
  generateWeekOptions,
  getWeekLabel,
  isPast,
  isFuture,
  isCurrentWeek,
  isSameWeek,
  getWeekDays,
  isAfterNow,
  isBeforeNow,
  diffInWeeks,
  getWeekNumber,
  getISOYear,
  toISOString,
  getEffectiveTimezone,
  getUserTimezone,
  setEffectiveTimezone,
}
