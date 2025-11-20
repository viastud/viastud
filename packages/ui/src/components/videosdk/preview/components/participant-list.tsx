import { skipToken } from '@tanstack/react-query'
import dayjs from 'dayjs'
import type { Dispatch, SetStateAction } from 'react'
import { useEffect } from 'react'

import { UserIcon } from '#components/shared/user-icon'
import { trpc } from '#lib/trpc'
import { useMeetingStore } from '#store/meeting.store'

export function ParticipantList({
  setCanJoinMeeting,
}: {
  setCanJoinMeeting: Dispatch<SetStateAction<boolean>>
}) {
  const { token, roomId, slotId, setMeetingInfo } = useMeetingStore()

  const { data: meetingDetails } = trpc.videoSdk.getMeetingDetails.useQuery(
    token && roomId ? { token, roomId } : skipToken
  )
  const participants = meetingDetails?.participants
  useEffect(() => {
    if (meetingDetails && roomId && token && slotId) {
      setMeetingInfo({
        roomId,
        token,
        slotId,
        startDate: dayjs(meetingDetails.start)
      })
      setCanJoinMeeting(true)
    }
  }, [meetingDetails, roomId, setCanJoinMeeting, setMeetingInfo, slotId, token])

  if (!participants || participants.length === 0) {
    return <div>Personne d&apos;autre ne participe à cet appel</div>
  }

  return (
    <div className="flex gap-2">
      {participants.map((participant) => (
        <ParticipantItem key={participant.participantId} name={participant.name} />
      ))}
    </div>
  )
}

function ParticipantItem({ name }: { name: string }) {
  const [firstName, lastName] = name?.split(' ') ?? []

  return <UserIcon firstName={firstName} lastName={lastName} />
}
