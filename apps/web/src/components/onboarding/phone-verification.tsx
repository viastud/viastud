import { Button } from '@viastud/ui/button'
import { trpc } from '@viastud/ui/lib/trpc'
import { PhoneInput } from '@viastud/ui/phone-input'
import { useRef, useState } from 'react'
import { useShallow } from 'zustand/shallow'

import { useAuthStore } from '@/store/auth.store'

interface PhoneVerificationProps {
  continueOnboarding: () => void
}

export function PhoneVerification({ continueOnboarding }: PhoneVerificationProps) {
  const { user, role, updateAuth } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      role: state.role,
      updateAuth: state.updateAuth,
    }))
  )

  const [phoneNumber, setPhoneNumber] = useState<string>(user?.phoneNumber ?? '')
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
      setError(error.message || "Erreur lors de l'envoi du code")
    },
  })

  const verifyCodeMutation = trpc.user.verifyPhoneCode.useMutation({
    onSuccess: () => {
      if (user && role) {
        updateAuth({ user: { ...user, phoneNumber: phoneNumber }, role, isAuthenticated: true })
      }
      continueOnboarding()
    },
    onError: (error) => {
      setError(error.message || 'Code de vérification incorrect')
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
    if (value.length > 1) {
      value = value.slice(-1)
    }

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

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  if (!user || !role) {
    return null
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-gray-950 sm:text-3xl">
        {isCodeSent ? 'Vérifiez votre numéro' : 'Entrez votre numéro de téléphone'}
      </h1>

      {!isCodeSent ? (
        <>
          <div className="flex w-full flex-col gap-1">
            <p className="text-sm font-medium text-gray-700">Numéro de téléphone</p>
            <PhoneInput
              placeholder="Numéro de téléphone"
              value={phoneNumber}
              onChange={setPhoneNumber}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            className="flex w-full rounded-full bg-gray-200"
            variant={!phoneNumber || isVerifying ? 'secondary' : 'default'}
            disabled={!phoneNumber || isVerifying}
            onClick={handleSendCode}
          >
            {isVerifying ? 'Envoi en cours...' : 'Envoyer le code'}
          </Button>
        </>
      ) : (
        <div className="flex w-full flex-col gap-4">
          <div className="flex w-full flex-col gap-1">
            <p className="text-sm font-medium text-gray-700">
              Code de vérification envoyé au {phoneNumber}
            </p>
            <div className="flex items-center justify-center gap-2 sm:gap-3">
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
                    className="h-12 w-10 rounded-lg border-2 bg-white text-center text-lg font-bold tracking-widest text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:h-14 sm:w-14 sm:text-xl"
                    placeholder=""
                  />
                  {index < 5 && (
                    <span className="mx-1 text-lg font-bold text-gray-400 sm:mx-2 sm:text-2xl">
                      -
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-center text-sm text-red-500">{error}</p>}

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:gap-2">
            <Button
              className="flex-1 rounded-full bg-gray-200"
              variant="outline"
              onClick={handleResendCode}
              disabled={isVerifying}
            >
              Renvoyer
            </Button>
            <Button
              className="flex-1 rounded-full bg-gray-200"
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
    </>
  )
}
