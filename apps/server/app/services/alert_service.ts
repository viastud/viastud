import { CONTEXT_NAMES } from './logging/types.js'
import { loggingService } from './logging_service.js'

export interface Alert {
  id: string
  type: 'warning' | 'error' | 'info'
  title: string
  message: string
  context: Record<string, string | number | boolean>
  timestamp: Date
  resolved: boolean
  resolvedAt?: Date
}

export class AlertService {
  private static instance: AlertService
  private alerts: Alert[] = []

  static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService()
    }
    return AlertService.instance
  }

  createAlert(
    type: Alert['type'],
    title: string,
    message: string,
    context: Record<string, string | number | boolean> = {}
  ): Alert {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      type,
      title,
      message,
      context,
      timestamp: new Date(),
      resolved: false,
    }

    this.alerts.push(alert)

    // Log the alert avec le type 'business' pour les alertes métier
    const logLevel = type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'info'
    loggingService[logLevel](`ALERT: ${title} - ${message}`, context, 'business')

    return alert
  }

  resolveAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId)
    if (alert) {
      alert.resolved = true
      alert.resolvedAt = new Date()
    }
  }

  getActiveAlerts(): Alert[] {
    return this.alerts.filter((alert) => !alert.resolved)
  }

  getAllAlerts(): Alert[] {
    return this.alerts
  }

  clearResolvedAlerts(): void {
    this.alerts = this.alerts.filter((alert) => !alert.resolved)
  }

  // Méthodes spécifiques pour détecter des problèmes courants
  checkForMissingModules(grade: string, subject: string, moduleCount: number): void {
    if (moduleCount === 0) {
      this.createAlert(
        'warning',
        'Modules manquants',
        `Aucun module disponible pour ${grade} - ${subject}`,
        {
          grade,
          subject,
          moduleCount,
          contextName: CONTEXT_NAMES.MISSING_MODULES, // Ajout du nom de contexte
        }
      )
    }
  }

  checkForNoRecommendations(userId: string, grade: string, subject: string): void {
    this.createAlert(
      'warning',
      'Aucune recommandation',
      `Aucune recommandation générée pour l'utilisateur ${userId} (${grade} - ${subject})`,
      {
        userId,
        grade,
        subject,
        contextName: CONTEXT_NAMES.RECOMMENDATION_SEARCH, // Ajout du nom de contexte
      }
    )
  }

  checkForDatabaseIssues(error: Error | string): void {
    const errorMessage = typeof error === 'string' ? error : error.message
    const errorString = typeof error === 'string' ? error : error.toString()

    this.createAlert(
      'error',
      'Problème de base de données',
      `Erreur de base de données: ${errorMessage}`,
      { error: errorString }
    )
  }
}

export const alertService = AlertService.getInstance()
