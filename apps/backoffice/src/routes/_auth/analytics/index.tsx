import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@viastud/ui/card'
import { trpc } from '@viastud/ui/lib/trpc'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@viastud/ui/select'
import { useState } from 'react'

export const Route = createFileRoute('/_auth/analytics/')({
  component: Analytics,
})

function Analytics() {
  const analyticsQuery = trpc.admin.getAllAnalytics.useQuery()
  const [period, setPeriod] = useState<'week' | 'month'>('week')

  const analytics = analyticsQuery.data

  if (analyticsQuery.isLoading) {
    return (
      <div className="flex w-full flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        </div>
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg text-gray-600">Chargement des données...</div>
        </div>
      </div>
    )
  }

  const hoursData =
    period === 'month' ? analytics?.professorMonthlyHours : analytics?.professorWeeklyHours
  const availData =
    period === 'week'
      ? analytics?.professorWeeklyAvailabilitiesCount
      : analytics?.professorMonthlyAvailabilitiesCount
  interface DemandByDayOfWeekItem {
    dayOfWeek: number
    dayName: string
    reservationCount: number
    percentage: number
  }
  const demandData: DemandByDayOfWeekItem[] | undefined =
    period === 'week' ? analytics?.demandByDayOfWeekWeek : analytics?.demandByDayOfWeekMonth

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-600">
          Dernière mise à jour:{' '}
          {analytics?.generatedAt
            ? new Date(analytics.generatedAt).toLocaleString('fr-FR')
            : new Date().toLocaleString('fr-FR')}
        </p>
      </div>

      {/* Sélecteur global de période (semaine / mois) */}
      <div className="flex w-full items-center justify-end">
        <div className="inline-flex rounded-full border bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => {
              setPeriod('week')
            }}
            className={`rounded-full px-4 py-1 text-sm font-medium ${
              period === 'week' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Semaine
          </button>
          <button
            type="button"
            onClick={() => {
              setPeriod('month')
            }}
            className={`rounded-full px-4 py-1 text-sm font-medium ${
              period === 'month' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Mois
          </button>
        </div>
      </div>

      {/* Métriques des élèves */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Heures de cours en moyenne par élève
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analytics?.averageHoursPerStudent?.averageHours ?? 0}h
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durée moyenne d&apos;abonnement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics?.averageSubscriptionDuration?.averageDays ?? 0} jours
            </div>
            <p className="text-muted-foreground text-xs">
              {analytics?.averageSubscriptionDuration?.totalSubscriptions ?? 0} abonnements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Élèves ayant réservé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {analytics?.activeUsersCount?.weeklyActive ?? 0}
            </div>
            <p className="text-muted-foreground text-xs">
              Cette semaine ({analytics?.activeUsersCount?.monthlyActive ?? 0} ce mois)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Élèves par cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {analytics?.averageStudentsPerCourse?.averageStudents ?? 0}
            </div>
            <p className="text-muted-foreground text-xs">
              Moyenne sur {analytics?.averageStudentsPerCourse?.totalCourses ?? 0} cours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métriques des professeurs */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créneaux proposés (semaine)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {analytics?.weeklyAvailabilitiesSummary?.totalAvailabilities ?? 0}
            </div>
            <p className="text-muted-foreground text-xs">
              par {analytics?.weeklyAvailabilitiesSummary?.professorsCount ?? 0} professeurs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">
              {analytics?.professorConversionRate?.averageConversionRate ?? 0}%
            </div>
            <p className="text-muted-foreground text-xs">Créneaux utilisés vs proposés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d&apos;annulation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              {analytics?.cancellationRate?.cancellationRate ?? 0}%
            </div>
            <p className="text-muted-foreground text-xs">
              {analytics?.cancellationRate?.cancelled ?? 0} /{' '}
              {analytics?.cancellationRate?.total ?? 0} réservations annulées
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Heures réalisées par prof - sélecteur semaine/mois */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Heures réalisées par professeur</CardTitle>
              <CardDescription>Somme des heures de cours effectués par professeur</CardDescription>
            </div>
            <div className="hidden w-40">
              <Select defaultValue="month">
                <SelectTrigger>
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Semaine</SelectItem>
                  <SelectItem value="month">Mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(hoursData ?? []).map((p) => (
              <div
                key={p.professorId}
                className="flex items-center justify-between rounded-md border bg-white px-3 py-2"
              >
                <span className="text-sm text-gray-700">
                  {p.firstName} {p.lastName}
                </span>
                <span className="text-sm font-semibold text-blue-700">{p.hours}h</span>
              </div>
            ))}
            {!hoursData?.length && (
              <div className="text-sm text-gray-500">Aucune donnée disponible.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Créneaux proposés par prof (semaine en cours) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Créneaux proposés par professeur</CardTitle>
              <CardDescription>Nombre de disponibilités déclarées par professeur</CardDescription>
            </div>
            <div className="hidden w-40">
              <Select defaultValue="week">
                <SelectTrigger>
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Semaine</SelectItem>
                  <SelectItem value="month">Mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(availData ?? []).map((p) => (
              <div
                key={p.professorId}
                className="flex items-center justify-between rounded-md border bg-white px-3 py-2"
              >
                <span className="text-sm text-gray-700">
                  {p.firstName} {p.lastName}
                </span>
                <span className="text-sm font-semibold text-indigo-700">
                  {p.availabilitiesCount} créneaux
                </span>
              </div>
            ))}
            {!availData?.length && (
              <div className="text-sm text-gray-500">Aucune donnée disponible.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Demandes par jour de la semaine/mois */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Demande par jour</CardTitle>
              <CardDescription>
                Répartition des réservations de cours selon les jours
              </CardDescription>
            </div>
            <div className="hidden w-40">
              <Select defaultValue="week">
                <SelectTrigger>
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Semaine</SelectItem>
                  <SelectItem value="month">Mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(demandData ?? []).map((day) => (
              <div key={day.dayOfWeek} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-16 text-sm font-medium text-gray-600">{day.dayName}</div>
                  <div className="h-4 flex-1 rounded-full bg-gray-200">
                    <div
                      className="h-4 rounded-full bg-blue-600"
                      style={{ width: `${day.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{day.reservationCount}</span>
                  <span className="text-xs text-gray-500">({day.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
