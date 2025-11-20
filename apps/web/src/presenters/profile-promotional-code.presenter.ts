import { skipToken } from '@tanstack/react-query'
import { trpc } from '@viastud/ui/lib/trpc'
import { useState } from 'react'

import { useAuthStore } from '@/store/auth.store'

export type ProfilePromotionalCodePresenter = ReturnType<typeof useProfilePromotionalCodePresenter>

export function useProfilePromotionalCodePresenter() {
  const { user: student } = useAuthStore()
  const [copied, setCopied] = useState(false)

  // TRPC queries
  const { data: promotionalCodeData } = trpc.user.getPromotionalCode.useQuery(
    student ? { id: student.id } : skipToken
  )

  // Event handlers
  const handleCopyCode = async () => {
    if (promotionalCodeData?.code) {
      try {
        await navigator.clipboard.writeText(promotionalCodeData.code)
        setCopied(true)
        setTimeout(() => {
          setCopied(false)
        }, 2000) // Reset after 2 seconds
      } catch {
        // Silent error handling for copy
      }
    }
  }

  return {
    // State
    copied,

    // Data
    promotionalCodeData,

    // Setters
    setCopied,

    // Event handlers
    handleCopyCode,
  }
}
