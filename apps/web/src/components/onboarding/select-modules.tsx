import { skipToken } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@viastud/ui/button'
import { Checkbox } from '@viastud/ui/checkbox'
import { trpc } from '@viastud/ui/lib/trpc'
import { subject, SubjectEmoji, SubjectEnum, userDetailsSchema } from '@viastud/utils'

import { useAuthStore } from '@/store/auth.store'
import { useOnBoardingStore } from '@/store/onboarding.store'

export function SelectModules() {
  const modules = trpc.module.getAll.useQuery()
  const { updateOnBoardingState, doneModules, doingModules, interestedIn, grade } =
    useOnBoardingStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  if (!user?.phoneNumber) {
    return
  }

  const { mutateAsync: updateOnboardingMutation } = trpc.user.updateUserDetails.useMutation({
    onSuccess: () => {
      void navigate({ to: '/', from: '/onboarding' })
    },
  })

  const { data: userDetails } = trpc.user.getUserDetails.useQuery(
    user ? { id: user.id } : skipToken
  )
  const selectedGrade = grade ?? userDetails?.grade

  const handleSubmit = async () => {
    await updateOnboardingMutation(
      userDetailsSchema.parse({
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        interestedIn,
        doneModules,
        doingModules,
      })
    )
  }

  const toggleChapter = (
    subjectParam: (typeof subject)[number],
    chapterId: number,
    options?: { done?: boolean }
  ) => {
    const chapterModules = (modules.data ?? [])
      .filter(
        (m) =>
          m.subject === subjectParam &&
          m.chapter.id === chapterId &&
          (selectedGrade ? m.grade === selectedGrade : true)
      )
      .map((m) => m.id)

    if (options?.done) {
      const allDone =
        chapterModules.length > 0 && chapterModules.every((id) => doneModules.includes(id))
      const nextDone = new Set(doneModules)
      for (const id of chapterModules) {
        if (allDone) {
          nextDone.delete(id)
        } else {
          nextDone.add(id)
        }
      }
      updateOnBoardingState({ doneModules: Array.from(nextDone) })
    } else {
      const allDoing =
        chapterModules.length > 0 && chapterModules.every((id) => doingModules.includes(id))
      const nextDoing = new Set(doingModules)
      for (const id of chapterModules) {
        if (allDoing) {
          nextDoing.delete(id)
        } else {
          nextDoing.add(id)
        }
      }
      updateOnBoardingState({ doingModules: Array.from(nextDoing) })
    }
  }

  const hasSelection = doneModules.length > 0 || doingModules.length > 0

  return (
    <>
      <div className="flex flex-col items-start gap-2 self-stretch">
        <h1 className="text-2xl font-semibold text-gray-950 sm:text-3xl">
          Remplissez les informations suivantes
        </h1>
        <p className="text-gray-700">
          Sélectionnez les chapitres déjà traités et actuellement traités en classe par module dans
          chaque matière.
        </p>
      </div>
      <div className="flex max-h-[60vh] flex-col items-start self-stretch overflow-auto sm:max-h-[65vh]">
        {subject.map(
          (subject) =>
            interestedIn.includes(subject) && (
              <div key={subject} className="flex w-full flex-col gap-4">
                <p className="text-lg font-bold text-gray-950">
                  {SubjectEmoji[subject]} {SubjectEnum[subject]}
                </p>
                <div className="flex flex-col gap-6 sm:flex-row sm:gap-4">
                  {(() => {
                    const subjectModules =
                      modules.data?.filter(
                        (m) =>
                          m.subject === subject &&
                          (selectedGrade ? m.grade === selectedGrade : true)
                      ) ?? []
                    const uniqueChapterMap = new Map<number, { name: string; order: number }>()
                    for (const m of subjectModules) {
                      const id = m.chapter.id
                      if (!uniqueChapterMap.has(id)) {
                        uniqueChapterMap.set(id, {
                          name: m.chapter.name,
                          order: (m.chapter as { order?: number }).order ?? 0,
                        })
                      }
                    }
                    const chapters = Array.from(uniqueChapterMap.entries())
                      .map(([chapterId, info]) => ({
                        chapterId,
                        chapterName: info.name,
                        order: info.order,
                      }))
                      .sort((a, b) => a.order - b.order)
                    return (
                      <>
                        <div className="flex flex-1 flex-col">
                          <div className="flex flex-col gap-4">
                            <p className="font-semibold text-gray-950">
                              Groupes de chapitres déjà traités en classe
                            </p>
                            <div className="flex flex-col gap-4 rounded-2xl">
                              {chapters.map(({ chapterId, chapterName }) => {
                                const chapterIds = subjectModules
                                  .filter((m) => m.chapter.id === chapterId)
                                  .map((m) => m.id)
                                const isChecked =
                                  chapterIds.length > 0 &&
                                  chapterIds.every((id) => doneModules.includes(id))
                                return (
                                  <div
                                    key={chapterId}
                                    className="flex cursor-pointer items-center justify-start gap-2 rounded-2xl bg-blue-50 p-4 transition-colors duration-300 hover:bg-blue-100"
                                    onClick={() => {
                                      toggleChapter(subject, chapterId, { done: true })
                                    }}
                                  >
                                    <Checkbox checked={isChecked} />
                                    <p className="text-sm font-medium text-gray-700">
                                      {chapterName}
                                    </p>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col">
                          <div className="flex flex-col gap-4">
                            <p className="font-semibold text-gray-950">
                              Chapitres étudiés actuellement
                            </p>
                            <div className="flex flex-col gap-4 rounded-2xl">
                              {chapters.map(({ chapterId, chapterName }) => {
                                const chapterIds = subjectModules
                                  .filter((m) => m.chapter.id === chapterId)
                                  .map((m) => m.id)
                                const isChecked =
                                  chapterIds.length > 0 &&
                                  chapterIds.every((id) => doingModules.includes(id))
                                return (
                                  <div
                                    key={chapterId}
                                    className="flex cursor-pointer items-center justify-start gap-2 rounded-2xl bg-blue-50 p-4 transition-colors duration-300 hover:bg-blue-100"
                                    onClick={() => {
                                      toggleChapter(subject, chapterId)
                                    }}
                                  >
                                    <Checkbox checked={isChecked} />
                                    <p className="text-sm font-medium text-gray-700">
                                      {chapterName}
                                    </p>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            )
        )}
      </div>
      <Button
        className="w-full rounded-full sm:ml-auto sm:w-auto"
        onClick={handleSubmit}
        disabled={!hasSelection}
      >
        Améliorez votre niveau dès maintenant
      </Button>
    </>
  )
}
