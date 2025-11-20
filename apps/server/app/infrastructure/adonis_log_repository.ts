import {
  appendFileSync,
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFile,
} from 'node:fs'
import { join } from 'node:path'

import type { LogRepository } from '../repository/log_repository.js'
import type {
  BusinessLog,
  LogFilter,
  LogStats,
  PaginatedLogs,
  PaginationOptions,
} from '../services/logging/types.js'

export class AdonisLogRepository implements LogRepository {
  private readonly logFilePath: string
  private readonly logsDir: string
  private readonly maxLogsPerFile: number = 1000

  constructor() {
    this.logsDir = join(process.cwd(), 'logs')
    this.logFilePath = join(this.logsDir, 'business-logs.ndjson')
    this.ensureLogsDirectory()
  }

  private ensureLogsDirectory(): void {
    if (!existsSync(this.logsDir)) {
      // Créer le répertoire s'il n'existe pas
      // Note: Cette logique devrait être gérée par le système de fichiers
    }
  }

  private readLogsFromFile(): BusinessLog[] {
    if (!existsSync(this.logFilePath)) return []

    try {
      const fileContent = readFileSync(this.logFilePath, 'utf-8')
      const lines = fileContent
        .trim()
        .split('\n')
        .filter((line) => line.length > 0)

      return lines.map((line) => {
        const parsedLog = JSON.parse(line) as unknown as {
          timestamp: string
          [key: string]: unknown
        }
        return {
          ...parsedLog,
          timestamp: new Date(parsedLog.timestamp),
        } as BusinessLog
      })
    } catch {
      return []
    }
  }

  // Compter les logs dans le fichier
  private getLogCount(): number {
    if (!existsSync(this.logFilePath)) return 0

    try {
      const fileContent = readFileSync(this.logFilePath, 'utf-8')
      return fileContent
        .trim()
        .split('\n')
        .filter((line) => line.length > 0).length
    } catch {
      return 0
    }
  }

  async save(log: BusinessLog): Promise<void> {
    await this.appendLogToFile(log)
    await this.checkAndArchiveIfNeeded()
  }

  private async appendLogToFile(log: BusinessLog): Promise<void> {
    try {
      const logLine = `${JSON.stringify({
        ...log,
        timestamp: log.timestamp.toISOString(),
      })}\n`

      appendFileSync(this.logFilePath, logLine, 'utf-8')
    } catch {
      // Gestion silencieuse des erreurs d'écriture
    }
  }

  private async checkAndArchiveIfNeeded(): Promise<void> {
    const logCount = this.getLogCount()
    if (logCount >= this.maxLogsPerFile) {
      await this.archiveCurrentFile()
      // Garder seulement les 100 derniers logs pour le nouveau fichier
      await this.keepOnlyRecentLogs(100)
    }
  }

  async archiveCurrentFile(): Promise<void> {
    if (!existsSync(this.logFilePath)) return

    try {
      const now = new Date()
      const dateStr = now.toISOString().split('T')[0] // YYYY-MM-DD
      const archivePath = join(this.logsDir, `business-logs-${dateStr}.ndjson`)

      // Si un fichier d'archive existe déjà pour cette date, ajouter un compteur
      let finalArchivePath = archivePath
      let counter = 1
      while (existsSync(finalArchivePath)) {
        finalArchivePath = join(this.logsDir, `business-logs-${dateStr}-${counter}.ndjson`)
        counter++
      }

      renameSync(this.logFilePath, finalArchivePath)
      // eslint-disable-next-line no-console
      console.log(`Logs archivés dans: ${finalArchivePath}`)
    } catch {
      // Gestion silencieuse des erreurs d'archivage
    }
  }

  private async keepOnlyRecentLogs(count: number): Promise<void> {
    const allLogs = this.readLogsFromFile()
    const recentLogs = allLogs.slice(-count)

    try {
      const logsToSave = recentLogs.map((log) => ({
        ...log,
        timestamp: log.timestamp.toISOString(),
      }))

      const ndjsonContent = `${logsToSave.map((log) => JSON.stringify(log)).join('\n')}\n`
      writeFile(this.logFilePath, ndjsonContent, 'utf-8', () => {
        // Callback vide pour la gestion d'erreur
      })
    } catch {
      // Gestion silencieuse des erreurs d'écriture
    }
  }

  async findWithPagination(options: PaginationOptions, filter?: LogFilter): Promise<PaginatedLogs> {
    const allLogs = this.readLogsFromFile()
    let filteredLogs = allLogs

    if (filter?.level) {
      if (Array.isArray(filter.level)) {
        // Si c'est un tableau de niveaux (ex: ['error', 'warn'])
        filteredLogs = filteredLogs.filter((log) => filter.level?.includes(log.level) ?? false)
      } else {
        // Si c'est un niveau unique
        filteredLogs = filteredLogs.filter((log) => log.level === filter.level)
      }
    }

    if (filter?.type) {
      filteredLogs = filteredLogs.filter((log) => log.type === filter.type)
    }

    if (filter?.contextKey && filter?.contextValue !== undefined) {
      filteredLogs = filteredLogs.filter((log) => {
        const contextValue = log.context[filter.contextKey ?? '']
        return contextValue === filter.contextValue
      })
    }

    // Tri par timestamp décroissant (plus récent en premier)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    const total = filteredLogs.length
    const totalPages = Math.ceil(total / options.pageSize)
    const startIndex = (options.page - 1) * options.pageSize
    const endIndex = startIndex + options.pageSize
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex)

    return {
      logs: paginatedLogs,
      total,
      page: options.page,
      pageSize: options.pageSize,
      totalPages,
    }
  }

  async findByLevel(level: BusinessLog['level'], limit = 100): Promise<BusinessLog[]> {
    const allLogs = this.readLogsFromFile()
    return allLogs.filter((log) => log.level === level).slice(-limit)
  }

  async findByContext(
    contextKey: string,
    contextValue: string | number | boolean
  ): Promise<BusinessLog[]> {
    const allLogs = this.readLogsFromFile()
    return allLogs.filter((log) => log.context[contextKey] === contextValue)
  }

  async clear(): Promise<void> {
    try {
      writeFile(this.logFilePath, '', 'utf-8', () => {
        // Callback vide pour la gestion d'erreur
      })
    } catch {
      // Gestion silencieuse des erreurs de suppression
    }
  }

  async getStats(): Promise<LogStats> {
    const stats = this.getLogFileStats()
    const archiveFiles = await this.getArchiveFiles()

    return {
      currentFile: {
        path: this.logFilePath,
        size: stats.size,
        lineCount: stats.lineCount,
      },
      archives: {
        count: archiveFiles.length,
        files: archiveFiles.map((path) => {
          const fileName = path.split('/').pop() ?? ''
          return {
            path,
            fileName,
            date: fileName.replace('business-logs-', '').replace('.ndjson', ''),
          }
        }),
      },
    }
  }

  private getLogFileStats(): { size: number; lineCount: number } {
    if (!existsSync(this.logFilePath)) {
      return { size: 0, lineCount: 0 }
    }

    try {
      const stats = statSync(this.logFilePath)
      const content = readFileSync(this.logFilePath, 'utf-8')
      const lineCount = content.split('\n').filter((line) => line.trim().length > 0).length

      return {
        size: stats.size,
        lineCount,
      }
    } catch {
      return { size: 0, lineCount: 0 }
    }
  }

  async getArchiveFiles(): Promise<string[]> {
    if (!existsSync(this.logsDir)) return []

    try {
      const files = readdirSync(this.logsDir)
      return files
        .filter((file: string) => file.startsWith('business-logs-') && file.endsWith('.ndjson'))
        .map((file: string) => join(this.logsDir, file))
        .sort()
        .reverse() // Plus récent en premier
    } catch {
      return []
    }
  }

  async loadFromArchive(archivePath: string): Promise<BusinessLog[]> {
    if (!existsSync(archivePath)) return []

    try {
      const fileContent = readFileSync(archivePath, 'utf-8')
      const lines = fileContent
        .trim()
        .split('\n')
        .filter((line) => line.length > 0)

      return lines.map((line) => {
        const parsedLog = JSON.parse(line) as unknown as {
          timestamp: string
          [key: string]: unknown
        }
        return {
          ...parsedLog,
          timestamp: new Date(parsedLog.timestamp),
        } as BusinessLog
      })
    } catch {
      return []
    }
  }

  async isDuplicateLog(log: BusinessLog, timeWindowMs: number): Promise<boolean> {
    const allLogs = this.readLogsFromFile()
    const now = new Date()
    const cutoff = new Date(now.getTime() - timeWindowMs)

    return allLogs.some(
      (existingLog) =>
        existingLog.level === log.level &&
        existingLog.message === log.message &&
        existingLog.type === log.type &&
        existingLog.timestamp > cutoff &&
        JSON.stringify(existingLog.context) === JSON.stringify(log.context)
    )
  }
}
