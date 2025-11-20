import { Badge } from '@viastud/ui/badge'
import { Button } from '@viastud/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@viastud/ui/card'
import { trpc } from '@viastud/ui/lib/trpc'
import { AlertTriangle, Archive, ChevronLeft, ChevronRight, RefreshCw, XCircle } from 'lucide-react'
import { useState } from 'react'

type LogContext = Record<string, string | number | boolean>

interface BusinessLog {
  level: 'info' | 'warn' | 'error'
  message: string
  context: LogContext
  type: string
  timestamp: string
}

export function BusinessLogs() {
  const [filters, setFilters] = useState({
    level: undefined as 'info' | 'warn' | 'error' | undefined,
    limit: 100,
    errorsOnly: true, // Par défaut, ne montrer que les erreurs et avertissements
    page: 1,
    pageSize: 50,
  })

  const [selectedArchive, setSelectedArchive] = useState<string | null>(null)

  const { data, refetch, isLoading } = trpc.admin.getBusinessLogs.useQuery(filters)
  const { data: stats } = trpc.admin.getLogStats.useQuery()
  const { data: archiveData } = trpc.admin.getLogsFromArchive.useQuery(
    { archivePath: selectedArchive ?? '', ...filters },
    { enabled: !!selectedArchive }
  )

  const clearLogsMutation = trpc.admin.clearBusinessLogs.useMutation({
    onSuccess: () => {
      void refetch()
    },
  })

  const currentData = selectedArchive ? archiveData : data
  const errorLogs = currentData?.logs.filter((log: BusinessLog) => log.level === 'error') ?? []
  const warnLogs = currentData?.logs.filter((log: BusinessLog) => log.level === 'warn') ?? []

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }))
  }

  const handleArchiveSelect = (archivePath: string | null) => {
    setSelectedArchive(archivePath)
    setFilters((prev) => ({ ...prev, page: 1 })) // Reset to first page
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Logs Métier</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              clearLogsMutation.mutate()
            }}
            disabled={clearLogsMutation.isPending}
          >
            Vider les logs
          </Button>
        </div>
      </div>

      {/* Statistiques des fichiers */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Statistiques des fichiers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <h4 className="font-medium">Fichier actuel</h4>
                <p className="text-muted-foreground text-sm">
                  {stats.currentFile.lineCount} lignes ({Math.round(stats.currentFile.size / 1024)}{' '}
                  KB)
                </p>
              </div>
              <div>
                <h4 className="font-medium">Archives</h4>
                <p className="text-muted-foreground text-sm">{stats.archives.count} fichiers</p>
              </div>
              <div>
                <h4 className="font-medium">Archive sélectionnée</h4>
                <p className="text-muted-foreground text-sm">{selectedArchive ? 'Oui' : 'Non'}</p>
              </div>
            </div>

            {/* Liste des archives */}
            {stats.archives.files.length > 0 && (
              <div className="mt-4">
                <h4 className="mb-2 font-medium">Archives disponibles</h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedArchive === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      handleArchiveSelect(null)
                    }}
                  >
                    Fichier actuel
                  </Button>
                  {stats.archives.files.map((archive) => (
                    <Button
                      key={archive.path}
                      variant={selectedArchive === archive.path ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        handleArchiveSelect(archive.path)
                      }}
                    >
                      {archive.date}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="text-sm font-medium">Niveau</label>
              <select
                className="ml-2 rounded border p-2"
                value={filters.level ?? ''}
                onChange={(e) => {
                  setFilters({
                    ...filters,
                    level: (e.target.value as 'info' | 'warn' | 'error' | undefined) ?? undefined,
                  })
                }}
              >
                <option value="">Tous</option>
                <option value="error">Erreurs</option>
                <option value="warn">Avertissements</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Taille de page</label>
              <select
                className="ml-2 rounded border p-2"
                value={filters.pageSize}
                onChange={(e) => {
                  setFilters({
                    ...filters,
                    pageSize: parseInt(e.target.value),
                    page: 1, // Reset to first page
                  })
                }}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="errorsOnly"
                checked={filters.errorsOnly}
                onChange={(e) => {
                  setFilters({
                    ...filters,
                    errorsOnly: e.target.checked,
                    page: 1, // Reset to first page
                  })
                }}
              />
              <label htmlFor="errorsOnly" className="text-sm">
                Erreurs et avertissements uniquement
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData?.total ?? 0}</div>
            <p className="text-muted-foreground text-xs">Logs affichés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erreurs</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{errorLogs.length}</div>
            <p className="text-muted-foreground text-xs">Erreurs détectées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avertissements</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{warnLogs.length}</div>
            <p className="text-muted-foreground text-xs">Avertissements détectés</p>
          </CardContent>
        </Card>
      </div>

      {/* Pagination */}
      {currentData && currentData.totalPages > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground text-sm">
                Page {currentData.page} sur {currentData.totalPages}({currentData.total} logs au
                total)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handlePageChange(currentData.page - 1)
                  }}
                  disabled={currentData.page <= 1}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handlePageChange(currentData.page + 1)
                  }}
                  disabled={currentData.page >= currentData.totalPages}
                >
                  Suivant
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs {selectedArchive ? '(Archive)' : '(Actuel)'}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">Chargement...</div>
          ) : currentData?.logs.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">Aucun log à afficher</div>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {currentData?.logs.map((log: BusinessLog, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded border bg-gray-50 p-3 text-sm"
                >
                  {log.level === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                  {log.level === 'warn' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                  <div className="flex-1">
                    <div className="font-medium">{log.message}</div>
                    {Object.keys(log.context).length > 0 && (
                      <div className="text-muted-foreground mt-1 text-xs">
                        {Object.entries(log.context).map(([key, value]) => (
                          <span key={key} className="mr-2">
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {log.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
