import { CircleCheck, CircleXIcon } from 'lucide-react'
import { useEffect } from 'react'

export interface PasswordConformity {
  min8Char: boolean
  max20Char: boolean
  min1Number: boolean
  min1Upper: boolean
  min1Lower: boolean
  min1Special: boolean
}

const DEFAULT_PASSWORD_CONFIRMITY: PasswordConformity = {
  min8Char: false,
  max20Char: false,
  min1Number: false,
  min1Upper: false,
  min1Lower: false,
  min1Special: false,
} as const

interface PasswordValidityProps {
  password: string
  passwordConformity?: PasswordConformity
  setPasswordConformity: (passwordConformity: PasswordConformity) => void
}

export const PasswordValidity = ({
  password,
  passwordConformity = DEFAULT_PASSWORD_CONFIRMITY,
  setPasswordConformity,
}: PasswordValidityProps) => {
  useEffect(() => {
    setPasswordConformity({
      min8Char: password.length >= 8,
      max20Char: password.length <= 20 && password.length !== 0,
      min1Number: /[0-9]/g.test(password),
      min1Upper: /[A-Z]/g.test(password),
      min1Lower: /[a-z]/g.test(password),
      min1Special: /[^a-zA-Z0-9]/g.test(password),
    })
  }, [password, setPasswordConformity])

  return (
    <div className="flex gap-4">
      <div className="flex grow flex-col items-start gap-4">
        <div className="flex items-center gap-2">
          {passwordConformity.min8Char ? <CircleCheck color="#1D2CB6" /> : <CircleXIcon />}
          <p className="text-sm font-normal text-gray-950">min 8 caractères</p>
        </div>
        <div className="flex items-center gap-2">
          {passwordConformity.max20Char ? <CircleCheck color="#1D2CB6" /> : <CircleXIcon />}
          <p className="text-sm font-normal text-gray-950">max 20 caractères</p>
        </div>
        <div className="flex items-center gap-2">
          {passwordConformity.min1Number ? <CircleCheck color="#1D2CB6" /> : <CircleXIcon />}
          <p className="text-sm font-normal text-gray-950">1 chiffre</p>
        </div>
      </div>
      <div className="flex grow flex-col items-start gap-4">
        <div className="flex items-center gap-2">
          {passwordConformity.min1Upper ? <CircleCheck color="#1D2CB6" /> : <CircleXIcon />}
          <p className="text-sm font-normal text-gray-950">1 majuscule</p>
        </div>
        <div className="flex items-center gap-2">
          {passwordConformity.min1Lower ? <CircleCheck color="#1D2CB6" /> : <CircleXIcon />}
          <p className="text-sm font-normal text-gray-950">1 minuscule</p>
        </div>
        <div className="flex items-center gap-2">
          {passwordConformity.min1Special ? <CircleCheck color="#1D2CB6" /> : <CircleXIcon />}
          <p className="text-sm font-normal text-gray-950">1 caractère spécial</p>
        </div>
      </div>
    </div>
  )
}
