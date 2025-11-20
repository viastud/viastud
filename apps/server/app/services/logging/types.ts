export interface LogContext {
  userId?: string
  sessionId?: string
  requestId?: string
  action?: string
  resource?: string
  grade?: string
  subject?: string
  contextName?: ContextName // Nom du contexte métier (optionnel)
  [key: string]: string | number | boolean | undefined
}

export interface BusinessLog {
  level: 'info' | 'warn' | 'error'
  message: string
  context: LogContext
  timestamp: Date
  type: 'business' | 'technical'
}

export interface LogFilter {
  level?: BusinessLog['level'] | BusinessLog['level'][]
  type?: 'business' | 'technical'
  contextKey?: string
  contextValue?: string | number | boolean
}

export interface PaginationOptions {
  page: number
  pageSize: number
}

export interface PaginatedLogs {
  logs: BusinessLog[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface LogFileStats {
  size: number
  lineCount: number
}

export interface ArchiveFile {
  path: string
  fileName: string
  date: string
}

export interface LogStats {
  currentFile: {
    path: string
    size: number
    lineCount: number
  }
  archives: {
    count: number
    files: ArchiveFile[]
  }
}

// Types pour le logging intelligent
export interface LoggingStrategy {
  type: 'once_per_user' | 'once_per_session' | 'cooldown' | 'counter' | 'grouped'
  key: string // Clé unique pour identifier le contexte
  windowMs?: number // Fenêtre de temps pour le cooldown
  maxCount?: number // Nombre maximum avant regroupement
}

export interface LoggingRule {
  contextName?: string // Nom unique du contexte métier (priorité sur pattern)
  pattern?: string // Pattern pour matcher les messages (fallback)
  strategy: LoggingStrategy
  description?: string
}

// Constantes pour les noms de contexte métier
export const CONTEXT_NAMES = {
  MISSING_MODULES: 'missing_modules',
  USER_PROGRESSION: 'user_progression',
  RECOMMENDATION_SEARCH: 'recommendation_search',
  MODULE_SEARCH: 'module_search',
  ALERT_GENERAL: 'alert_general',
} as const

export type ContextName = (typeof CONTEXT_NAMES)[keyof typeof CONTEXT_NAMES]

export interface LoggingContext {
  userId?: string
  sessionId?: string
  requestId?: string
  action?: string
  resource?: string
  [key: string]: string | number | boolean | undefined
}

export interface LoggingResult {
  shouldLog: boolean
  message?: string
  context?: LoggingContext
  count?: number
  lastOccurrence?: Date
}
