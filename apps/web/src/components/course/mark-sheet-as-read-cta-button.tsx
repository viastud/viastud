import { Button } from '@viastud/ui/button'
import { trpc } from '@viastud/ui/lib/trpc'
import { useEffect, useState } from 'react'

interface MarkSheetAsReadCtaButtonProps {
  sheetId: number
  moduleId: number
  taskId: number
  disabled?: boolean
  onDone?: () => void
}

// CTA version of the mark-as-read button with the primary gradient style
export function MarkSheetAsReadCtaButton({
  sheetId,
  moduleId,
  taskId,
  disabled,
  onDone,
}: MarkSheetAsReadCtaButtonProps) {
  const utils = trpc.useUtils()
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const { data, isLoading: isChecking } = trpc.sheet.isSheetRead.useQuery({ taskId })

  useEffect(() => {
    if (data) setDone(data.isRead)
  }, [data])

  const markAsReadMutation = trpc.sheet.markAsRead.useMutation({
    onSuccess: () => {
      setDone(true)
      // Invalidate related queries so the dashboard progress updates
      void utils.studentProgress.getStudentStats.invalidate({ moduleId })
      void utils.studentProgress.getNextRecommendation.invalidate()
      void utils.user.getStudentProfileData.invalidate()
      if (onDone) onDone()
    },
    onError: () => {
      setDone(false)
    },
  })

  const handleClick = async () => {
    setLoading(true)
    await markAsReadMutation.mutateAsync({ sheetId, moduleId, taskId })
    setLoading(false)
  }

  return (
    <>
      <Button
        variant="secondary"
        className={`h-10 rounded-3xl px-5 text-sm font-semibold ${
          done
            ? 'cursor-not-allowed bg-gray-300 text-gray-500'
            : 'bg-yellow-300 text-gray-950 hover:bg-yellow-400'
        }`}
        onClick={handleClick}
        disabled={done ?? loading ?? disabled ?? isChecking}
      >
        {done ? 'Lecture terminée !' : "J'ai terminé la lecture de ce cours"}
      </Button>
    </>
  )
}
