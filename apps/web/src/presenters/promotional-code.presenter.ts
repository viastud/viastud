import { trpc } from '@viastud/ui/lib/trpc'
import { useState } from 'react'

// Constantes de validation du code promotionnel (doivent correspondre au backend)
const ALLOWED_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const PROMOTIONAL_CODE_REGEX = new RegExp(`^[${ALLOWED_CHARS}]{4}-[${ALLOWED_CHARS}]{4}$`)

export type PromotionalCodePresenter = ReturnType<typeof usePromotionalCodePresenter>

export function usePromotionalCodePresenter() {
  const [promotionalCodeValid, setPromotionalCodeValid] = useState<boolean | null>(null)
  const [promotionalCodeLoading, setPromotionalCodeLoading] = useState<boolean>(false)
  const [promotionalCodeData, setPromotionalCodeData] = useState<{
    discountPercentage?: number
    discountType?: 'percentage' | 'fixed'
    discountAmount?: number
  } | null>(null)

  // Validation du format du code promotionnel
  const validatePromotionalCodeFormat = (code: string): boolean => {
    if (!code || code.length !== 9) return false
    return PROMOTIONAL_CODE_REGEX.test(code)
  }

  // Logique de gestion du code promotionnel
  const handlePromotionalCodeChange = (value: string, setValue: (value: string) => void) => {
    // Convertir en majuscules
    const upperValue = value.toUpperCase()

    // Filtrer uniquement les caractères autorisés et les tirets
    const filteredValue = upperValue
      .split('')
      .filter((char) => ALLOWED_CHARS.includes(char) || char === '-')
      .join('')

    // Gérer le formatage avec tiret
    let formattedValue = filteredValue

    // Si l'utilisateur a saisi plus de 4 caractères sans tiret, en ajouter un
    const charsWithoutDash = filteredValue.replace(/-/g, '')
    if (charsWithoutDash.length > 4 && !filteredValue.includes('-')) {
      formattedValue = `${charsWithoutDash.slice(0, 4)}-${charsWithoutDash.slice(4)}`
    }

    // Limiter la longueur totale à 9 caractères (8 + 1 tiret)
    formattedValue = formattedValue.slice(0, 9)

    setValue(formattedValue)

    // Réinitialiser l'état de validation si le code n'est pas complet
    const cleanCode = formattedValue.replace(/-/g, '')
    if (cleanCode.length !== 8) {
      setPromotionalCodeValid(null)
      setPromotionalCodeLoading(false)
    }
  }

  // Logique de statut du code promotionnel
  const getPromotionalCodeStatus = (): 'loading' | 'valid' | 'invalid' | 'neutral' => {
    if (promotionalCodeLoading) return 'loading'
    if (promotionalCodeValid === true) return 'valid'
    if (promotionalCodeValid === false) return 'invalid'
    return 'neutral'
  }

  const getPromotionalCodeMessage = (): string => {
    const status = getPromotionalCodeStatus()
    switch (status) {
      case 'valid':
        if (promotionalCodeData?.discountPercentage && promotionalCodeData?.discountType) {
          if (promotionalCodeData.discountType === 'percentage') {
            return `🎉 Code valide ! Vous bénéficiez de -${promotionalCodeData.discountPercentage}% sur votre commande`
          } else {
            // Pour les remises fixes, afficher le montant en euros
            const discountInEuros = (promotionalCodeData.discountAmount ?? 0) / 100
            return `🎉 Code valide ! Vous bénéficiez de -${discountInEuros}€ sur votre commande`
          }
        }
        return "🎉 Code valide ! Vous bénéficiez d'une réduction sur votre commande"
      case 'invalid':
        return '❌ Code invalide. Vérifiez votre code promotionnel'
      case 'loading':
        return '⏳ Vérification du code...'
      default:
        return ''
    }
  }

  // Mutation pour valider le code promotionnel
  const validatePromotionalCodeMutation = trpc.payment.validatePromotionalCode.useMutation({
    onSuccess: (data: {
      isValid: boolean
      discountPercentage?: number
      discountType?: 'percentage' | 'fixed'
      discountAmount?: number
    }) => {
      setPromotionalCodeValid(data.isValid)
      setPromotionalCodeLoading(false)

      // Stocker les données du code promotionnel si valide
      if (data.isValid) {
        setPromotionalCodeData({
          discountPercentage: data.discountPercentage,
          discountType: data.discountType,
          discountAmount: data.discountAmount,
        })
      } else {
        setPromotionalCodeData(null)
      }
    },
    onError: () => {
      setPromotionalCodeValid(false)
      setPromotionalCodeLoading(false)
      setPromotionalCodeData(null)
    },
  })

  // Fonction pour valider un code promotionnel
  const validatePromotionalCode = (code: string) => {
    const cleanCode = code.replace(/-/g, '')

    if (cleanCode.length === 8) {
      const isValidFormat = validatePromotionalCodeFormat(code)

      if (isValidFormat) {
        setPromotionalCodeLoading(true)
        validatePromotionalCodeMutation.mutate({ code })
      } else {
        setPromotionalCodeValid(false)
        setPromotionalCodeLoading(false)
      }
    } else {
      setPromotionalCodeValid(null)
      setPromotionalCodeLoading(false)
    }
  }

  return {
    // États
    promotionalCodeValid,
    promotionalCodeLoading,
    promotionalCodeData,

    // Setters
    setPromotionalCodeValid,
    setPromotionalCodeLoading,
    setPromotionalCodeData,

    // Méthodes
    handlePromotionalCodeChange,
    validatePromotionalCodeFormat,
    validatePromotionalCode,
    getPromotionalCodeStatus,
    getPromotionalCodeMessage,
  }
}
