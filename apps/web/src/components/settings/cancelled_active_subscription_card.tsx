import dayjs from 'dayjs'

export function CancelledActiveSubscriptionCard({
  currentPeriodEnd,
}: {
  currentPeriodEnd: number
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-300 bg-gray-100 p-6">
      <h1 className="text-xl font-bold text-gray-900">Abonnement en cours d’annulation</h1>
      <p className="text-gray-700">
        Vous avez annulé votre abonnement. Vous conserverez l’accès jusqu’au{' '}
        <strong>{dayjs.unix(currentPeriodEnd).locale('fr').format('DD MMMM YYYY')}</strong>.
      </p>
    </div>
  )
}
