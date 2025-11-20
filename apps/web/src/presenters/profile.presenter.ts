import { skipToken } from '@tanstack/react-query'
import { trpc } from '@viastud/ui/lib/trpc'

import { useAuthStore } from '@/store/auth.store'

export type ProfilePresenter = ReturnType<typeof useProfilePresenter>

export function useProfilePresenter() {
  const { user: student } = useAuthStore()

  // TRPC queries
  const { data: onBoardingData } = trpc.user.getUserDetails.useQuery(
    student ? { id: student.id } : skipToken
  )

  const getSupportHours = () => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

    let weekdayHours
    let saturdayHours

    if (timeZone === 'Europe/Paris') {
      weekdayHours = '9h00 - 18h00' // Horaires France
      saturdayHours = '10h00 - 16h00'
    } else if (timeZone === 'Africa/Casablanca') {
      weekdayHours = '8h00 - 17h00' // Horaires Maroc (décalage -1h)
      saturdayHours = '9h00 - 15h00'
    } else {
      weekdayHours = '9h00 - 18h00' // Horaires par défaut
      saturdayHours = '10h00 - 16h00'
    }

    return [
      { day: 'Lundi - Vendredi', hours: weekdayHours },
      { day: 'Samedi', hours: saturdayHours },
      { day: 'Dimanche', hours: 'Fermé' },
    ]
  }

  const getProgressData = () => [
    {
      subject: 'Mathématiques',
      color: 'bg-red-500',
      progress: 85,
      status: 'Chapitre 12 terminé',
    },
    {
      subject: 'Physique-chimie',
      color: 'bg-blue-500',
      progress: 72,
      status: 'Quiz réussi',
    },
    {
      subject: 'Français',
      color: 'bg-purple-500',
      progress: 90,
      status: 'Dissertation notée',
    },
    {
      subject: 'Histoire-Géo',
      color: 'bg-green-500',
      progress: 64,
      status: 'Chapitre en cours',
    },
  ]

  const getQuizStats = () => ({
    completed: 12,
    total: 50,
  })

  const getSheetStats = () => ({
    read: 7,
    total: 20,
  })

  const handleContactSupport = () => {
    window.open('mailto:support@viastud.fr', '_blank')
  }

  return {
    // State
    student,

    // Data
    onBoardingData,

    // Event handlers
    handleContactSupport,

    // Helper functions
    getSupportHours,
    getProgressData,
    getQuizStats,
    getSheetStats,
  }
}
