import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '@viastud/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@viastud/ui/dropdown-menu'
import { useToast } from '@viastud/ui/hooks/use-toast'
import { daysOfWeek, formattedWeekOptions, timeSlots } from '@viastud/ui/lib/availabilities.utils'
import { dateService } from '@viastud/ui/lib/date-service'
import { formatHourRangeWithTimezone } from '@viastud/ui/lib/timezone-utils'
import { trpc } from '@viastud/ui/lib/trpc'
import { cn } from '@viastud/ui/lib/utils'
import AvailabilityTable from '@viastud/ui/shared/availability-table'
import { GenericModal } from '@viastud/ui/shared/generic-modal'
import { availabilityStatus, SubjectEnum, SubjectIcons } from '@viastud/utils'
import { ChevronDown, Loader } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, type SubmitHandler, useForm } from 'react-hook-form'
import { z } from 'zod'

const createReservationSchema = z.object({
  sheetId: z.number(),
  selectedSlots: z
    .array(
      z.object({
        weekStart: z.string().refine((date) => !Number.isNaN(Date.parse(date)), {
          message: 'Invalid date format',
        }),
        dayOfWeek: z.number().min(0).max(6),
        hour: z.number().min(9).max(21),
        minute: z.union([z.literal(0), z.literal(30)]),
        slotId: z.number().nullable(),
        status: z.enum(availabilityStatus),
      })
    )
    .min(1, 'Please select at least one slot.'),
})

export const Route = createFileRoute('/_student/_layout/course/$course')({
  component: Course,
})

const studentAvailabilitySchema = createReservationSchema

type StudentAvailabilityForm = z.infer<typeof studentAvailabilitySchema>
type AvailabilitySlot = StudentAvailabilityForm['selectedSlots'][number]

interface CreatedReservation {
  dayOfWeek: number
  hour: number
  minute?: number
  weekStart: string
}

function isCreatedReservation(value: unknown): value is CreatedReservation {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  const hasDay = typeof obj.dayOfWeek === 'number'
  const hasHour = typeof obj.hour === 'number'
  const hasWeek = typeof obj.weekStart === 'string'
  const hasMinute = obj.minute === undefined || typeof obj.minute === 'number'
  return hasDay && hasHour && hasWeek && hasMinute
}

export function Course() {
  const { course: sheetId } = Route.useParams()
  const navigate = useNavigate()

  const [selectedWeek, setSelectedWeek] = useState(dateService.getStartOfWeek())
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [resultSlots, setResultSlots] = useState<CreatedReservation[]>([])
  const [pendingSlots, setPendingSlots] = useState<AvailabilitySlot[]>([])

  const { data: course } = trpc.sheet.getOne.useQuery({ id: sheetId })
  const { data: tokenInfo, refetch: refetchTokenBalance } = trpc.user.getTokenBalance.useQuery()
  const { data: studentSubscription } = trpc.user.getStudentSubscriptionDetails.useQuery()
  const { handleError } = useToast()

  const { data: availableSlots, refetch } =
    trpc.studentAvailabilities.getStudentAvailabilities.useQuery({
      sheetId: Number(sheetId),
      weekStart: dateService.format(selectedWeek, 'YYYY-MM-DD'),
    })

  const createMultipleReservationsMutation =
    trpc.studentAvailabilities.createMultipleReservations.useMutation({
      onSuccess: async (results) => {
        await Promise.all([refetch(), refetchTokenBalance()])
        const confirmed = results.filter(isCreatedReservation)
        if (confirmed.length > 0) {
          setResultSlots(confirmed)
          setShowResultModal(true)
        }
      },
      onError: (error) => {
        handleError(error)
      },
    })

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<StudentAvailabilityForm>({
    resolver: zodResolver(studentAvailabilitySchema),
    defaultValues: {
      sheetId: Number(sheetId),
      selectedSlots: [],
    },
  })

  const watchedSelectedSlots = watch('selectedSlots')
  const selectedCount = (watchedSelectedSlots ?? []).filter((s) => s.status === 'SELECTED').length
  const isUnlimited = studentSubscription?.status === 'ACTIVE'
  const tokenBalance = tokenInfo?.balance ?? 0
  const remainingTokens = isUnlimited
    ? Number.POSITIVE_INFINITY
    : Math.max(0, tokenBalance - selectedCount)
  const isOverSelection = !isUnlimited && selectedCount > tokenBalance
  const isLowTokens = !isUnlimited && remainingTokens <= 2

  useEffect(() => {
    if (availableSlots) {
      const mappedAvailabilities: StudentAvailabilityForm['selectedSlots'] = availableSlots.map(
        (avail) => {
          const availabilityDate = dateService.addDays(
            dateService.getStartOfWeek(selectedWeek),
            avail.dayOfWeek
          )
          const availabilityDateTime = dateService
            .create(availabilityDate)
            .add(avail.hour, 'hour')
            .add((avail as unknown as { minute: number }).minute ?? 0, 'minute')
          return {
            weekStart: dateService.format(selectedWeek, 'YYYY-MM-DD'),
            dayOfWeek: avail.dayOfWeek,
            hour: avail.hour,
            minute: ((avail as unknown as { minute?: number }).minute ?? 0) as 0 | 30,
            slotId: avail.slotId ?? null,
            status: dateService.isAfterNow(availabilityDateTime.subtract(1, 'day').toDate())
              ? 'AVAILABLE'
              : 'UNAVAILABLE',
          }
        }
      )

      // Deduplicate by dayOfWeek-hour-minute to avoid double counting
      const seen = new Set<string>()
      const deduped = mappedAvailabilities.filter((a) => {
        const key = `${a.dayOfWeek}-${a.hour}-${a.minute}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      reset({ sheetId: Number(sheetId), selectedSlots: deduped })
    } else {
      reset({
        sheetId: Number(sheetId),
        selectedSlots: [],
      })
    }
  }, [availableSlots, reset, selectedWeek, sheetId])

  const onSubmit: SubmitHandler<StudentAvailabilityForm> = (data) => {
    if (data.selectedSlots.length === 0) return

    // If not subscribed and selection requires more tokens than available, show upsell modal
    if (!isUnlimited && selectedCount > tokenBalance) {
      window.dispatchEvent(
        new CustomEvent<{ message?: string }>('open-learning-modal', {
          detail: {
            message:
              "Tu n'as plus de jetons pour réserver ce cours. Découvre nos packs de cours ou l'abonnement Premium.",
          },
        })
      )
      return
    }

    setPendingSlots(data.selectedSlots)
    setShowConfirmModal(true)
  }

  const handleWeekChange = (newWeek: string) => {
    if (isDirty) {
      setShowWarningModal(true)
    } else {
      setSelectedWeek(new Date(newWeek))
    }
  }

  const onCancel = () => {
    setShowConfirmModal(false)
  }

  const confirmReservation = () => {
    if (pendingSlots.length === 0) {
      setShowConfirmModal(false)
      return
    }

    const slotsToCreate = pendingSlots.filter((slot) => slot.status === 'SELECTED')

    createMultipleReservationsMutation.mutate({
      sheetId: Number(sheetId),
      selectedSlots: slotsToCreate,
    })

    setShowConfirmModal(false)
    setPendingSlots([])
  }

  function isAvailabilityCore(value: unknown): value is {
    dayOfWeek: number
    hour: number
    minute?: 0 | 30
  } {
    if (typeof value !== 'object' || value === null) return false
    const obj = value as Record<string, unknown>
    const isValidDay = typeof obj.dayOfWeek === 'number'
    const isValidHour = typeof obj.hour === 'number'
    const minuteVal = obj.minute
    const isValidMinute = minuteVal === undefined || minuteVal === 0 || minuteVal === 30
    return isValidDay && isValidHour && isValidMinute
  }
  return (
    <div className="w-4/5 p-4">
      <Button
        variant="icon"
        type="button"
        className={cn(
          course?.module.subject === 'MATHS' ? 'bg-[#FFF189]' : 'bg-[#FED7AA]',
          'cursor-default'
        )}
      >
        <img src={SubjectIcons[course?.module.subject ?? 'MATHS']} alt={course?.module.subject} />
        &nbsp;{SubjectEnum[course?.module.subject ?? 'MATHS']}
      </Button>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-8 mt-4 flex flex-col items-start gap-4 md:flex-row">
          <div className="flex-1">
            <h1 className="mb-4 text-3xl font-bold">{course?.module.chapter?.name}</h1>
            <h2 className="mb-2 text-xl font-semibold text-gray-600">{course?.name}</h2>
            <p className="text-gray-700">{course?.description}</p>
          </div>
          <div className="flex flex-1 flex-col justify-end gap-4 md:flex-row md:items-center">
            <div className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700">
              <div className="flex items-center gap-3 whitespace-nowrap">
                <span className="text-gray-600">Mes cours restants disponibles</span>
                <span
                  className={`rounded-full px-2 py-0.5 font-semibold ${
                    isOverSelection
                      ? 'bg-red-50 text-red-700'
                      : isLowTokens
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-green-50 text-green-700'
                  }`}
                >
                  {isUnlimited ? '∞' : remainingTokens}
                </span>
                <span className="h-4 w-px bg-gray-200" />
                <span className="text-gray-600">Sélection</span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                  {selectedCount}
                </span>
              </div>
            </div>
            <Button
              type="submit"
              disabled={
                createMultipleReservationsMutation.isPending || !isDirty || selectedCount === 0
              }
            >
              {createMultipleReservationsMutation.isPending ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                'Valider mes créneaux de réservation'
              )}
            </Button>
          </div>
        </div>
        <h1 className="mb-4 text-xl font-bold">Sélectionner plusieurs créneaux</h1>
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:justify-between">
          <label htmlFor="week-select" className="mr-2 text-gray-700">
            Sélectionnez plusieurs créneaux selon vos disponibilités. Nous vous confirmerons quel
            créneau sera validé après la confirmation de votre réservation.
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
              {formattedWeekOptions.slice(0, 2).map((week) => (
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
        <Controller
          name="selectedSlots"
          control={control}
          render={({ field }) => (
            <>
              <AvailabilityTable
                weekStart={selectedWeek.toISOString()}
                daysOfWeek={daysOfWeek}
                timeSlots={timeSlots}
                defaultStatus="UNAVAILABLE"
                availabilities={field.value}
                isEditable={true}
                onSelect={(availability) => {
                  if (!isAvailabilityCore(availability)) {
                    return
                  }
                  const minutes = availability.minute ?? 0
                  const isSameKey = (a: AvailabilitySlot) =>
                    a.dayOfWeek === availability.dayOfWeek &&
                    a.hour === availability.hour &&
                    a.minute === minutes

                  const existing = field.value.find(isSameKey)

                  if (existing) {
                    const newStatus = existing.status === 'SELECTED' ? 'AVAILABLE' : 'SELECTED'
                    const withoutCurrent = field.value.filter((a) => !isSameKey(a))
                    const updated = [
                      ...withoutCurrent,
                      {
                        weekStart: dateService.format(selectedWeek, 'YYYY-MM-DD'),
                        dayOfWeek: availability.dayOfWeek,
                        hour: availability.hour,
                        minute: minutes,
                        slotId: existing.slotId ?? null,
                        status: newStatus,
                      },
                    ]
                    // Ensure no duplicates sneak in
                    const seen = new Set<string>()
                    const deduped = updated.filter((a) => {
                      const key = `${a.dayOfWeek}-${a.hour}-${a.minute}`
                      if (seen.has(key)) return false
                      seen.add(key)
                      return true
                    })
                    field.onChange(deduped)
                  } else {
                    const updated = [
                      ...field.value,
                      {
                        ...availability,
                        minute: minutes,
                        status: 'SELECTED',
                      },
                    ]
                    const seen = new Set<string>()
                    const deduped = updated.filter((a) => {
                      const key = `${a.dayOfWeek}-${a.hour}-${a.minute}`
                      if (seen.has(key)) return false
                      seen.add(key)
                      return true
                    })
                    field.onChange(deduped)
                  }
                }}
              />
              {errors.selectedSlots && (
                <p className="mt-2 text-sm text-red-500">{errors.selectedSlots.message}</p>
              )}
            </>
          )}
        />
      </form>
      <GenericModal
        title="Confirmer le changement de semaine"
        description="Vous avez des modifications non enregistrées. Voulez-vous les enregistrer avant de changer de semaine ?"
        open={showWarningModal}
        onOpenChange={setShowWarningModal}
        onConfirm={() => {
          setShowWarningModal(false)
          setShowConfirmModal(true)
        }}
        onCancel={() => {
          setShowWarningModal(false)
        }}
      />

      <GenericModal
        title="Confirmer votre réservation"
        description={`Les créneaux sélectionnés seront déduits de vos cours disponibles. 
Vous pourrez annuler jusqu'à 12h avant le cours pour récupérer vos crédits. 
Passé ce délai, le cours sera compté comme utilisé, même en cas d'absence.`}
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        onConfirm={confirmReservation}
        onCancel={onCancel}
      />

      <GenericModal
        title="Réservation confirmée !"
        description="Merci pour ton inscription. Voici les créneaux confirmés."
        details={`Pour participer au cours, un lien vers la visio sera disponible sur ton tableau de bord.
Enregistre ces dates dans ton agenda pour ne rien manquer.`}
        customContent={
          <div className="flex flex-col gap-3">
            {resultSlots.map((slot, idx) => (
              <div
                key={`${slot.weekStart}-${slot.dayOfWeek}-${slot.hour}-${slot.minute}-${idx}`}
                className="flex items-center justify-between rounded-lg border border-[#FDCD12] bg-[#FFDE33] p-3"
              >
                <div className="capitalize text-gray-700">
                  {dateService
                    .create(dateService.addDays(slot.weekStart, slot.dayOfWeek))
                    .format('dddd')}
                  <span className="ml-2 font-bold">
                    {dateService
                      .format(dateService.addDays(slot.weekStart, slot.dayOfWeek), 'DD / MM')
                      .toUpperCase()}
                  </span>
                </div>
                <div className="rounded-lg border border-[#FDCD12] bg-white px-2 py-1 text-gray-700">
                  {formatHourRangeWithTimezone(
                    slot.hour,
                    Math.floor((slot.hour * 60 + (slot.minute ?? 0) + 60) / 60),
                    undefined,
                    slot.minute ?? 0,
                    (slot.hour * 60 + (slot.minute ?? 0) + 60) % 60
                  )}
                </div>
              </div>
            ))}
          </div>
        }
        open={showResultModal}
        onOpenChange={setShowResultModal}
        onConfirm={() => navigate({ to: '/' })}
        onConfirmText="Continuer"
        shouldHideCloseBtn
      />
    </div>
  )
}
