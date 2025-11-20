import { PaymentList } from '@/components/profile/payment-list'
import type { BillingPresenter } from '@/presenters/billing.presenter'

interface PaymentsSectionProps {
  presenter: BillingPresenter
}

export function PaymentsSection({ presenter }: PaymentsSectionProps) {
  return (
    <div className="flex h-fit min-w-[260px] flex-1 flex-col gap-4 rounded-2xl bg-white p-6 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-base font-semibold">Mes paiements</span>
        <span className="text-gray-400">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <rect width="16" height="20" x="4" y="2" stroke="currentColor" strokeWidth="2" rx="2" />
            <path stroke="currentColor" strokeWidth="2" d="M8 6h8M8 10h8M8 14h6" />
          </svg>
        </span>
      </div>
      <PaymentList
        payments={presenter.displayPayments}
        isLoading={presenter.displayPaymentsLoading}
        maxDisplayed={3}
      />
    </div>
  )
}
