import type { TRPCClientErrorLike } from '@trpc/react-query'

interface ValidationError {
  validation: string
  message: string
  path?: string[]
}

export function formatTRPCError(
  error: TRPCClientErrorLike<{
    input: unknown
    output: unknown
    transformer: false
    errorShape: { zodError?: { fieldErrors?: Record<string, string[]> } } | { message: string }
  }>
): string {
  // Si c'est une erreur de validation Zod côté client
  if (error.message?.includes('validation')) {
    try {
      const errorData = JSON.parse(error.message) as ValidationError[]
      if (Array.isArray(errorData) && errorData.length > 0) {
        const firstError = errorData[0]
        if (firstError.validation && firstError.message) {
          return formatValidationMessage(firstError.message, firstError.path?.[0] ?? 'field')
        }
      }
    } catch {
      // Si le parsing échoue, on continue avec le message original
    }
  }

  // Si c'est une erreur de validation Zod côté serveur
  const errorData = error.data as
    | { zodError?: { fieldErrors?: Record<string, string[]> } }
    | undefined
  if (errorData?.zodError?.fieldErrors) {
    const fieldErrors = errorData.zodError.fieldErrors
    const errorMessages = Object.entries(fieldErrors)
      .map(([field, messages]) => {
        if (messages && messages.length > 0) {
          return formatValidationMessage(messages[0], field)
        }
        return null
      })
      .filter(Boolean)

    return errorMessages.join('\n')
  }

  // Si c'est une erreur avec un message personnalisé
  if (error.message) {
    return error.message
  }

  // Erreur par défaut
  return 'Une erreur est survenue. Veuillez réessayer.'
}

function getFieldDisplayName(field: string): string {
  const fieldMap: Record<string, string> = {
    email: 'Adresse email',
    phoneNumber: 'Numéro de téléphone',
    firstName: 'Prénom',
    lastName: 'Nom',
    password: 'Mot de passe',
    code: 'Code de vérification',
    message: 'Message',
    emailSubject: 'Sujet',
    streetNumber: 'Numéro de rue',
    street: 'Rue',
    postalCode: 'Code postal',
    city: 'Ville',
    country: 'Pays',
  }

  return fieldMap[field] || field
}

function formatValidationMessage(message: string, field: string): string {
  const fieldName = getFieldDisplayName(field)

  switch (message) {
    case 'Invalid email':
    case 'Invalid email format':
      return `${fieldName}: Format d'adresse email invalide`
    case 'Invalid string':
      return `${fieldName}: Format invalide`
    case 'Required':
    case 'This field is required':
      return `${fieldName}: Ce champ est requis`
    case 'Invalid phone number':
      return `${fieldName}: Format de numéro de téléphone invalide`
    case 'String must contain at least 1 character(s)':
      return `${fieldName}: Ce champ ne peut pas être vide`
    case 'String must contain at most 255 character(s)':
      return `${fieldName}: Ce champ est trop long (maximum 255 caractères)`
    default:
      return `${fieldName}: ${message}`
  }
}
