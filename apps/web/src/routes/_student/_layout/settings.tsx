import { createFileRoute, useSearch } from '@tanstack/react-router'
import { trpc } from '@viastud/ui/lib/trpc'
import { cn } from '@viastud/ui/lib/utils'
import { useState } from 'react'
import { z } from 'zod'

import { DeleteProfile } from '@/components/settings/delete-profile'
import { StudentSettings } from '@/components/settings/student-settings'
import { StudentSubscriptionTab } from '@/components/settings/student-subscription-tab'
import { useAuthStore } from '@/store/auth.store'

const searchSchema = z.object({
  payment_intent: z.string().optional(),
  redirect_status: z.string().optional(),
  tab: z.enum(['ACCOUNT', 'SUBSCRIPTION']).optional(),
})

export const Route = createFileRoute('/_student/_layout/settings')({
  validateSearch: (search) => searchSchema.parse(search),
  component: Settings,
})

function Settings() {
  const authState = useAuthStore()
  const { data: websiteStatus } = trpc.oneTimePeriod.getWebsiteStatusByUser.useQuery()
  const search = useSearch({ from: '/_student/_layout/settings' })

  const [tab, setTab] = useState<'ACCOUNT' | 'SUBSCRIPTION'>(search.tab ?? 'ACCOUNT')
  const [isDirty, setIsDirty] = useState<boolean>(false)

  if (authState.role !== 'STUDENT') return

  // Si l'utilisateur est inscrit à une one time subscription, masquer l'onglet abonnement
  const hideSubscriptionTab =
    process.env.NODE_ENV === 'production' &&
    websiteStatus?.oneTimePeriod === true &&
    websiteStatus.isSubscribed

  return (
    <>
      {!hideSubscriptionTab && (
        <div className="flex w-4/5">
          <div className="mb-4 mt-8 flex cursor-pointer items-center self-start rounded-full bg-blue-100 p-0.5">
            {(['ACCOUNT', 'SUBSCRIPTION'] as const).map((_tab) => (
              <div
                key={_tab}
                className={cn(
                  'flex grow items-center justify-center gap-[10px] rounded-full px-3 py-1.5 text-sm font-medium',
                  { 'bg-white text-blue-600 hover:bg-white hover:text-blue-600': tab === _tab }
                )}
                onClick={() => {
                  setTab(_tab)
                }}
              >
                {_tab === 'ACCOUNT' ? 'Mon compte' : 'Abonnement'}
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === 'ACCOUNT' || hideSubscriptionTab ? (
        <>
          <StudentSettings
            student={authState.user}
            updateAuth={authState.updateAuth}
            editPassword
            isDirty={isDirty}
            setIsDirty={setIsDirty}
          />

          <DeleteProfile id={authState.user.id} />
        </>
      ) : (
        <StudentSubscriptionTab />
      )}
    </>
  )
}
