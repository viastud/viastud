import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute } from '@tanstack/react-router'
import { useToast } from '@viastud/ui/hooks/use-toast'
import { trpc } from '@viastud/ui/lib/trpc'
import { EditProfile } from '@viastud/ui/shared/edit-profile'
import type { EditProfileSchema } from '@viastud/utils'
import { editProfileSchema } from '@viastud/utils'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useShallow } from 'zustand/shallow'

import { useAuthStore } from '@/store/auth.store'

export const Route = createFileRoute('/_auth/settings')({
  component: Settings,
})

function Settings() {
  const { admin, updateAuth } = useAuthStore(
    useShallow((state) => ({
      admin: state.admin,
      updateAuth: state.updateAuth,
    }))
  )

  const [isDirty, setIsDirty] = useState<boolean>(false)
  const { toast } = useToast()

  const changePasswordMutation = trpc.adminAuth.changePassword.useMutation()

  const editProfileForm = useForm<EditProfileSchema>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      id: admin?.id ?? '',
      lastName: admin?.lastName ?? '',
      firstName: admin?.firstName ?? '',
      email: admin?.email ?? '',
      phoneNumber: admin?.phoneNumber ?? '',
    },
  })

  const { mutateAsync: editProfileMutation } = trpc.adminAuth.edit.useMutation({
    onSuccess: (data) => {
      if (updateAuth) updateAuth({ admin: data, isAuthenticated: true })
      toast({
        title: 'Profil modifié avec succès',
      })
      setIsDirty(false)
    },
    onError: () => {
      toast({
        title: 'Erreur lors de la modification du profil',
      })
    },
  })

  const onSubmit = async (data: EditProfileSchema) => {
    await editProfileMutation(data)
  }

  return (
    <div className="flex w-4/5 flex-col gap-4 pt-4">
      <EditProfile
        editProfileForm={editProfileForm}
        onSubmit={onSubmit}
        editPassword
        updatePassword={changePasswordMutation}
        isDirty={isDirty}
        setIsDirty={setIsDirty}
      />
    </div>
  )
}
