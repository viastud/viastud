import { createFileRoute } from '@tanstack/react-router'

import { ProfileCard } from '@/components/profile/profile-card'
import { SupportContact } from '@/components/profile/support-contact'
import { useProfilePresenter } from '@/presenters/profile.presenter'
import { useProfilePromotionalCodePresenter } from '@/presenters/profile-promotional-code.presenter'

export const Route = createFileRoute('/_student/_layout/profile')({
  component: Profile,
})

function Profile() {
  const profilePresenter = useProfilePresenter()
  const promotionalCodePresenter = useProfilePromotionalCodePresenter()

  return (
    <>
      <div className="grid w-full grid-cols-1 gap-6 px-4 py-8 md:grid-cols-1 md:px-12">
        <ProfileCard
          presenter={profilePresenter}
          promotionalCodePresenter={promotionalCodePresenter}
        />
      </div>

      {/* Tableau de progression */}
      <div className="w-full px-4 md:px-12"></div>

      <div className="mt-8 flex w-full flex-col gap-6 px-4 pb-8 md:px-12">
        <SupportContact presenter={profilePresenter} />
      </div>
    </>
  )
}
