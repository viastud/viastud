import { isValidPhoneNumber } from 'react-phone-number-input'

export const phoneValidator = [
  (value: string) => {
    return isValidPhoneNumber(value)
  },
  { message: 'Le numéro de téléphone est invalide' },
] as const
