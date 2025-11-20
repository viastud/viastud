import { EyeIcon, EyeOffIcon } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'

import { Input } from '#components/ui/input'

export interface PasswordInputProps extends React.ComponentProps<'input'> {
  error?: boolean
}

export const PasswordInput = ({ ref, ...props }: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false)
  return (
    <Input
      placeholder="Entrez votre mot de passe"
      type={showPassword ? 'text' : 'password'}
      buttonContent={
        showPassword ? <EyeIcon className="size-5" /> : <EyeOffIcon className="size-5" />
      }
      onButtonClick={() => {
        setShowPassword((prev) => !prev)
      }}
      {...props}
      ref={ref}
    />
  )
}

PasswordInput.displayName = 'PasswordInput'
