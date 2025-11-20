import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@viastud/ui/button'
import { Progress } from '@viastud/ui/progress'
import { ContactModal } from '@viastud/ui/shared/contact-modal'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'

import { AddChildren } from '@/components/onboarding/add-children'
import { SelectName } from '@/components/onboarding/select-name'
import { SelectPhoneNumber } from '@/components/onboarding/select-phone-number'
import { Welcome } from '@/components/onboarding/welcome'

export const Route = createFileRoute('/parent/onboarding')({
  component: Onboarding,
})

const TOTAL_ONBOARDING_STEPS = 4

function Onboarding() {
  const [page, setPage] = useState<number>(1)

  const continueOnboarding = () => {
    setPage(page + 1)
  }

  return (
    <div className="flex size-full items-center justify-center">
      <div className="flex shrink-0 flex-col items-start gap-8 rounded-2xl bg-white p-6">
        <div className="flex items-center gap-4 self-stretch">
          {page > 1 && (
            <Button
              variant="none"
              onClick={() => {
                setPage(page - 1)
              }}
            >
              <ArrowLeft className="size-6" />
            </Button>
          )}
          <Progress
            progressBarClassName="bg-blue-200 rounded-full"
            value={((page - 1) / TOTAL_ONBOARDING_STEPS) * 100}
          />
        </div>
        {page === 1 && <Welcome continueOnboarding={continueOnboarding} />}
        {page === 2 && <SelectPhoneNumber continueOnboarding={continueOnboarding} />}
        {page === 3 && <SelectName continueOnboarding={continueOnboarding} />}
        {page === 4 && <AddChildren />}
        <div className="flex w-full items-center justify-between border-t pt-4">
          <p className="text-xs text-gray-500">Besoin d&apos;aide ?</p>
          <ContactModal firstName="" lastName="" email="" />
        </div>
      </div>
    </div>
  )
}
