import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { VideoSdk } from '@viastud/ui/shared/videosdk'
import { z } from 'zod'

import ProfessorHeader from '@/components/professor-header'
import { useAuthStore } from '@/store/auth.store'

export const Route = createLazyFileRoute('/meeting/$slot-id')({
  component: MeetingRoom,
})

const paramsSchema = z.object({
  'slot-id': z.coerce.number(),
})

function MeetingRoom() {
  const auth = useAuthStore()
  const navigate = useNavigate()

  const params = paramsSchema.safeParse(Route.useParams())

  if (!params.success) {
    return navigate({ to: '/' })
  }

  if (!auth.isAuthenticated) {
    return navigate({ to: '/login' })
  }

  return (
    <VideoSdk
      firstName={auth.professor.firstName}
      lastName={auth.professor.lastName}
      userId={auth.professor.id}
      userRole="PROFESSOR"
      slotId={params.data['slot-id']}
      header={<ProfessorHeader />}
    />
  )
}
