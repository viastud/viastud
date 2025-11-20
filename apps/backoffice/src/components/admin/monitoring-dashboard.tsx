import { Badge } from '@viastud/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@viastud/ui/card'
import { trpc } from '@viastud/ui/lib/trpc'
import { AlertTriangle, Info, TrendingUp, XCircle } from 'lucide-react'

type LogContext = Record<string, string | number | boolean>

interface BusinessLog {
  level: 'info' | 'warn' | 'error'
  message: string
  context: LogContext
  type: string
  timestamp: string
}

export function MonitoringDashboard() {
  const { data: logs } = trpc.admin.getBusinessLogs.useQuery({
    limit: 1000,
    errorsOnly: true, // Ne récupérer que les erreurs et avertissements
  })

  const errorLogs = logs?.logs.filter((log: BusinessLog) => log.level === 'error') ?? []
  const warnLogs = logs?.logs.filter((log: BusinessLog) => log.level === 'warn') ?? []

  const noModulesWarnings = warnLogs.filter(
    (log: BusinessLog) => log.context.action === 'no_modules_available'
  )

  const getRecentLogs = (level: string, hours = 24) => {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    return (
      logs?.logs.filter(
        (log: BusinessLog) => log.level === level && new Date(log.timestamp) > cutoff
      ) ?? []
    )
  }

  const recentErrors = getRecentLogs('error')
  const recentWarnings = getRecentLogs('warn')

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard de Monitoring</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <Info className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs?.total ?? 0}</div>
            <p className="text-muted-foreground text-xs">Erreurs et avertissements uniquement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erreurs</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{errorLogs.length}</div>
            <p className="text-muted-foreground text-xs">
              {recentErrors.length} dans les dernières 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avertissements</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{warnLogs.length}</div>
            <p className="text-muted-foreground text-xs">
              {recentWarnings.length} dans les dernières 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Types</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {logs?.logs.filter((log: BusinessLog) => log.type === 'business').length ?? 0}
            </div>
            <p className="text-muted-foreground text-xs">Logs métier</p>
          </CardContent>
        </Card>
      </div>

      {/* Problèmes détectés */}
      {noModulesWarnings.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Problème détecté : Modules manquants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-yellow-700">
              {noModulesWarnings.length} avertissement(s) concernant des modules manquants pour
              certains grades/matières.
            </p>
            <div className="space-y-2">
              {noModulesWarnings.slice(0, 5).map((log: BusinessLog, index: number) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary" className="text-xs">
                    {log.context.grade} - {log.context.subject}
                  </Badge>
                  <span className="text-yellow-600">
                    {new Date(log.timestamp).toLocaleString('fr-FR')}
                  </span>
                </div>
              ))}
              {noModulesWarnings.length > 5 && (
                <p className="text-xs text-yellow-600">
                  ... et {noModulesWarnings.length - 5} autres
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs récents */}
      <Card>
        <CardHeader>
          <CardTitle>Logs Récents (24h) - Erreurs et Avertissements uniquement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {logs?.logs
              .filter(
                (log: BusinessLog) =>
                  new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
              )
              .slice(0, 10)
              .map((log: BusinessLog, index: number) => (
                <div key={index} className="flex items-center gap-2 rounded bg-gray-50 p-2 text-sm">
                  {log.level === 'error' && <XCircle className="h-3 w-3 text-red-500" />}
                  {log.level === 'warn' && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                  <span className="flex-1">{log.message}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {log.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
