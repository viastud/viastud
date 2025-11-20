import { Button } from '@viastud/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@viastud/ui/dialog'
import { formatTRPCError } from '@viastud/ui/lib/format-error'
import { trpc } from '@viastud/ui/lib/trpc'
import { PhoneInput } from '@viastud/ui/phone-input'
import type { UserRole } from '@viastud/utils'
import { useRef, useState } from 'react'

import type { UserDto } from './edit-profile'

interface PhoneVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newPhoneNumber: string) => void
  currentPhoneNumber?: string
  user?: UserDto
  role?: UserRole
  updateAuth?: (auth: { user: UserDto; role: UserRole; isAuthenticated: boolean }) => void
}

export function PhoneVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  currentPhoneNumber = '',
  user,
  role,
  updateAuth,
}: PhoneVerificationModalProps) {
  const [phoneNumber, setPhoneNumber] = useState<string>(currentPhoneNumber)
  const [verificationCode, setVerificationCode] = useState<string[]>(['', '', '', '', '', ''])
  const [isCodeSent, setIsCodeSent] = useState<boolean>(false)
  const [isVerifying, setIsVerifying] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const sendCodeMutation = trpc.user.sendPhoneVerificationCode.useMutation({
    onSuccess: () => {
      setIsCodeSent(true)
      setError('')
    },
    onError: (error) => {
      setError(formatTRPCError(error))
    },
  })

  const verifyCodeMutation = trpc.user.verifyPhoneCode.useMutation({
    onSuccess: () => {
      if (updateAuth && user && role) {
        updateAuth({ user: { ...user, phoneNumber }, role, isAuthenticated: true })
      }
      onSuccess(phoneNumber)
      handleClose()
    },
    onError: (error) => {
      setError(formatTRPCError(error))
    },
  })

  const handleSendCode = async () => {
    if (!phoneNumber) {
      setError('Veuillez saisir un numéro de téléphone')
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      await sendCodeMutation.mutateAsync({ phoneNumber })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleVerifyCode = async () => {
    const codeString = verificationCode.join('')

    if (codeString.length !== 6) {
      setError('Veuillez saisir le code de vérification complet')
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      await verifyCodeMutation.mutateAsync({
        phoneNumber,
        code: codeString,
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendCode = async () => {
    setIsCodeSent(false)
    setVerificationCode(['', '', '', '', '', ''])
    await handleSendCode()
  }

  const handleCodeChange = (index: number, value: string) => {
    // Saisie normale d'un seul caractère
    const newCode = [...verificationCode]
    newCode[index] = value
    setVerificationCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-verify when all 6 digits are entered (only after the last digit is entered)
    const isComplete = newCode.every((digit) => digit !== '') && newCode.join('').length === 6

    if (isComplete && index === 5) {
      setTimeout(() => {
        const codeString = newCode.join('')

        if (codeString.length === 6) {
          setIsVerifying(true)
          setError('')

          void verifyCodeMutation
            .mutateAsync({
              phoneNumber,
              code: codeString,
            })
            .finally(() => {
              setIsVerifying(false)
            })
        } else {
          setError('Veuillez saisir le code de vérification complet')
        }
      }, 300)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const cleanValue = pastedData.replace(/\D/g, '').slice(0, 6)

    if (cleanValue.length === 6) {
      const newCode = cleanValue.split('')
      setVerificationCode(newCode)

      // Auto-verify après un délai
      setTimeout(() => {
        setIsVerifying(true)
        setError('')

        void verifyCodeMutation
          .mutateAsync({
            phoneNumber,
            code: cleanValue,
          })
          .finally(() => {
            setIsVerifying(false)
          })
      }, 300)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleClose = () => {
    setPhoneNumber(currentPhoneNumber)
    setVerificationCode(['', '', '', '', '', ''])
    setIsCodeSent(false)
    setError('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-950">
            {isCodeSent ? 'Vérifiez votre numéro' : 'Changer de numéro de téléphone'}
          </DialogTitle>
          <p className="text-sm text-gray-600">
            {isCodeSent
              ? 'Entrez le code reçu par SMS pour valider votre nouveau numéro'
              : 'Entrez votre nouveau numéro de téléphone pour le vérifier'}
          </p>
        </DialogHeader>
        <div className="flex w-full flex-col gap-6">
          {!isCodeSent ? (
            <>
              <div className="flex w-full flex-col gap-1">
                <p className="text-sm font-medium text-gray-700">Nouveau numéro de téléphone</p>
                <PhoneInput
                  placeholder="Numéro de téléphone"
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Annuler
                </Button>
                <Button
                  className="flex-1"
                  variant={
                    !phoneNumber || isVerifying || phoneNumber === currentPhoneNumber
                      ? 'secondary'
                      : 'default'
                  }
                  disabled={!phoneNumber || isVerifying || phoneNumber === currentPhoneNumber}
                  onClick={handleSendCode}
                >
                  {isVerifying
                    ? 'Envoi en cours...'
                    : phoneNumber === currentPhoneNumber
                      ? 'Aucun changement'
                      : 'Envoyer le code'}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex w-full flex-col gap-4">
              <div className="flex w-full flex-col gap-1">
                <p className="text-sm font-medium text-gray-700">
                  Code de vérification envoyé au {phoneNumber}
                </p>
                <div className="flex items-center justify-center gap-2">
                  {verificationCode.map((digit, index) => (
                    <div key={index} className="flex items-center">
                      <input
                        ref={(el) => {
                          inputRefs.current[index] = el
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => {
                          handleCodeChange(index, e.target.value)
                        }}
                        onKeyDown={(e) => {
                          handleKeyDown(index, e)
                        }}
                        onPaste={handlePaste}
                        className="h-12 w-12 rounded-xl border-2 bg-white text-center text-lg font-bold tracking-widest text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        placeholder=""
                      />
                      {index < 5 && <span className="mx-1 text-xl font-bold text-gray-400">-</span>}
                    </div>
                  ))}
                </div>
              </div>

              {error && <p className="text-center text-sm text-red-500">{error}</p>}

              <div className="flex w-full gap-2">
                <Button
                  variant="outline"
                  onClick={handleResendCode}
                  disabled={isVerifying}
                  className="flex-1"
                >
                  Renvoyer
                </Button>
                <Button
                  className="flex-1"
                  variant={
                    verificationCode.join('').length !== 6 || isVerifying ? 'secondary' : 'default'
                  }
                  disabled={verificationCode.join('').length !== 6 || isVerifying}
                  onClick={handleVerifyCode}
                >
                  {isVerifying ? 'Vérification...' : 'Vérifier'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
