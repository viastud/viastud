import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Link, linkOptions } from '@tanstack/react-router'
import { Button } from '@viastud/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@viastud/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@viastud/ui/dropdown-menu'
import { trpc } from '@viastud/ui/lib/trpc'
import { UserIcon } from '@viastud/ui/shared/user-icon'
import { Crown, HelpCircle, Rocket, User, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import PaymentForm from '@/components/payment-form'
import { useAuthStore } from '@/store/auth.store'

const tabs = [
  linkOptions({
    to: '/',
    label: 'Tableau de bord',
    activeOptions: { exact: true },
  }),
  linkOptions({
    to: '/ressources',
    label: 'Ressources',
  }),
]

export default function StudentHeader() {
  const auth = useAuthStore()
  const [isLearningModalOpen, setIsLearningModalOpen] = useState(false)
  const [learningMessage, setLearningMessage] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const createLessonPackPaymentIntent = trpc.payment.createLessonPackPaymentIntent.useMutation()
  const stripePublicApiKey: string = import.meta.env.VITE_STRIPE_PUBLIC_API_KEY
  const stripePromise = loadStripe(stripePublicApiKey)
  const { data: subscription, isLoading: subscriptionLoading } =
    trpc.user.getStudentSubscriptionDetails.useQuery()

  useEffect(() => {
    const handleOpenLearningModal = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>
      setLearningMessage(customEvent.detail?.message ?? null)
      setIsLearningModalOpen(true)
    }

    window.addEventListener('open-learning-modal', handleOpenLearningModal as EventListener)
    return () => {
      window.removeEventListener('open-learning-modal', handleOpenLearningModal as EventListener)
    }
  }, [])

  return (
    <div className="flex w-full justify-center p-4">
      <div className="h-70px shadow-custom flex w-5/6 items-center overflow-auto rounded-[68px] bg-white px-8 py-2">
        <div className="flex grow items-center justify-between overflow-auto">
          <div className="flex shrink-0 items-center gap-4">
            <Link to="/">
              <img
                src="/logos/viastud-text-logo.png"
                alt="viastud logo"
                className="mb-px h-5 w-auto md:h-9"
              />
            </Link>
            {tabs.map((option) => (
              <Link
                className="flex items-center px-4 py-2"
                key={option.to}
                id={`btn-student-header-${option.label}`}
                {...option}
                activeProps={{
                  className: 'text-blue-600 border-b-2 border-b-blue-600',
                }}
              >
                {option.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {subscriptionLoading ? (
              <div className="h-9 w-[250px] animate-pulse rounded-full bg-gray-100" />
            ) : subscription?.status === 'ACTIVE' ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300 bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 px-3 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-yellow-200/60">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/30 shadow-inner">
                  <Crown className="h-3.5 w-3.5 text-yellow-900" />
                </span>
                <span className="tracking-wide">Premium</span>
              </div>
            ) : (
              <Button
                variant="default"
                onClick={() => {
                  setIsLearningModalOpen(true)
                }}
              >
                Envie de progresser davantage ?
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="none" asChild>
                  <div className="cursor-pointer">
                    <UserIcon firstName={auth.user?.firstName} lastName={auth.user?.lastName} />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem className="flex flex-col items-stretch focus:bg-blue-50">
                  <Link className="flex items-center gap-2" to="/profile">
                    <User className="size-4" />
                    <p className="text-sm font-medium text-gray-950">Profil</p>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex flex-col items-stretch focus:bg-blue-50">
                  <Link className="flex items-center gap-2" to="/settings">
                    <img className="size-4" src="/icons/settings.svg" alt="settings" />
                    <p className="text-sm font-medium text-gray-950">Paramètres</p>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex flex-col items-stretch focus:bg-blue-50">
                  <Link className="flex items-center gap-2" to="/support">
                    <HelpCircle className="size-4" />
                    <p className="text-sm font-medium text-gray-950">Support / Aide</p>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    auth.updateAuth({
                      user: undefined,
                      role: null,
                      isAuthenticated: false,
                    })
                  }}
                  className="gap-2 focus:bg-blue-50"
                >
                  <img className="size-4" src="/icons/logout.svg" alt="logout" />
                  <p className="text-sm font-medium text-gray-950">Se déconnecter</p>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Modal d'apprentissage */}
      <Dialog open={isLearningModalOpen} onOpenChange={setIsLearningModalOpen}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="relative p-6 pb-4">
            <DialogTitle className="text-center text-2xl font-bold text-blue-600">
              Boostez votre apprentissage !
            </DialogTitle>
            {learningMessage ? (
              <p className="mt-2 text-center text-sm text-red-600">{learningMessage}</p>
            ) : null}
            <Button
              variant="none"
              size="icon"
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
              onClick={() => {
                setIsLearningModalOpen(false)
                setLearningMessage(null)
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogHeader>

          <div className="px-6 pb-6">
            {/* Packs de cours particuliers */}
            <div className="mb-8">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Packs de cours particuliers
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="rounded-lg border-2 border-blue-600 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                  <div className="mb-2 text-center">
                    <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-semibold text-gray-900">
                      Offre unique
                    </span>
                  </div>
                  <h4 className="mb-2 text-center font-semibold text-gray-900">Pack 3 cours</h4>
                  <p className="mb-3 text-center text-sm text-gray-600">3 cours particuliers</p>
                  <p className="mb-4 text-center text-2xl font-bold text-gray-900">30,00€</p>
                  {clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <PaymentForm returnUrl={window.location.href} />
                    </Elements>
                  ) : (
                    <Button
                      className="w-full rounded-md bg-blue-600 font-semibold text-white hover:bg-blue-700"
                      onClick={async () => {
                        const res = await createLessonPackPaymentIntent.mutateAsync()
                        setClientSecret(res.clientSecret)
                      }}
                    >
                      Acheter
                    </Button>
                  )}
                </div>
              </div>

              {/* Séparateur */}
              <div className="mt-6 text-center">
                <div className="flex items-center justify-center">
                  <div className="h-px flex-1 bg-gray-300"></div>
                  <span className="px-4 text-sm text-gray-500">ou</span>
                  <div className="h-px flex-1 bg-gray-300"></div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-6">
              <div className="mb-4 flex items-center justify-center">
                <Crown className="mr-2 h-6 w-6 text-yellow-500" />
                <div className="flex items-center">
                  <Rocket className="mr-2 h-4 w-4 text-pink-500" />
                  <h3 className="text-lg font-semibold text-purple-700">
                    Passez au niveau supérieur !
                  </h3>
                </div>
              </div>
              <p className="mb-6 text-center text-gray-700">
                Accès illimité à tous nos cours et accompagnements personnalisés
              </p>
              <Link
                to="/settings"
                search={{ tab: 'SUBSCRIPTION' }}
                onClick={() => {
                  setIsLearningModalOpen(false)
                }}
              >
                <Button className="w-full rounded-md bg-gradient-to-r from-purple-600 to-pink-600 py-3 font-semibold text-white hover:from-purple-700 hover:to-pink-700">
                  Découvrir l&apos;abonnement Premium
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
