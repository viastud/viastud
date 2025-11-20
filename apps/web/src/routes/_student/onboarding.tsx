import { skipToken } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '@viastud/ui/button'
import { trpc } from '@viastud/ui/lib/trpc'
import { Progress } from '@viastud/ui/progress'
import { ContactModal } from '@viastud/ui/shared/contact-modal'
import { ArrowLeft } from 'lucide-react'

import { PhoneVerification } from '@/components/onboarding/phone-verification'
import { SelectGradeAndInterest } from '@/components/onboarding/select-grade-and-interests'
import { SelectModules } from '@/components/onboarding/select-modules'
import { SelectName } from '@/components/onboarding/select-name'
import { Welcome } from '@/components/onboarding/welcome'
import { useAuthStore } from '@/store/auth.store'
import { useOnBoardingStore } from '@/store/onboarding.store'

export const Route = createFileRoute('/_student/onboarding')({
  component: Onboarding,
})

const TOTAL_ONBOARDING_STEPS = 5

function Onboarding() {
  const { page, updateOnBoardingState } = useOnBoardingStore()
  const auth = useAuthStore()
  const navigate = useNavigate()
  // Redirect non-students away from student onboarding
  if (auth.role === 'PARENT') {
    void navigate({ to: '/parent' })
    return
  }
  const { data: onboardingData } = trpc.user.getUserDetails.useQuery(
    auth.user && auth.role === 'STUDENT'
      ? {
          id: auth.user.id,
        }
      : skipToken
  )
  if (onboardingData?.isFinished) {
    void navigate({ to: '/' })
  }

  return (
    <div className="flex size-full items-center justify-center p-4">
      <div className="flex w-full max-w-md shrink-0 flex-col items-start gap-6 rounded-2xl bg-white p-4 sm:gap-8 sm:p-6 md:max-w-lg">
        <div className="flex w-full items-center gap-2 self-stretch sm:gap-4">
          {page > 1 && (
            <Button
              variant="none"
              size="sm"
              className="flex-shrink-0"
              onClick={() => {
                updateOnBoardingState({ page: page - 1 })
              }}
            >
              <ArrowLeft className="size-5 sm:size-6" />
            </Button>
          )}
          <Progress
            progressBarClassName="bg-blue-200 rounded-full"
            value={((page - 1) / TOTAL_ONBOARDING_STEPS) * 100}
            className="flex-1"
          />
        </div>
        {page === 1 && (
          <Welcome
            continueOnboarding={() => {
              updateOnBoardingState({ page: 2 })
            }}
          />
        )}
        {page === 2 && (
          <PhoneVerification
            continueOnboarding={() => {
              updateOnBoardingState({ page: 3 })
            }}
          />
        )}
        {page === 3 && (
          <SelectName
            continueOnboarding={() => {
              updateOnBoardingState({ page: 4 })
            }}
          />
        )}
        {page === 4 && <SelectGradeAndInterest />}
        {page === 5 && <SelectModules />}
        <div className="flex w-full flex-col items-center gap-3 border-t pt-4 sm:flex-row sm:justify-between sm:gap-0">
          <p className="text-xs text-gray-500">Besoin d&apos;aide ?</p>
          <ContactModal
            firstName={auth.user?.firstName ?? ''}
            lastName={auth.user?.lastName ?? ''}
            email={auth.user?.email ?? ''}
          />
        </div>
      </div>
    </div>
  )
}
