import { useNavigate } from '@tanstack/react-router'
import { MeetingProvider } from '@videosdk.live/react-sdk'
import { LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { LeaveScreen } from '#components/videosdk/leave-screen/leave-screen'
import { MeetingContainer } from '#components/videosdk/meeting/meeting-container'
import { Preview } from '#components/videosdk/preview/preview'
import { useToast } from '#hooks/use-toast'
import { trpc } from '#lib/trpc'
import { useMeetingStore } from '#store/meeting.store'

export type Role = 'STUDENT' | 'PROFESSOR'

interface VideoSdkProps {
  firstName: string
  lastName: string
  userId: string
  userRole: Role
  slotId: number
  header?: React.ReactNode
}

export function VideoSdk({ userId, firstName, userRole, slotId, lastName, header }: VideoSdkProps) {
  const { data: roomIdAndToken, error } = trpc.videoSdk.getRoomIdAndToken.useQuery({ slotId })

  const navigate = useNavigate()
  const { localMicOn, localCameraOn, setMeetingInfo, setLocalCameraOn, setLocalMicOn } = useMeetingStore()

  const [isMeetingStarted, setMeetingStarted] = useState(false)
  const [isMeetingLeft, setIsMeetingLeft] = useState(false)
  const [videoStream, setVideoStream] = useState<MediaStream>()
  const { toast } = useToast()

  useEffect(() => {
    async function createRoom() {
      if (roomIdAndToken) {
        setMeetingInfo({
          roomId: roomIdAndToken.roomId,
          token: roomIdAndToken.token,
          slotId: slotId
        })
      } else if (error) {
        toast({
          title: "Ce meeting n'existe pas",
          variant: 'destructive',
        })
        void navigate({ to: '/' })
      }
    }
    void createRoom()
  }, [roomIdAndToken, setMeetingInfo, error, navigate, toast, slotId])

  if (isMeetingLeft) {
    return (
      <LeaveScreen
        setIsMeetingLeft={setIsMeetingLeft}
        setMeetingStarted={setMeetingStarted}
        slotId={Number(slotId)}
        isProfessor={userRole === 'PROFESSOR'}
      />
    )
  }

  if (!roomIdAndToken) {
    return <LoaderCircle className="my-auto h-8 w-8 animate-spin" />
  }

  return (
    <MeetingProvider
      config={{
        meetingId: roomIdAndToken.roomId,
        debugMode: false,
        maxResolution: 'hd',
        micEnabled: localMicOn,
        webcamEnabled: localCameraOn,
        customCameraVideoTrack: videoStream,
        name: `${firstName} ${lastName}`,
        multiStream: true,
        participantId: userId,
        metaData: {
          userRole,
        },
      }}
      token={roomIdAndToken.token}
    >
      {isMeetingStarted ? (
        <MeetingContainer
          onMeetingLeave={() => {
            setLocalCameraOn(false)
            setLocalMicOn(false)
            setMeetingStarted(false)
          }}
          setIsMeetingLeft={setIsMeetingLeft}
        />
      ) : (
        <>
          {header}
          <Preview setMeetingStarted={setMeetingStarted} setVideoStream={setVideoStream} />
        </>
      )}
    </MeetingProvider>
  )
}
