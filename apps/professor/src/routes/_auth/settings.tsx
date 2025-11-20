import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute } from '@tanstack/react-router'
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
  const { professor, updateAuth } = useAuthStore(
    useShallow((state) => ({
      professor: state.professor,
      updateAuth: state.updateAuth,
    }))
  )

  const [isDirty, setIsDirty] = useState<boolean>(false)

  const changePasswordMutation = trpc.professorAuth.changePassword.useMutation()

  const editProfileForm = useForm<EditProfileSchema>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      id: professor?.id ?? '',
      lastName: professor?.lastName ?? '',
      firstName: professor?.firstName ?? '',
      email: professor?.email ?? '',
      phoneNumber: professor?.phoneNumber ?? '',
    },
  })

  const { mutateAsync: editProfileMutation } = trpc.professor.edit.useMutation({
    onSuccess: (data) => {
      updateAuth({ professor: data, isAuthenticated: true })
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
