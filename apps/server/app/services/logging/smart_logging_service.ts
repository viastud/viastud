import type { LogRepository } from '../../repository/log_repository.js'
import type {
  BusinessLog,
  LogContext,
  LogFilter,
  LoggingResult,
  LoggingRule,
  LoggingStrategy,
  LogStats,
  PaginatedLogs,
  PaginationOptions,
} from './types.js'
import { CONTEXT_NAMES } from './types.js'

interface LoggingEntry {
  key: string
  count: number
  firstOccurrence: Date
  lastOccurrence: Date
  message: string
  context: LogContext
}

export class SmartLoggingService {
  private loggingEntries = new Map<string, LoggingEntry>()
  private rules: LoggingRule[] = []

  constructor(
    private readonly logRepository: LogRepository,
    private readonly duplicateCheckWindowMs = 60000
  ) {
    this.initializeDefaultRules()
  }

  private initializeDefaultRules(): void {
    this.rules = [
      // Règles basées sur les contextes nommés
      {
        contextName: CONTEXT_NAMES.MISSING_MODULES,
        strategy: {
          type: 'once_per_user',
          key: 'missing_modules_alert',
        },
        description:
          'Alerte modules manquants - une fois par utilisateur par combinaison grade+subject',
      },
      {
        contextName: CONTEXT_NAMES.USER_PROGRESSION,
        strategy: {
          type: 'cooldown',
          key: 'user_progression',
          windowMs: 300000, // 5 minutes
        },
        description: 'Progression utilisateur - cooldown de 5 minutes',
      },
      {
        contextName: CONTEXT_NAMES.RECOMMENDATION_SEARCH,
        strategy: {
          type: 'cooldown',
          key: 'recommendation_search',
          windowMs: 60000, // 1 minute
        },
        description: 'Recherche de recommandation - cooldown de 1 minute',
      },
      // Règles basées sur les patterns (fallback)
      {
        pattern: '.*ALERT:.*',
        strategy: {
          type: 'cooldown',
          key: 'general_alert',
          windowMs: 300000, // 5 minutes
        },
        description: 'Alertes générales - cooldown de 5 minutes',
      },
      {
        pattern: '.*Erreur.*',
        strategy: {
          type: 'counter',
          key: 'error_counter',
          maxCount: 5,
        },
        description: 'Erreurs - regroupement après 5 occurrences',
      },
    ]
  }

  async info(
    message: string,
    context: LogContext = {},
    type: 'business' | 'technical' = 'business'
  ): Promise<void> {
    await this.smartLog('info', message, context, type)
  }

  async warn(
    message: string,
    context: LogContext = {},
    type: 'business' | 'technical' = 'business'
  ): Promise<void> {
    await this.smartLog('warn', message, context, type)
  }

  async error(
    message: string,
    context: LogContext = {},
    type: 'business' | 'technical' = 'business'
  ): Promise<void> {
    await this.smartLog('error', message, context, type)
  }

  private async smartLog(
    level: BusinessLog['level'],
    message: string,
    context: LogContext,
    type: 'business' | 'technical'
  ): Promise<void> {
    const loggingResult = this.evaluateLoggingStrategy(message, context)

    if (!loggingResult.shouldLog) {
      return // Ne pas logger
    }

    // Créer le log avec le message et contexte mis à jour
    const logEntry: BusinessLog = {
      level,
      message: loggingResult.message ?? message,
      context: loggingResult.context ?? context,
      timestamp: new Date(),
      type,
    }

    // Vérifier s'il y a un doublon récent (logique existante)
    const isDuplicate = await this.logRepository.isDuplicateLog(
      logEntry,
      this.duplicateCheckWindowMs
    )
    if (isDuplicate) {
      return
    }

    // Sauvegarder le log
    await this.logRepository.save(logEntry)

    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      const prefix = `[${level.toUpperCase()}] [${type.toUpperCase()}]`
      const countInfo = loggingResult.count ? ` (${loggingResult.count}x)` : ''
      // eslint-disable-next-line no-console
      console.log(`${prefix} ${message}${countInfo}`, context)
    }
  }

  private evaluateLoggingStrategy(message: string, context: LogContext): LoggingResult {
    // Chercher d'abord par contextName, puis par pattern
    const rule = this.findMatchingRuleByContext(context) ?? this.findMatchingRule(message)
    if (!rule) {
      return { shouldLog: true }
    }

    const key = this.generateKey(rule.strategy, context, rule.contextName)
    const entry = this.loggingEntries.get(key)

    switch (rule.strategy.type) {
      case 'once_per_user':
        return this.handleOncePerUser(key, message, context, entry)
      case 'once_per_session':
        return this.handleOncePerSession(key, message, context, entry)
      case 'cooldown':
        if (rule.strategy.windowMs === undefined) {
          throw new Error('windowMs is required for cooldown strategy')
        }
        return this.handleCooldown(key, message, context, rule.strategy.windowMs, entry)
      case 'counter':
        if (rule.strategy.maxCount === undefined) {
          throw new Error('maxCount is required for counter strategy')
        }
        return this.handleCounter(key, message, context, rule.strategy.maxCount, entry)
      case 'grouped':
        return this.handleGrouped(key, message, context, entry)
      default:
        return { shouldLog: true }
    }
  }

  private findMatchingRuleByContext(context: LogContext): LoggingRule | undefined {
    return this.rules.find((rule) => {
      if (!rule.contextName) return false

      // Si le contexte contient explicitement un contextName, l'utiliser
      if (context.contextName && context.contextName === rule.contextName) {
        return true
      }

      // Sinon, vérifier si le contexte contient les champs nécessaires pour ce contextName
      switch (rule.contextName) {
        case CONTEXT_NAMES.MISSING_MODULES:
          return context.grade && context.subject
        case CONTEXT_NAMES.USER_PROGRESSION:
          return context.userId
        case CONTEXT_NAMES.RECOMMENDATION_SEARCH:
          return context.userId && context.grade && context.subject
        case CONTEXT_NAMES.MODULE_SEARCH:
          return context.grade && context.subject
        default:
          return true // Pour les contextes génériques
      }
    })
  }

  private findMatchingRule(message: string): LoggingRule | undefined {
    return this.rules.find((rule) => rule.pattern && new RegExp(rule.pattern).test(message))
  }

  private generateKey(
    strategy: LoggingStrategy,
    context: LogContext,
    contextName?: string
  ): string {
    const baseKey = strategy.key

    switch (strategy.type) {
      case 'once_per_user':
        return `${baseKey}_${context.userId ?? 'unknown'}`
      case 'once_per_session':
        return `${baseKey}_${context.sessionId ?? 'unknown'}`
      case 'cooldown':
      case 'counter':
      case 'grouped':
        // Pour les contextes nommés, générer une clé basée sur les champs du contexte
        if (contextName) {
          return this.generateContextKey(contextName, context)
        }
        // Fallback sur la clé de base
        return baseKey
      default:
        return baseKey
    }
  }

  private generateContextKey(contextName: string, context: LogContext): string {
    switch (contextName) {
      case CONTEXT_NAMES.MISSING_MODULES:
        return `${contextName}_${context.userId ?? 'unknown'}_${context.grade}_${context.subject}`
      case CONTEXT_NAMES.USER_PROGRESSION:
        return `${contextName}_${context.userId ?? 'unknown'}`
      case CONTEXT_NAMES.RECOMMENDATION_SEARCH:
        return `${contextName}_${context.userId ?? 'unknown'}_${context.grade}_${context.subject}`
      case CONTEXT_NAMES.MODULE_SEARCH:
        return `${contextName}_${context.grade}_${context.subject}`
      default:
        return `${contextName}_${context.userId ?? 'unknown'}`
    }
  }

  private handleOncePerUser(
    key: string,
    message: string,
    context: LogContext,
    entry?: LoggingEntry
  ): LoggingResult {
    if (entry) {
      return { shouldLog: false } // Déjà loggé pour cet utilisateur
    }

    // Créer l'entrée
    this.loggingEntries.set(key, {
      key,
      count: 1,
      firstOccurrence: new Date(),
      lastOccurrence: new Date(),
      message,
      context,
    })

    return { shouldLog: true }
  }

  private handleOncePerSession(
    key: string,
    message: string,
    context: LogContext,
    entry?: LoggingEntry
  ): LoggingResult {
    if (entry) {
      return { shouldLog: false } // Déjà loggé pour cette session
    }

    // Créer l'entrée
    this.loggingEntries.set(key, {
      key,
      count: 1,
      firstOccurrence: new Date(),
      lastOccurrence: new Date(),
      message,
      context,
    })

    return { shouldLog: true }
  }

  private handleCooldown(
    key: string,
    message: string,
    context: LogContext,
    windowMs: number,
    entry?: LoggingEntry
  ): LoggingResult {
    const now = new Date()

    if (entry) {
      const timeSinceLast = now.getTime() - entry.lastOccurrence.getTime()
      if (timeSinceLast < windowMs) {
        return { shouldLog: false } // Encore en cooldown
      }
    }

    // Mettre à jour ou créer l'entrée
    const newEntry: LoggingEntry = {
      key,
      count: (entry?.count ?? 0) + 1,
      firstOccurrence: entry?.firstOccurrence ?? now,
      lastOccurrence: now,
      message,
      context,
    }

    this.loggingEntries.set(key, newEntry)

    // Ajouter le compteur au message si plus d'une occurrence
    const updatedMessage =
      newEntry.count > 1
        ? `${message} (${newEntry.count}x depuis ${newEntry.firstOccurrence.toISOString()})`
        : message

    return {
      shouldLog: true,
      message: updatedMessage,
      count: newEntry.count,
      lastOccurrence: newEntry.lastOccurrence,
    }
  }

  private handleCounter(
    key: string,
    message: string,
    context: LogContext,
    maxCount: number,
    entry?: LoggingEntry
  ): LoggingResult {
    const now = new Date()

    if (entry) {
      const newCount = entry.count + 1
      const newEntry: LoggingEntry = {
        ...entry,
        count: newCount,
        lastOccurrence: now,
      }

      this.loggingEntries.set(key, newEntry)

      // Logger seulement si on atteint le max ou c'est la première fois
      if (newCount === 1 || newCount === maxCount || newCount % maxCount === 0) {
        const updatedMessage =
          newCount > 1
            ? `${message} (${newCount}x depuis ${entry.firstOccurrence.toISOString()})`
            : message

        return {
          shouldLog: true,
          message: updatedMessage,
          count: newCount,
          lastOccurrence: now,
        }
      }

      return { shouldLog: false }
    }

    // Première occurrence
    this.loggingEntries.set(key, {
      key,
      count: 1,
      firstOccurrence: now,
      lastOccurrence: now,
      message,
      context,
    })

    return { shouldLog: true }
  }

  private handleGrouped(
    key: string,
    message: string,
    context: LogContext,
    entry?: LoggingEntry
  ): LoggingResult {
    const now = new Date()

    if (entry) {
      const newCount = entry.count + 1
      const newEntry: LoggingEntry = {
        ...entry,
        count: newCount,
        lastOccurrence: now,
      }

      this.loggingEntries.set(key, newEntry)

      // Logger seulement la première fois et ensuite toutes les 10 occurrences
      if (newCount === 1 || newCount % 10 === 0) {
        const updatedMessage =
          newCount > 1
            ? `${message} (${newCount}x depuis ${entry.firstOccurrence.toISOString()})`
            : message

        return {
          shouldLog: true,
          message: updatedMessage,
          count: newCount,
          lastOccurrence: now,
        }
      }

      return { shouldLog: false }
    }

    // Première occurrence
    this.loggingEntries.set(key, {
      key,
      count: 1,
      firstOccurrence: now,
      lastOccurrence: now,
      message,
      context,
    })

    return { shouldLog: true }
  }

  // Méthodes pour gérer les règles
  addRule(rule: LoggingRule): void {
    this.rules.push(rule)
  }

  removeRule(pattern: string): void {
    this.rules = this.rules.filter((rule) => rule.pattern !== pattern)
  }

  getRules(): LoggingRule[] {
    return [...this.rules]
  }

  clearLoggingEntries(): void {
    this.loggingEntries.clear()
  }

  getLoggingStats(): { totalEntries: number; rules: number } {
    return {
      totalEntries: this.loggingEntries.size,
      rules: this.rules.length,
    }
  }

  // Méthodes de délégation vers le repository
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
