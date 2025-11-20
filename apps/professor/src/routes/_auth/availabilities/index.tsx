import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@viastud/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@viastud/ui/dropdown-menu'
import { useToast } from '@viastud/ui/hooks/use-toast'
import {
  daysOfWeek,
  formattedWeekOptions,
  isSlotAllowed,
  timeSlots,
} from '@viastud/ui/lib/availabilities.utils'
import { dateService } from '@viastud/ui/lib/date-service'
import { trpc } from '@viastud/ui/lib/trpc'
import AvailabilityTable from '@viastud/ui/shared/availability-table'
import { GenericModal } from '@viastud/ui/shared/generic-modal'
import { availabilityStatus } from '@viastud/utils'
import { ChevronDown, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, type SubmitHandler, useForm } from 'react-hook-form'
import { z } from 'zod'

export const Route = createFileRoute('/_auth/availabilities/')({
  component: Availabilities,
})

const availabilitySchemaWithStatus = z.object({
  dayOfWeek: z.number().min(0).max(6),
  hour: z.number().min(9).max(21),
  minute: z.union([z.literal(0), z.literal(30)]),
  slotId: z.number().nullable(),
  status: z.enum(availabilityStatus),
  weekStart: z.string().refine((date) => !Number.isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
})

const availabilitiesSchemaWithStatuses = z.object({
  availabilities: z.array(availabilitySchemaWithStatus),
})

type AvailabilityForm = z.infer<typeof availabilitiesSchemaWithStatuses>

interface PresenterAvailability {
  dayOfWeek: number
  hour: number
  minute: number
  weekStart?: string
  slotId: number | null
  status: 'UNAVAILABLE' | 'AVAILABLE' | 'SELECTED'
}

function Availabilities() {
  const { toast, handleError } = useToast()
  const [selectedWeek, setSelectedWeek] = useState(dateService.getStartOfWeek())
  const [isEditable, setIsEditable] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingWeek, setPendingWeek] = useState<string | null>(null)

  const {
    data: professorAvailabilities,
    isLoading,
    refetch,
  } = trpc.professorAvailabilities.getWeeklyProfessorAvailabilities.useQuery({
    weekStart: dateService.format(selectedWeek, 'YYYY-MM-DD'),
  })

  const saveAvailabilitiesMutation =
    trpc.professorAvailabilities.saveProfessorAvailabilities.useMutation({
      onSuccess: () => {
        void refetch()
        toast({
          title: 'Disponibilités enregistrées avec succès.',
        })
      },
      onError: (error) => {
        handleError(error)
      },
    })

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, errors },
  } = useForm<AvailabilityForm>({
    resolver: zodResolver(availabilitiesSchemaWithStatuses),
    defaultValues: {
      availabilities: [],
    },
  })

  useEffect(() => {
    if (professorAvailabilities) {
      const mappedAvailabilities: AvailabilityForm['availabilities'] = professorAvailabilities
        .filter((avail) => isSlotAllowed(avail.dayOfWeek, avail.hour, true))
        .map((avail) => ({
          weekStart: dateService.format(selectedWeek, 'YYYY-MM-DD'),
          dayOfWeek: avail.dayOfWeek,
          hour: avail.hour,
          minute: ((avail as unknown as { minute?: number }).minute ?? 0) as 0 | 30,
          slotId: avail.slotId ?? null,
          status: 'SELECTED',
        }))

      reset({ availabilities: mappedAvailabilities })
    } else {
      reset({
        availabilities: [],
      })
    }
  }, [professorAvailabilities, reset, selectedWeek])

  const onSubmit: SubmitHandler<AvailabilityForm> = (data) => {
    const availabilitiesToSave: z.infer<typeof availabilitySchemaWithStatus>[] =
      data.availabilities.filter((availabilty) => availabilty.status === 'SELECTED')

    saveAvailabilitiesMutation.mutate({
      weekStart: dateService.format(selectedWeek, 'YYYY-MM-DD'),
      availabilities: availabilitiesToSave,
    })
  }

  const toggleEditMode = () => {
    setIsEditable((prev) => !prev)
  }

  const handleWeekChange = (newWeek: string) => {
    if (isDirty) {
      setPendingWeek(newWeek)
      setShowConfirmModal(true)
    } else {
      setSelectedWeek(new Date(newWeek))
    }
  }

  const onCancel = () => {
    setShowConfirmModal(false)
  }

  const onConfirm = () => {
    void handleSubmit(onSubmit)().then(() => {
      setShowConfirmModal(false)
      if (pendingWeek) {
        setSelectedWeek(new Date(pendingWeek))
        setPendingWeek(null)
      }
    })
  }

  return (
    <div className="w-[80%] p-4">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-8 flex flex-col items-start gap-4 md:flex-row">
          <div className="flex-1">
            <h1 className="mb-4 text-xl font-bold">Indiquez vos disponibilités</h1>
            <p className="mb-2 text-gray-700">
              Sélectionnez plusieurs créneaux selon vos disponibilités. Vous devez prévoir vos cours
              sur une semaine.
            </p>
            <p className="text-gray-700">
              Ceux-ci seront applicables tout le mois. Vous pouvez sélectionner également sur
              quelles semaines appliquer cet emploi du temps.
            </p>
          </div>
          <div className="flex flex-1 flex-col justify-end gap-2 md:flex-row md:items-center">
            <Button type="button" onClick={toggleEditMode}>
              {isEditable ? 'Visualiser' : 'Modifier'}
            </Button>
            {isEditable && (
              <Button type="submit" disabled={saveAvailabilitiesMutation.isPending || !isDirty}>
                {saveAvailabilitiesMutation.isPending ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  'Valider mes disponibilités'
                )}
              </Button>
            )}
          </div>
        </div>
        <h1 className="mb-4 text-xl font-bold">Semaines applicables</h1>

        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center">
          <label htmlFor="week-select" className="mr-2 text-gray-700">
            Indiquez les semaines disponibles ce mois-ci.
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex grow rounded-3xl">
                <p className="text-sm font-semibold text-blue-800">
                  {`Semaine du ${dateService.format(selectedWeek)}`}
                </p>
                <ChevronDown className="ml-2 h-4 w-4" color="#4C6CFF" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="">
              {formattedWeekOptions.map((week) => (
                <DropdownMenuItem
                  key={`week_${week.value}`}
                  onClick={() => {
                    handleWeekChange(week.value)
                  }}
                >
                  <p className="text-sm text-blue-800">{week.label}</p>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isLoading ? (
          <LoaderCircle className="my-auto h-8 w-8 animate-spin" />
        ) : (
          <Controller
            name="availabilities"
            control={control}
            render={({ field }) => (
              <>
                <AvailabilityTable
                  weekStart={dateService.toISOString(selectedWeek)}
                  daysOfWeek={daysOfWeek}
                  timeSlots={timeSlots}
                  defaultStatus="AVAILABLE"
                  availabilities={field.value}
                  isEditable={isEditable}
                  isForProfessor={true}
                  onSelect={(availability: PresenterAvailability) => {
                    if (!isEditable) return

                    const exists = field.value.find((currentAvailability) => {
                      const minutes = (availability.minute ?? 0) as 0 | 30
                      return (
                        currentAvailability.dayOfWeek === availability.dayOfWeek &&
                        currentAvailability.hour === availability.hour &&
                        currentAvailability.minute === minutes
                      )
                    })

                    if (exists) {
                      // Si le créneau existe déjà, on le retire de la liste
                      field.onChange(
                        field.value.filter(
                          (currentAvailability) =>
                            !(
                              currentAvailability.dayOfWeek === availability.dayOfWeek &&
                              currentAvailability.hour === availability.hour &&
                              currentAvailability.minute === availability.minute
                            )
                        )
                      )
                    } else {
                      // Si le créneau n'existe pas, on l'ajoute avec le statut SELECTED
                      field.onChange([
                        ...field.value,
                        {
                          weekStart: availability.weekStart,
                          dayOfWeek: availability.dayOfWeek,
                          hour: availability.hour,
                          minute: (availability.minute ?? 0) as 0 | 30,
                          slotId: availability.slotId,
                          status: 'SELECTED',
                        },
                      ])
                    }
                  }}
                />
                {errors.availabilities && (
                  <p className="mt-2 text-sm text-red-500">{errors.availabilities.message}</p>
                )}
              </>
            )}
          />
        )}
      </form>

      <GenericModal
        title="Confirmer le changement de semaine"
        description="Vous avez des modifications non enregistrées. Voulez-vous les enregistrer avant de changer de semaine ?"
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </div>
  )
}

export default Availabilities
