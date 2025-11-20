import { Button } from '@viastud/ui/button'
import { Checkbox } from '@viastud/ui/checkbox'
import { subject, SubjectEnum } from '@viastud/utils'

import { useOnBoardingStore } from '@/store/onboarding.store'

export function SelectGradeAndInterest() {
  const { updateOnBoardingState, interestedIn } = useOnBoardingStore()

  return (
    <>
      <h1 className="text-2xl font-semibold text-gray-950 sm:text-3xl">
        Remplissez les informations suivantes
      </h1>
      <div className="flex flex-col items-start gap-2 self-stretch">
        <p className="text-sm font-medium text-gray-700">
          Quelle(s) matière(s) souhaitez-vous étudier ?
        </p>
        <div className="grid grid-cols-1 gap-3 self-stretch sm:grid-cols-2 lg:grid-cols-3">
          {subject.map((subject) => (
            <div
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
              key={subject}
            >
              <Checkbox
                checked={interestedIn.includes(subject)}
                onClick={() => {
                  updateOnBoardingState({
                    interestedIn: interestedIn.includes(subject)
                      ? interestedIn.filter((s) => s !== subject)
                      : [...interestedIn, subject],
                  })
                }}
              />
              <p className="text-sm font-medium text-gray-700">{SubjectEnum[subject]}</p>
            </div>
          ))}
        </div>
      </div>
      <Button
        className="flex w-full rounded-full bg-gray-200"
        variant={interestedIn.length === 0 ? 'secondary' : 'default'}
        disabled={interestedIn.length === 0}
        onClick={() => {
          updateOnBoardingState({
            page: 5,
          })
        }}
      >
        Continuer
      </Button>
    </>
  )
}
