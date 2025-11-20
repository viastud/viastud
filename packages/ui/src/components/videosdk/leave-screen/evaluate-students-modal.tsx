import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@viastud/ui/dialog'
import { saveStudentsEvaluationSchema } from '@viastud/utils'
import { StarIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { z } from 'zod'

import { Button } from '#components/ui/button'
import { trpc } from '#lib/trpc'

export type SaveStudentEvaluationSchema = z.infer<typeof saveStudentsEvaluationSchema>

const categories = [
  'courseMasteryRating',
  'fundamentalsMasteryRating',
  'focusRating',
  'disciplineRating',
] as const

const categoryLabels: Record<(typeof categories)[number], string> = {
  courseMasteryRating: 'Maîtrise du cours',
  fundamentalsMasteryRating: 'Maîtrise des fondamentaux',
  focusRating: 'Focus',
  disciplineRating: 'Discipline',
}

interface ModalProps {
  slotId: number
}
export const EvaluateStudentsModal = ({ slotId }: ModalProps) => {
  const { data: studentsWithName } = trpc.reservations.getSlotExpectedStudents.useQuery({
    slotId,
  })
  const [open, setOpen] = useState(true)

  const { reset, control, handleSubmit, formState } = useForm<SaveStudentEvaluationSchema>({
    resolver: zodResolver(saveStudentsEvaluationSchema),
    defaultValues: {
      students: [],
    },
  })

  useEffect(() => {
    if (studentsWithName) {
      reset({
        students: studentsWithName.map((studentWithName) => ({
          reservationId: studentWithName.reservationId,
          isStudentAbsent: false,
        })),
      })
    }
  }, [studentsWithName, reset, slotId])

  const { mutate: evaluateStudents } = trpc.rating.createStudentsEvaluationByProfessor.useMutation()

  const onSubmit = (data: SaveStudentEvaluationSchema) => {
    evaluateStudents(data)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[80vh] w-[1000px] max-w-[90%]">
        <DialogHeader>
          <DialogTitle className="max-w-[90%] text-xl font-bold text-gray-900">
            Évaluez les étudiants
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {studentsWithName?.map((student, index) => (
              <div
                key={student.reservationId}
                className="shadow-custom space-y-2 rounded-md border bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{studentsWithName[index].fullname}</span>
                  <Controller
                    name={`students.${index}.isStudentAbsent`}
                    control={control}
                    render={({ field }) => {
                      const { value, ...rest } = field
                      return (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={value}
                            {...rest}
                            className="form-checkbox"
                          />
                          Absent
                        </label>
                      )
                    }}
                  />
                </div>

                {categories.map((category) => (
                  <div key={category} className="flex items-center justify-between gap-4">
                    <span className="text-sm capitalize">{categoryLabels[category]}</span>
                    <Controller
                      name={`students.${index}.${category}`}
                      control={control}
                      render={({ field }) => (
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <StarIcon
                              key={value}
                              onClick={() => {
                                field.onChange(value)
                              }}
                              fill={field.value >= value ? '#ECB306' : 'none'}
                              color="#ECB306"
                              className="size-4 cursor-pointer"
                            />
                          ))}
                        </div>
                      )}
                    />
                  </div>
                ))}
                <div className="mt-2">
                  <Controller
                    name={`students.${index}.comment`}
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        placeholder="Commentaire sur la séance (obligatoire)"
                        className="w-full rounded border border-gray-300 p-2 text-sm"
                        rows={2}
                        maxLength={1000}
                        required
                      />
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
          <Button
            type="submit"
            variant={formState.isValid ? 'default' : 'secondary'}
            className="w-full px-4 py-2 font-bold"
            disabled={!formState.isValid}
          >
            Valider les notes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
