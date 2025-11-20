import { useNavigate } from '@tanstack/react-router'
import { Button } from '@viastud/ui/button'
import { trpc } from '@viastud/ui/lib/trpc'
import { useEffect, useState } from 'react'

interface MarkSheetAsReadButtonProps {
  sheetId: number
  moduleId: number
  taskId: number
  disabled?: boolean
  onDone?: () => void
}

export function MarkSheetAsReadButton({
  sheetId,
  moduleId,
  taskId,
  disabled,
  onDone,
}: MarkSheetAsReadButtonProps) {
  const utils = trpc.useUtils()
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  // Appel à l'endpoint pour savoir si la fiche est déjà lue
  const { data, isLoading: isChecking } = trpc.sheet.isSheetRead.useQuery({ taskId })

  useEffect(() => {
    if (data) setDone(data.isRead)
  }, [data])

  const markAsReadMutation = trpc.sheet.markAsRead.useMutation({
    onSuccess: () => {
      setSuccess(true)
      setDone(true)
      // Invalidate related queries so the dashboard progress updates
      void utils.studentProgress.getStudentStats.invalidate({ moduleId })
      void utils.studentProgress.getNextRecommendation.invalidate()
      void utils.user.getStudentProfileData.invalidate()
      if (onDone) onDone()

      setTimeout(() => {
        void navigate({ to: '/' })
      }, 1000)
    },
    onError: () => {
      setSuccess(false)
      setDone(false)
    },
  })

  const handleClick = async () => {
    setLoading(true)
    await markAsReadMutation.mutateAsync({ sheetId, moduleId, taskId })
    setLoading(false)
  }

  return (
    <div className="mt-16 flex flex-col items-center">
      <Button
        variant="secondary"
        className={`mb-10 rounded-lg px-8 py-8 text-lg font-semibold ${
          done
            ? 'cursor-not-allowed bg-gray-300 text-gray-500'
            : 'bg-yellow-300 text-gray-950 hover:bg-yellow-400'
        }`}
        onClick={handleClick}
        disabled={done ?? loading ?? disabled ?? isChecking}
      >
        {done ? 'Lecture terminée !' : "J'ai terminé la lecture de ce cours"}
      </Button>
      {success && <span className="text-green-600">Bravo, fiche marquée comme lue !</span>}
    </div>
  )
}
