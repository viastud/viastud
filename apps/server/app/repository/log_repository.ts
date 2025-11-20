import type {
  BusinessLog,
  LogFilter,
  LogStats,
  PaginatedLogs,
  PaginationOptions,
} from '../services/logging/types.js'

export interface LogRepository {
  save(log: BusinessLog): Promise<void>
  findWithPagination(options: PaginationOptions, filter?: LogFilter): Promise<PaginatedLogs>
  findByLevel(level: BusinessLog['level'], limit?: number): Promise<BusinessLog[]>
  findByContext(contextKey: string, contextValue: string | number | boolean): Promise<BusinessLog[]>
  clear(): Promise<void>
  getStats(): Promise<LogStats>
  getArchiveFiles(): Promise<string[]>
  loadFromArchive(archivePath: string): Promise<BusinessLog[]>
  archiveCurrentFile(): Promise<void>
  isDuplicateLog(log: BusinessLog, timeWindowMs: number): Promise<boolean>
}
