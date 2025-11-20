import { useBlocker } from '@tanstack/react-router'
import type { UserDto as ServerUserDto } from '@viastud/server/routers/user_auth_router'

// Client-side UserDto with serialized createdAt
export interface UserDto extends Omit<ServerUserDto, 'createdAt'> {
  createdAt: string
}
import { Button } from '@viastud/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@viastud/ui/form'
import { Input } from '@viastud/ui/input'
import type { EditPasswordMutation } from '@viastud/ui/types/edit-password'
import type { UserRole } from '@viastud/utils'
import type { EditProfileSchema } from 'node_modules/@viastud/utils/src/validators/common'
import type { Dispatch, SetStateAction } from 'react'
import { useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'

import { ConfirmLeaveModal } from '#components/shared/confirm-leave-modal'
import { EditPasswordModal } from '#components/shared/edit-password-modal'
import { PhoneInput } from '#components/ui/phone-input'

import { EmailVerificationModal } from './email-verification-modal'
import { PhoneVerificationModal } from './phone-verification-modal'

type EditProfileProps =
  | {
      editPassword?: false
      editProfileForm: UseFormReturn<EditProfileSchema>
      onSubmit: (data: EditProfileSchema) => void
      isDirty: boolean
      setIsDirty: Dispatch<SetStateAction<boolean>>
      user?: UserDto
      role?: UserRole
      updateAuth?: (auth: { user: UserDto; role: UserRole; isAuthenticated: boolean }) => void
    }
  | {
      editPassword: true
      editProfileForm: UseFormReturn<EditProfileSchema>
      onSubmit: (data: EditProfileSchema) => void
      updatePassword: EditPasswordMutation
      isDirty: boolean
      setIsDirty: Dispatch<SetStateAction<boolean>>
      user?: UserDto
      role?: UserRole
      updateAuth?: (auth: { user: UserDto; role: UserRole; isAuthenticated: boolean }) => void
    }

export function EditProfile({
  editProfileForm,
  isDirty,
  setIsDirty,
  onSubmit,
  user,
  role,
  updateAuth,
  ...props
}: EditProfileProps) {
  const [isPhoneVerificationOpen, setIsPhoneVerificationOpen] = useState(false)
  const [isEmailVerificationOpen, setIsEmailVerificationOpen] = useState(false)
  const { status, reset, proceed } = useBlocker({
    shouldBlockFn: () => isDirty,
    withResolver: true,
    disabled: !isDirty,
  })

  const handlePhoneVerificationSuccess = (newPhoneNumber: string) => {
    editProfileForm.setValue('phoneNumber', newPhoneNumber)
    // Pas besoin de marquer comme dirty car l'enregistrement est déjà fait côté serveur
  }

  const handleEmailVerificationSuccess = (newEmail: string) => {
    editProfileForm.setValue('email', newEmail)
    // Pas besoin de marquer comme dirty car l'enregistrement est déjà fait côté serveur
  }

  return (
    <>
      {status === 'blocked' && (
        <ConfirmLeaveModal
          open={true}
          title="Vous avez des modifications de profil non sauvgardées. Êtes-vous sûr de vouloir quitter ?"
          cancel={reset}
          confirm={proceed}
        />
      )}
      <Form {...editProfileForm}>
        <form
          className="flex flex-col gap-4"
          onSubmit={editProfileForm.handleSubmit(onSubmit)}
          onChange={() => {
            setIsDirty(true)
          }}
          onBlur={() => {
            void editProfileForm.trigger()
          }}
        >
          <div className="flex flex-col items-center justify-between md:flex-row">
            <h1 className="text-2xl font-extrabold text-gray-950">Général</h1>
            <Button
              className="border-blue-300"
              type="submit"
              disabled={!isDirty}
              variant={isDirty ? 'default' : 'secondary'}
            >
              Enregistrer les modifications
            </Button>
          </div>
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="flex grow flex-col gap-6">
              <FormField
                control={editProfileForm.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col">
                    <FormLabel className="text-sm font-medium text-gray-700">Nom</FormLabel>
                    <FormControl>
                      <Input
                        className="w-full"
                        {...field}
                        onBlur={() => {
                          field.onBlur()
                          void editProfileForm.trigger('lastName')
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editProfileForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col">
                    <FormLabel className="text-sm font-medium text-gray-700">Prénom</FormLabel>
                    <FormControl>
                      <Input
                        className="w-full"
                        {...field}
                        onBlur={() => {
                          field.onBlur()
                          void editProfileForm.trigger('firstName')
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {props.editPassword && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-gray-700">Mot de passe*</p>
                  <Input disabled className="w-full bg-blue-50" value="********" />
                  <div className="mt-6 flex">
                    <EditPasswordModal updatePassword={props.updatePassword} />
                  </div>
                </div>
              )}
            </div>
            <div className="flex grow flex-col gap-6">
              <FormField
                control={editProfileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Adresse e-mail
                    </FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-2 md:flex-row">
                        <Input
                          className="flex-1 bg-gray-100"
                          {...field}
                          disabled
                          onBlur={() => {
                            field.onBlur()
                            void editProfileForm.trigger('email')
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEmailVerificationOpen(true)
                          }}
                          className="whitespace-nowrap"
                        >
                          Changer
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editProfileForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Numéro de téléphone
                    </FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-2 md:flex-row">
                        <PhoneInput
                          className="flex-1 bg-gray-100"
                          {...field}
                          disabled
                          onBlur={() => {
                            field.onBlur()
                            void editProfileForm.trigger('phoneNumber')
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsPhoneVerificationOpen(true)
                          }}
                          className="whitespace-nowrap"
                        >
                          Changer
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </form>
      </Form>

      <PhoneVerificationModal
        isOpen={isPhoneVerificationOpen}
        onClose={() => {
          setIsPhoneVerificationOpen(false)
        }}
        onSuccess={handlePhoneVerificationSuccess}
        currentPhoneNumber={editProfileForm.watch('phoneNumber')}
        user={user}
        role={role}
        updateAuth={updateAuth}
      />

      <EmailVerificationModal
        isOpen={isEmailVerificationOpen}
        onClose={() => {
          setIsEmailVerificationOpen(false)
        }}
        onSuccess={handleEmailVerificationSuccess}
        currentEmail={editProfileForm.watch('email')}
        user={user}
        role={role}
        updateAuth={updateAuth}
      />
    </>
  )
}
