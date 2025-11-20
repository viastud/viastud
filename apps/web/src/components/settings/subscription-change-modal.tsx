import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@viastud/ui/dialog'

import { SubscriptionOfferCard } from './subscription_offer_card'

interface SubscriptionChangeModalProps {
  subscribedChildrenCount: number
  isSelectingPlan: boolean
  mode: 'student' | 'parent'
  onSelectPlan: (planId: number) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPlanId?: number | null
}

export const SubscriptionChangeModal = ({
  subscribedChildrenCount,
  isSelectingPlan,
  mode,
  onSelectPlan,
  open,
  onOpenChange,
  currentPlanId,
}: SubscriptionChangeModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex w-full max-w-7xl flex-col gap-6">
        <DialogHeader>
          <DialogTitle>Changer d&apos;abonnement</DialogTitle>
        </DialogHeader>
        <SubscriptionOfferCard
          mode={mode}
          childrenCount={subscribedChildrenCount}
          isLoading={isSelectingPlan}
          onSelectPlan={onSelectPlan}
          currentPlanId={currentPlanId}
        />
      </DialogContent>
    </Dialog>
  )
}
