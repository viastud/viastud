import { z } from 'zod'

import { authProcedure, router } from '#services/trpc_service'

import { AnalyticsService } from '../services/analytics_service.js'
import type { BusinessLog, LogFilter } from '../services/logging/types.js'
import { loggingService } from '../services/logging_service.js'

export const adminRouter = router({
  // ... existing endpoints ...

  getBusinessLogs: authProcedure
    .meta({ guards: ['admin'] })
    .input(
      z.object({
        level: z.enum(['info', 'warn', 'error']).optional(),
        limit: z.number().min(1).max(1000).default(100),
        contextKey: z.string().optional(),
        contextValue: z.string().optional(),
        type: z.enum(['business', 'technical']).optional(),
        // Nouveau paramètre pour filtrer uniquement les erreurs et avertissements
        errorsOnly: z.boolean().default(false),
        // Pagination
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(200).default(50),
      })
    )
    .query(async ({ input }) => {
      const filter: LogFilter = {}

      if (input.errorsOnly) {
        filter.level = ['error', 'warn']
      } else if (input.level) {
        filter.level = input.level
      }

      if (input.type) {
        filter.type = input.type
      }

      const paginatedResult = await loggingService.getLogsWithPagination(
        input.page,
        input.pageSize,
        filter.level,
        filter.type
      )

      return {
        logs: paginatedResult.logs.map((log: BusinessLog) => ({
          ...log,
          timestamp: log.timestamp.toISOString(),
        })),
        total: paginatedResult.total,
        page: paginatedResult.page,
        pageSize: paginatedResult.pageSize,
        totalPages: paginatedResult.totalPages,
      }
    }),

  clearBusinessLogs: authProcedure.meta({ guards: ['admin'] }).mutation(async () => {
    loggingService.clearLogs()
    return { message: 'Logs cleared successfully' }
  }),

  // Nouvelle méthode pour obtenir les statistiques des logs
  getLogStats: authProcedure.meta({ guards: ['admin'] }).query(async () => {
    const stats = await loggingService.getLogFileStats()
    const archiveFiles = await loggingService.getArchiveFiles()

    return {
      currentFile: {
        path: loggingService.getLogFilePath(),
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
  }),

  // Nouvelle méthode pour charger les logs depuis une archive
  getLogsFromArchive: authProcedure
    .meta({ guards: ['admin'] })
    .input(
      z.object({
        archivePath: z.string(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(200).default(50),
        level: z.enum(['info', 'warn', 'error']).optional(),
        type: z.enum(['business', 'technical']).optional(),
      })
    )
    .query(async ({ input }) => {
      const allLogs = await loggingService.loadLogsFromArchive(input.archivePath)

      let filteredLogs = allLogs

      if (input.level) {
        filteredLogs = filteredLogs.filter((log) => log.level === input.level)
      }

      if (input.type) {
        filteredLogs = filteredLogs.filter((log) => log.type === input.type)
      }

      const total = filteredLogs.length
      const totalPages = Math.ceil(total / input.pageSize)
      const startIndex = (input.page - 1) * input.pageSize
      const endIndex = startIndex + input.pageSize

      const paginatedLogs = filteredLogs.slice(startIndex, endIndex)

      return {
        logs: paginatedLogs.map((log) => ({
          ...log,
          timestamp: log.timestamp.toISOString(),
        })),
        total,
        page: input.page,
        pageSize: input.pageSize,
        totalPages,
      }
    }),

  // Nouvelles méthodes pour le smart logging
  getLoggingRules: authProcedure.meta({ guards: ['admin'] }).query(async () => {
    return loggingService.getLoggingRules()
  }),

  addLoggingRule: authProcedure
    .meta({ guards: ['admin'] })
    .input(
      z.object({
        pattern: z.string(),
        strategy: z.object({
          type: z.enum(['once_per_user', 'once_per_session', 'cooldown', 'counter', 'grouped']),
          key: z.string(),
          windowMs: z.number().optional(),
          maxCount: z.number().optional(),
        }),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      loggingService.addLoggingRule(input)
      return { message: 'Logging rule added successfully' }
    }),

  removeLoggingRule: authProcedure
    .meta({ guards: ['admin'] })
    .input(z.string())
    .mutation(async ({ input }) => {
      loggingService.removeLoggingRule(input)
      return { message: 'Logging rule removed successfully' }
    }),

  clearLoggingEntries: authProcedure.meta({ guards: ['admin'] }).mutation(async () => {
    loggingService.clearLoggingEntries()
    return { message: 'Logging entries cleared successfully' }
  }),

  getLoggingStats: authProcedure.meta({ guards: ['admin'] }).query(async () => {
    return loggingService.getLoggingStats()
  }),

  // Analytics endpoints
  getAverageHoursPerStudent: authProcedure.meta({ guards: ['admin'] }).query(async () => {
    return AnalyticsService.getAverageHoursPerStudent()
  }),

  getDemandByDayOfWeek: authProcedure.meta({ guards: ['admin'] }).query(async () => {
    return AnalyticsService.getDemandByDayOfWeek()
  }),

  getAverageSubscriptionDuration: authProcedure.meta({ guards: ['admin'] }).query(async () => {
    return AnalyticsService.getAverageSubscriptionDuration()
  }),

  // Retiré: patterns de retour des élèves

  getActiveUsersCount: authProcedure.meta({ guards: ['admin'] }).query(async () => {
    return AnalyticsService.getActiveUsersCount()
  }),

  getAverageStudentsPerCourse: authProcedure.meta({ guards: ['admin'] }).query(async () => {
    return AnalyticsService.getAverageStudentsPerCourse()
  }),

  getAverageAvailabilityPerProfessor: authProcedure.meta({ guards: ['admin'] }).query(async () => {
    return AnalyticsService.getAverageAvailabilityPerProfessor()
  }),

  getProfessorConversionRate: authProcedure.meta({ guards: ['admin'] }).query(async () => {
    return AnalyticsService.getProfessorConversionRate()
  }),

  getProfessorWeeklyAvailabilityHours: authProcedure.meta({ guards: ['admin'] }).query(async () => {
    return AnalyticsService.getProfessorWeeklyAvailabilityHours()
  }),

  getCancellationRate: authProcedure.meta({ guards: ['admin'] }).query(async () => {
    return AnalyticsService.getCancellationRate()
  }),

  getProfessorMonthlyHours: authProcedure.meta({ guards: ['admin'] }).query(async () => {
    return AnalyticsService.getProfessorMonthlyHours()
  }),

  getProfessorWeeklyHours: authProcedure.meta({ guards: ['admin'] }).query(async () => {
    return AnalyticsService.getProfessorWeeklyHours()
  }),

  getWeeklyAvailabilitiesSummary: authProcedure.meta({ guards: ['admin'] }).query(async () => {
    return AnalyticsService.getWeeklyAvailabilitiesSummary()
  }),

  getProfessorWeeklyAvailabilitiesCount: authProcedure
    .meta({ guards: ['admin'] })
    .query(async () => {
      return AnalyticsService.getProfessorWeeklyAvailabilitiesCount()
    }),

  getProfessorMonthlyAvailabilitiesCount: authProcedure
    .meta({ guards: ['admin'] })
    .query(async () => {
      return AnalyticsService.getProfessorMonthlyAvailabilitiesCount()
    }),

  getDemandByDayOfWeekWeek: authProcedure.meta({ guards: ['admin'] }).query(async () => {
    return AnalyticsService.getDemandByDayOfWeekWeek()
  }),

  getDemandByDayOfWeekMonth: authProcedure.meta({ guards: ['admin'] }).query(async () => {
    return AnalyticsService.getDemandByDayOfWeekMonth()
  }),

  getAllAnalytics: authProcedure.meta({ guards: ['admin'] }).query(async () => {
    return AnalyticsService.getAllAnalytics()
  }),
})
