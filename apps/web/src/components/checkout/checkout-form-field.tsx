import { useMemo } from 'react'
import type { Control } from 'react-hook-form'

import type { useFreeRegistrationPresenter } from '@/presenters/free-registration-presenter'
import type { CheckoutFormData } from '@/presenters/validation/checkout.schema'

import { EmailField } from './email-field'
import { FirstNameField } from './firstname-field'
import { GradeField } from './grade-field'
import { LastNameField } from './lastname-field'
import { NumberOfChildrenField } from './number-of-children'
import { ParcoursupWishesField } from './parcoursup-wishes-field'
import { RoleField } from './role-field'

interface CheckoutFormFieldsProps {
  control: Control<CheckoutFormData>
  presenter: ReturnType<typeof useFreeRegistrationPresenter>
  role: string
}

export function CheckoutFormFields({ control, presenter, role }: CheckoutFormFieldsProps) {
  const grade = presenter.checkoutForm.watch('grade')
  const isTerminale = useMemo(() => role === 'STUDENT' && grade === 'TERMINALE', [role, grade])

  return (
    <>
      <FirstNameField control={control} />
      <LastNameField control={control} />
      <EmailField control={control} presenter={presenter} />
      <RoleField control={control} presenter={presenter} />
      {role === 'STUDENT' && <GradeField control={control} />}
      {isTerminale && <ParcoursupWishesField control={control} />}
      {role === 'PARENT' && <NumberOfChildrenField control={control} />}
    </>
  )
}
