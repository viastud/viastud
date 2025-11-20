import 'dayjs/locale/fr'

import { Button } from '@viastud/ui/button'
import dayjs from 'dayjs'

export function ActiveSubscriptionCard({
  subscriptionStatusData,
  onCancelClick,
  onChangePlanClick,
}: {
  subscriptionStatusData: {
    status: string
    currentPeriodEnd: number | null
    amount: number | null
    hasParent: boolean
  }
  onCancelClick: () => void
  onChangePlanClick: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="shadow-custom flex grow justify-between rounded-2xl bg-yellow-300 px-6 py-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold">Prochain prélèvement</h1>
          <p className="text-gray-700">
            {dayjs
              .unix(Number(subscriptionStatusData.currentPeriodEnd))
              .locale('fr')
              .format('DD MMMM YYYY')}
          </p>
        </div>
        <h1 className="text-xl font-bold">
          {subscriptionStatusData.amount ? `${subscriptionStatusData.amount / 100} €` : ''}
        </h1>
      </div>

      <div className="mt-2 flex justify-end gap-2">
        <Button variant="default" onClick={onChangePlanClick}>
          Changer de plan
        </Button>
        <Button variant="destructive" onClick={onCancelClick}>
          Me désabonner
        </Button>
      </div>
    </div>
  )
}
