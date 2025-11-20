import { AdonisLogRepository } from '../infrastructure/adonis_log_repository.js'
import { SmartLoggingService } from './logging/smart_logging_service.js'
import type {
  BusinessLog,
  LogContext,
  LogFilter,
  LoggingRule,
  PaginationOptions,
} from './logging/types.js'

// Instance singleton du repository
const logRepository = new AdonisLogRepository()

// Instance singleton du service de logging intelligent
const smartLoggingService = new SmartLoggingService(logRepository)

// Interface publique compatible avec l'ancien code
export type { BusinessLog, LogContext } from './logging/types.js'

export class LoggingServiceAdapter {
  private static instance: LoggingServiceAdapter

  static getInstance(): LoggingServiceAdapter {
    if (!LoggingServiceAdapter.instance) {
      LoggingServiceAdapter.instance = new LoggingServiceAdapter()
    }
    return LoggingServiceAdapter.instance
  }

  // Méthodes publiques compatibles avec l'ancien code
  info(
    message: string,
    context: LogContext = {},
    type: 'business' | 'technical' = 'business'
  ): void {
    void smartLoggingService.info(message, context, type)
  }

  warn(
    message: string,
    context: LogContext = {},
    type: 'business' | 'technical' = 'business'
  ): void {
    void smartLoggingService.warn(message, context, type)
  }

  error(
    message: string,
    context: LogContext = {},
    type: 'business' | 'technical' = 'business'
  ): void {
    void smartLoggingService.error(message, context, type)
  }

  // Méthodes de récupération avec pagination
  getLogsWithPagination(
    page = 1,
    pageSize = 50,
    level?: BusinessLog['level'] | BusinessLog['level'][],
    type?: 'business' | 'technical'
  ) {
    const options: PaginationOptions = { page, pageSize }
    const filter: LogFilter | undefined = level || type ? { level, type } : undefined
    return smartLoggingService.getLogsWithPagination(options, filter)
  }

  getLogs(
    level?: BusinessLog['level'],
    limit = 100,
    type?: 'business' | 'technical'
  ): Promise<BusinessLog[]> {
    // Pour la compatibilité, on utilise la pagination avec une grande taille de page
    return smartLoggingService
      .getLogsWithPagination(
        { page: 1, pageSize: limit },
        level || type ? { level, type } : undefined
      )
      .then((result) => result.logs)
  }

  getLogsByContext(
    contextKey: string,
    contextValue: string | number | boolean
  ): Promise<BusinessLog[]> {
    return smartLoggingService.getLogsByContext(contextKey, contextValue)
  }

  getErrorLogs(limit = 100): Promise<BusinessLog[]> {
    return smartLoggingService.getErrorLogs(limit)
  }

  getWarningLogs(limit = 100): Promise<BusinessLog[]> {
    return smartLoggingService.getWarningLogs(limit)
  }

  clearLogs(): void {
    void smartLoggingService.clearLogs()
  }

  getLogFilePath(): string {
    // Cette méthode retourne le chemin du fichier actuel
    return (logRepository as unknown as { logFilePath?: string }).logFilePath ?? ''
  }

  setFileLoggingEnabled(enabled: boolean): void {
    // Cette méthode peut être étendue pour activer/désactiver le logging fichier
    // eslint-disable-next-line no-console
    console.log(`File logging ${enabled ? 'enabled' : 'disabled'}`)
  }

  getLogFileStats(): Promise<{ size: number; lineCount: number }> {
    return smartLoggingService.getLogStats().then((stats) => ({
      size: stats.currentFile.size,
      lineCount: stats.currentFile.lineCount,
    }))
  }

  getArchiveFiles(): Promise<string[]> {
    return smartLoggingService.getArchiveFiles()
  }

  loadLogsFromArchive(archivePath: string): Promise<BusinessLog[]> {
    return smartLoggingService.loadLogsFromArchive(archivePath)
  }

  // Nouvelles méthodes pour le smart logging
  addLoggingRule(rule: LoggingRule): void {
    smartLoggingService.addRule(rule)
  }

  removeLoggingRule(pattern: string): void {
    smartLoggingService.removeRule(pattern)
  }

  getLoggingRules(): LoggingRule[] {
    return smartLoggingService.getRules()
  }

  clearLoggingEntries(): void {
    smartLoggingService.clearLoggingEntries()
  }

  getLoggingStats(): { totalEntries: number; rules: number } {
    return smartLoggingService.getLoggingStats()
  }
}

export const loggingService = LoggingServiceAdapter.getInstance()
