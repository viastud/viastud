import type { LogRepository } from '../../repository/log_repository.js'
import type {
  BusinessLog,
  LogContext,
  LogFilter,
  LogStats,
  PaginatedLogs,
  PaginationOptions,
} from './types.js'

export class LoggingService {
  constructor(
    private readonly logRepository: LogRepository,
    private readonly duplicateCheckWindowMs = 60000 // 1 minute par défaut
  ) {}

  async info(
    message: string,
    context: LogContext = {},
    type: 'business' | 'technical' = 'business'
  ): Promise<void> {
    await this.log('info', message, context, type)
  }

  async warn(
    message: string,
    context: LogContext = {},
    type: 'business' | 'technical' = 'business'
  ): Promise<void> {
    await this.log('warn', message, context, type)
  }

  async error(
    message: string,
    context: LogContext = {},
    type: 'business' | 'technical' = 'business'
  ): Promise<void> {
    await this.log('error', message, context, type)
  }

  private async log(
    level: BusinessLog['level'],
    message: string,
    context: LogContext,
    type: 'business' | 'technical'
  ): Promise<void> {
    const logEntry: BusinessLog = {
      level,
      message,
      context,
      timestamp: new Date(),
      type,
    }

    // Vérifier s'il y a un doublon récent
    const isDuplicate = await this.logRepository.isDuplicateLog(
      logEntry,
      this.duplicateCheckWindowMs
    )
    if (isDuplicate) {
      return // Ignorer le doublon
    }

    // Sauvegarder le log
    await this.logRepository.save(logEntry)
  }

  async getLogsWithPagination(
    options: PaginationOptions,
    filter?: LogFilter
  ): Promise<PaginatedLogs> {
    return await this.logRepository.findWithPagination(options, filter)
  }

  async getErrorLogs(limit = 100): Promise<BusinessLog[]> {
    return await this.logRepository.findByLevel('error', limit)
  }

  async getWarningLogs(limit = 100): Promise<BusinessLog[]> {
    return await this.logRepository.findByLevel('warn', limit)
  }

  async getLogsByContext(
    contextKey: string,
    contextValue: string | number | boolean
  ): Promise<BusinessLog[]> {
    return await this.logRepository.findByContext(contextKey, contextValue)
  }

  async clearLogs(): Promise<void> {
    await this.logRepository.clear()
  }

  async getLogStats(): Promise<LogStats> {
    return await this.logRepository.getStats()
  }

  async getArchiveFiles(): Promise<string[]> {
    return await this.logRepository.getArchiveFiles()
  }

  async loadLogsFromArchive(archivePath: string): Promise<BusinessLog[]> {
    return await this.logRepository.loadFromArchive(archivePath)
  }
}
