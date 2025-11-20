import type { useFreeRegistrationPresenter } from '@/presenters/free-registration-presenter'

import { FreeRegistrationOption } from './free-registration-option'

interface FreeRegistrationOptionBlockProps {
  presenter: ReturnType<typeof useFreeRegistrationPresenter>
}

export function FreeRegistrationOptionBlock({ presenter }: FreeRegistrationOptionBlockProps) {
  const { freeRegistrationError } = presenter

  return (
    <>
      {freeRegistrationError && <p className="text-center text-red-500">{freeRegistrationError}</p>}
      <FreeRegistrationOption />
    </>
  )
}
