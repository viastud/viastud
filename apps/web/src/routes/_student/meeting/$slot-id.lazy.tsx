import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { VideoSdk } from '@viastud/ui/shared/videosdk'
import { z } from 'zod'

import StudentHeader from '@/components/student-header'
import { useAuthStore } from '@/store/auth.store'

export const Route = createLazyFileRoute('/_student/meeting/$slot-id')({
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
      firstName={auth.user.firstName}
      lastName={auth.user.lastName}
      userId={auth.user.id}
      userRole="STUDENT"
      slotId={params.data['slot-id']}
      header={<StudentHeader />}
    />
  )
}
