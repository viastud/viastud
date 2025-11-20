import 'dayjs/locale/fr'

import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

// Configuration centralisée de dayjs
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isoWeek)

// Configuration par défaut
const DEFAULT_TIMEZONE = 'Europe/Paris'
//const DEFAULT_TIMEZONE = 'Africa/Casablanca'
const DEFAULT_LOCALE = 'fr'

// Configuration automatique au chargement du module
dayjs.locale(DEFAULT_LOCALE)
dayjs.tz.setDefault(DEFAULT_TIMEZONE)

/**
 * Service centralisé pour la gestion des dates et fuseaux horaires dans l'application
 * Toutes les opérations de dates doivent passer par ce service pour garantir la cohérence
 */
export class DateService {
  private static instance: DateService
  private effectiveTimezone: string

  private constructor() {
    this.effectiveTimezone = this.initializeEffectiveTimezone()
  }

  /**
   * Singleton pour garantir une seule instance du service
   */
  public static getInstance(): DateService {
    if (!DateService.instance) {
      DateService.instance = new DateService()
    }
    return DateService.instance
  }

  /**
   * Obtient le fuseau horaire effectif à utiliser dans l'application
   */
  private initializeEffectiveTimezone(): string {
    const userTimezone = dayjs.tz.guess()
    const defaultTimezone = DEFAULT_TIMEZONE

    // Si l'utilisateur est dans un fuseau horaire différent de la France, utiliser le sien
    return userTimezone !== defaultTimezone ? userTimezone : defaultTimezone
  }

  /**
   * Crée une instance dayjs avec le fuseau horaire effectif
   */
  public create(date?: Date | string): dayjs.Dayjs {
    return dayjs(date).tz(this.effectiveTimezone)
  }

  /**
   * Crée une instance dayjs pour le moment actuel avec le fuseau horaire effectif
   */
  public now(): dayjs.Dayjs {
    return dayjs().tz(this.effectiveTimezone)
  }

  /**
   * Obtient le début de la semaine ISO (lundi) pour une date donnée
   */
  public getStartOfWeek(date?: Date | string): Date {
    return this.create(date).startOf('isoWeek').toDate()
  }

  /**
   * Obtient la fin de la semaine ISO (dimanche) pour une date donnée
   */
  public getEndOfWeek(date?: Date | string): Date {
    return this.create(date).endOf('isoWeek').toDate()
  }

  /**
   * Ajoute un nombre de jours à une date
   */
  public addDays(date: Date | string, days: number): Date {
    return this.create(date).add(days, 'day').toDate()
  }

  /**
   * Ajoute un nombre de semaines à une date
   */
  public addWeeks(date: Date | string, weeks: number): Date {
    return this.create(date).add(weeks, 'week').toDate()
  }

  /**
   * Soustrait un nombre de semaines à une date
   */
  public subtractWeeks(date: Date | string, weeks: number): Date {
    return this.create(date).subtract(weeks, 'week').toDate()
  }

  /**
   * Formate une date selon le pattern spécifié
   */
  public format(date: Date | string, format = 'DD/MM/YYYY'): string {
    return this.create(date).format(format)
  }

  /**
   * Formate une date pour les inputs HTML de type date
   */
  public formatForInput(date: Date): string {
    return this.create(date).format('YYYY-MM-DD')
  }

  /**
   * Parse une date depuis un format d'input HTML
   */
  public parseFromInput(dateString: string): Date | null {
    const parsed = this.create(dateString)
    return parsed.isValid() ? parsed.toDate() : null
  }

  /**
   * Génère les options de semaines pour les sélecteurs
   */
  public generateWeekOptions(
    count = 12,
    dateFormat = 'DD/MM/YYYY'
  ): { label: string; value: string; weekStart: Date; weekEnd: Date }[] {
    const currentWeekStart = this.now().startOf('isoWeek').toDate()

    return Array.from({ length: count }, (_, i) => {
      let weekStart = this.addWeeks(currentWeekStart, i)
      weekStart = this.addDays(weekStart, 1) // Hack pour pas avoir deux fois la même semaine quand on avance d'une heure
      weekStart = this.getStartOfWeek(weekStart)
      const weekEnd = this.getEndOfWeek(weekStart)
      return {
        label: `Semaine du ${this.format(weekStart, dateFormat)}`,
        value: this.formatForInput(weekStart),
        weekStart,
        weekEnd,
      }
    })
  }

  /**
   * Obtient le label d'une semaine (début - fin)
   */
  public getWeekLabel(weekStart: Date, dateFormat = 'DD/MM/YYYY'): string {
    const weekEnd = this.getEndOfWeek(weekStart)
    return `${this.format(weekStart, dateFormat)} – ${this.format(weekEnd, dateFormat)}`
  }

  /**
   * Vérifie si une date est dans le passé
   */
  public isPast(date: Date | string): boolean {
    return this.create(date).isBefore(this.now())
  }

  /**
   * Vérifie si une date est dans le futur
   */
  public isFuture(date: Date | string): boolean {
    return this.create(date).isAfter(this.now())
  }

  /**
   * Vérifie si une date est dans la semaine courante
   */
  public isCurrentWeek(date: Date | string): boolean {
    const weekStart = this.now().startOf('isoWeek')
    const weekEnd = this.now().endOf('isoWeek')
    const targetDate = this.create(date)

    return (
      (targetDate.isAfter(weekStart) || targetDate.isSame(weekStart)) &&
      (targetDate.isBefore(weekEnd) || targetDate.isSame(weekEnd))
    )
  }

  /**
   * Vérifie si deux dates sont dans la même semaine
   */
  public isSameWeek(date1: Date | string, date2: Date | string): boolean {
    const week1Start = this.getStartOfWeek(date1)
    const week2Start = this.getStartOfWeek(date2)
    return this.create(week1Start).isSame(this.create(week2Start), 'day')
  }

  /**
   * Obtient tous les jours d'une semaine (lundi à dimanche)
   */
  public getWeekDays(weekStart: Date): Date[] {
    return Array.from({ length: 7 }, (_, i) => this.addDays(weekStart, i))
  }

  /**
   * Vérifie si une date est future par rapport à maintenant
   */
  public isAfterNow(date: Date | string): boolean {
    return this.create(date).isAfter(this.now())
  }

  /**
   * Vérifie si une date est passée par rapport à maintenant
   */
  public isBeforeNow(date: Date | string): boolean {
    return this.create(date).isBefore(this.now())
  }

  /**
   * Calcule la différence en semaines entre deux dates
   */
  public diffInWeeks(date1: Date | string, date2: Date | string): number {
    return this.create(date1).diff(this.create(date2), 'week')
  }

  /**
   * Obtient le numéro de semaine ISO pour une date donnée
   */
  public getWeekNumber(date: Date | string): number {
    return this.create(date).isoWeek()
  }

  /**
   * Obtient l'année ISO pour une date donnée
   */
  public getISOYear(date: Date | string): number {
    return this.create(date).isoWeekYear()
  }

  /**
   * Convertit une date en format ISO string avec le fuseau horaire effectif
   */
  public toISOString(date: Date | string): string {
    return this.create(date).toISOString()
  }

  /**
   * Obtient le fuseau horaire effectif actuel
   */
  public getEffectiveTimezone(): string {
    return this.effectiveTimezone
  }

  /**
   * Obtient le fuseau horaire de l'utilisateur détecté
   */
  public getUserTimezone(): string {
    return dayjs.tz.guess()
  }

  /**
   * Force la mise à jour du fuseau horaire effectif (utile pour les tests)
   */
  public setEffectiveTimezone(timezoneStr: string): void {
    this.effectiveTimezone = timezoneStr
  }
}

// Instance singleton du service
export const dateService = DateService.getInstance()

// Fonctions utilitaires pour un accès rapide (compatibilité ascendante)
export const createDate = (date?: Date | string) => dateService.create(date)
export const formatDate = (date: Date | string, format?: string) => dateService.format(date, format)
export const formatDateForInput = (date: Date) => dateService.formatForInput(date)
export const getStartOfWeek = (date?: Date | string) => dateService.getStartOfWeek(date)
export const getEndOfWeek = (date?: Date | string) => dateService.getEndOfWeek(date)
export const generateWeekOptions = (count?: number, dateFormat?: string) =>
  dateService.generateWeekOptions(count, dateFormat)
export const getWeekLabel = (weekStart: Date, dateFormat?: string) =>
  dateService.getWeekLabel(weekStart, dateFormat)
export const isPast = (date: Date | string) => dateService.isPast(date)
export const isFuture = (date: Date | string) => dateService.isFuture(date)
export const isCurrentWeek = (date: Date | string) => dateService.isCurrentWeek(date)
export const isSameWeek = (date1: Date | string, date2: Date | string) =>
  dateService.isSameWeek(date1, date2)
export const getWeekDays = (weekStart: Date) => dateService.getWeekDays(weekStart)
export const isAfterNow = (date: Date | string) => dateService.isAfterNow(date)
export const isBeforeNow = (date: Date | string) => dateService.isBeforeNow(date)
export const diffInWeeks = (date1: Date | string, date2: Date | string) =>
  dateService.diffInWeeks(date1, date2)
export const getWeekNumber = (date: Date | string) => dateService.getWeekNumber(date)
export const getISOYear = (date: Date | string) => dateService.getISOYear(date)
export const toISOString = (date: Date | string) => dateService.toISOString(date)
