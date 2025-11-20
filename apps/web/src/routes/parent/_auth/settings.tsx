import { zodResolver } from '@hookform/resolvers/zod'
import { skipToken } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useToast } from '@viastud/ui/hooks/use-toast'
import { trpc } from '@viastud/ui/lib/trpc'
import { cn } from '@viastud/ui/lib/utils'
import { ConfirmLeaveModal } from '@viastud/ui/shared/confirm-leave-modal'
import type { UserDto } from '@viastud/ui/shared/edit-profile'
import { EditProfile } from '@viastud/ui/shared/edit-profile'
import type { EditProfileSchema } from '@viastud/utils'
import { editProfileSchema } from '@viastud/utils'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { useShallow } from 'zustand/shallow'

import { DeleteProfile } from '@/components/settings/delete-profile'
import { ParentSubscriptionTab } from '@/components/settings/parent-subscription-tab'
import { StudentSettings } from '@/components/settings/student-settings'
import { AddChildModal } from '@/components/users/add-child-modal'
import { DeleteChildModal } from '@/components/users/delete-child-modal'
import { useAuthStore } from '@/store/auth.store'

export const Route = createFileRoute('/parent/_auth/settings')({
  component: Settings,
})

function Settings() {
  const { parent, updateAuth } = useAuthStore(
    useShallow((state) => ({
      parent: state.user,
      updateAuth: state.updateAuth,
    }))
  )

  const { data: websiteStatus } = trpc.oneTimePeriod.getWebsiteStatusByUser.useQuery()

  const editProfileForm = useForm<EditProfileSchema>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      id: parent?.id ?? '',
      lastName: parent?.lastName ?? '',
      firstName: parent?.firstName ?? '',
      email: parent?.email ?? '',
      phoneNumber: parent?.phoneNumber ?? '',
    },
  })

  const childrenData = trpc.user.getChildren.useQuery(parent ? parent.id : skipToken)
  const children = useMemo(() => childrenData.data ?? [], [childrenData.data])
  const [selectedChild, setSelectedChild] = useState<UserDto | null>(null)
  const [isDirty, setIsDirty] = useState<boolean>(false)
  const [isChildDirty, setIsChildDirty] = useState<boolean>(false)
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false)
  const [tab, setTab] = useState<'ACCOUNT' | 'SUBSCRIPTION'>('ACCOUNT')
  const { toast } = useToast()

  const { mutateAsync: editProfileMutation } = trpc.user.edit.useMutation({
    onSuccess: (data) => {
      updateAuth({ user: data, role: 'PARENT', isAuthenticated: true })
      toast({
        title: 'Profil modifié avec succès',
      })
    },
    onError: () => {
      toast({
        title: 'Erreur lors de la modification du profil',
      })
    },
  })

  const changePasswordMutation = trpc.userAuth.changePassword.useMutation()

  const onSubmit = async (data: z.infer<typeof editProfileSchema>) => {
    await editProfileMutation(data)
  }

  const handleChildClick = (child: UserDto) => {
    if (isChildDirty) {
      setConfirmOpen(true)
    } else {
      setSelectedChild(child)
    }
  }

  useEffect(() => {
    if (children) {
      setSelectedChild(children[0])
    }
  }, [children])

  // Si l'utilisateur est inscrit à une one time subscription, masquer l'onglet abonnement
  const hideSubscriptionTab = websiteStatus?.oneTimePeriod === true && websiteStatus.isSubscribed

  return (
    <>
      <div className="flex w-4/5">
        {!hideSubscriptionTab && (
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
        )}
      </div>
      {tab === 'ACCOUNT' || hideSubscriptionTab ? (
        <>
          <div className="flex w-4/5 flex-col gap-4 pt-4">
            <EditProfile
              editProfileForm={editProfileForm}
              onSubmit={onSubmit}
              editPassword
              updatePassword={changePasswordMutation}
              isDirty={isDirty}
              setIsDirty={setIsDirty}
            />
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-extrabold text-gray-950">Mes enfants</h1>
              <AddChildModal isDirty={isChildDirty} refresh={childrenData.refetch} />
            </div>
            {children.length > 0 && (
              <div className="flex self-stretch rounded-full bg-blue-100 p-0.5">
                {children.map((child) =>
                  child === selectedChild ? (
                    <div
                      key={child.id}
                      className="flex flex-1 cursor-pointer items-center justify-center rounded-full bg-white px-3 py-1.5 text-sm text-blue-600"
                    >
                      <div className="flex items-center justify-center gap-2 text-sm">
                        {child.firstName}
                        <DeleteChildModal refresh={childrenData.refetch} user={child} />
                      </div>
                    </div>
                  ) : (
                    <>
                      <ConfirmLeaveModal
                        open={confirmOpen}
                        title="Vous avez des modifications non sauvegardées pour vos enfants. Ceci annulera les changements. Êtes-vous sûr de vouloir continuer ?"
                        cancel={() => {
                          setConfirmOpen(false)
                        }}
                        confirm={() => {
                          setConfirmOpen(false)
                          setSelectedChild(child)
                          setIsChildDirty(false)
                        }}
                      />
                      <div
                        key={child.id}
                        className="flex flex-1 cursor-pointer items-center justify-center rounded-full px-3 py-1.5 text-sm text-gray-700"
                        onClick={() => {
                          handleChildClick(child)
                        }}
                      >
                        {child.firstName}
                      </div>
                    </>
                  )
                )}
              </div>
            )}
          </div>
          {children.map(
            (child) =>
              selectedChild?.id === child.id && (
                <StudentSettings
                  key={child.id}
                  student={child}
                  updateAuth={undefined} // Ne pas changer l'auth du parent
                  editPassword={false} // Désactiver le changement de mot de passe pour les parents
                  isDirty={isChildDirty}
                  setIsDirty={setIsChildDirty}
                  onSuccess={() => {
                    // Rafraîchir les données des enfants après modification
                    void childrenData.refetch()
                  }}
                />
              )
          )}
          {parent && <DeleteProfile id={parent.id} />}
        </>
      ) : (
        <ParentSubscriptionTab />
      )}
    </>
  )
}
