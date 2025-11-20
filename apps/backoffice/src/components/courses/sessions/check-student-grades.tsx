import type { Participant } from '@viastud/server/routers/reservation_router'
import { Button } from '@viastud/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@viastud/ui/dialog'
import { Eye, StarIcon, X } from 'lucide-react'
import { useState } from 'react'

export function CheckStudentGrades({
  participants,
  date,
}: {
  participants: Participant[]
  date: string
}) {
  const [open, setOpen] = useState<boolean>(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="none" size="icon">
          <Eye className="size-4" color="#3347FF" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-w-5xl flex-col gap-8">
        <DialogHeader className="flex flex-row items-end justify-between">
          <DialogTitle className="text-xl font-bold text-gray-950">Cours du {date}.</DialogTitle>
          <DialogClose asChild>
            <Button variant="none" className="m-0 h-6 w-6 justify-start p-0">
              <X className="h-6 w-6" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="grid grid-cols-[repeat(2,minmax(260px,1fr))] gap-x-4 gap-y-4 pb-6 xl:gap-y-4 xl:pt-8">
          {participants.map(
            ({ studentGrades, ...participant }) =>
              studentGrades && (
                <div
                  key={`${participant.name}_${date}`}
                  className="flex flex-col gap-8 rounded-2xl bg-blue-50 p-6"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-semibold text-blue-600">{participant.name}</p>
                    <div className="flex items-center gap-2">
                      <StarIcon color="#ECB306" fill="#ECB306" className="flex size-6 shrink-0" />
                      <p className="text-xl font-medium text-gray-900">{`${studentGrades.isAbsent ? '-' : participant.professorGrade}/5`}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className="text-gray-700">Maîtrise du cours</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <div key={`${participant.name}_${date}_star_${value}`}>
                            {studentGrades.courseMasteryRating >= value ? (
                              <StarIcon
                                color="#ECB306"
                                fill="#ECB306"
                                className="flex size-6 shrink-0"
                              />
                            ) : (
                              <StarIcon color="#ECB306" className="flex size-6 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-700">Maîtrise des fondamentaux</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <div key={`${participant.name}_${date}_star_${value}`}>
                            {studentGrades.fundamentalsMasteryRating >= value ? (
                              <StarIcon
                                color="#ECB306"
                                fill="#ECB306"
                                className="flex size-6 shrink-0"
                              />
                            ) : (
                              <StarIcon color="#ECB306" className="flex size-6 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-700">Focus</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <div key={`${participant.name}_${date}_star_${value}`}>
                            {studentGrades.focusRating >= value ? (
                              <StarIcon
                                color="#ECB306"
                                fill="#ECB306"
                                className="flex size-6 shrink-0"
                              />
                            ) : (
                              <StarIcon color="#ECB306" className="flex size-6 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-700">Discipline</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <div key={`${participant.name}_${date}_star_${value}`}>
                            {studentGrades.disciplineRating >= value ? (
                              <StarIcon
                                color="#ECB306"
                                fill="#ECB306"
                                className="flex size-6 shrink-0"
                              />
                            ) : (
                              <StarIcon color="#ECB306" className="flex size-6 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
