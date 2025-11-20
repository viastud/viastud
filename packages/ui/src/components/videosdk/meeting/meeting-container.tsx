import * as Sentry from '@sentry/react'
import { useToast } from '@viastud/ui/hooks/use-toast'
import { useMeeting, usePubSub } from '@videosdk.live/react-sdk'
import type { Participant } from '@videosdk.live/react-sdk/dist/types/participant'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'

import { GenericModal } from '#components/shared/generic-modal'
import { SidebarProvider } from '#components/ui/sidebar'
import { BottomBar } from '#components/videosdk/meeting/components/bottom-bar'
import { ParticipantGrid } from '#components/videosdk/meeting/components/participant-grid'
import { MeetingSidebar } from '#components/videosdk/meeting/components/sidebar/meeting-sidebar'
import { useMeetingStore } from '#store/meeting.store'
import type { ParticipantMetadata } from '#types/videosdk'

import { TopBar } from './components/top-bar'

interface MeetingContainerProps {
  onMeetingLeave: () => void
  setIsMeetingLeft: (isMeetingLeft: boolean) => void
}
export type Meeting = ReturnType<typeof useMeeting> & {
  isMeetingJoined: boolean
}

export function MeetingContainer({ onMeetingLeave, setIsMeetingLeft }: MeetingContainerProps) {
  const {resetDevices, sideBarMode, startDate} = useMeetingStore();
  const { toast } = useToast()

  const [showMicModal, setShowMicModal] = useState(false)
  const [showWebcamModal, setShowWebcamModal] = useState(false)
  const [micRequestData, setMicRequestData] = useState<{
    accept: () => void
    reject: () => void
  } | null>(null)
  const [webcamRequestData, setWebcamRequestData] = useState<{
    accept: () => void
    reject: () => void
  } | null>(null)
  const [timeFromMeetingStart, setTimeFromMeetingStart] = useState<string>('')
  const [timeUntilCourseEnd, setTimeUntilCourseEnd] = useState<number>(0)

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = dayjs().diff(startDate, 'second')
      const minutes = Math.floor(diff / 60)
      setTimeFromMeetingStart(
        `${minutes > 60 ? Math.floor(minutes / 60) : ''}${(minutes % 60)
          .toString()
          .padStart(2, '0')}:${(diff % 60).toString().padStart(2, '0')}`
      )

      // Calculer le temps restant avant la fin du cours (60 min après le début théorique)
      // Le cours commence théoriquement 5 minutes après le startDate de la réunion
      const courseStartTime = startDate?.add(5, 'minute')
      if (courseStartTime) {
        const courseEndTime = courseStartTime.add(60, 'minute')
        const timeUntilEnd = courseEndTime.diff(dayjs(), 'second')
        setTimeUntilCourseEnd(Math.max(0, timeUntilEnd))

        // La logique d'affichage de la bannière est gérée plus bas dans le composant
      }
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [startDate])

  const mMeetingRef = useRef<ReturnType<typeof useMeeting>>(null)
  const sidebarModeRef = useRef(sideBarMode)

  function onParticipantJoined(participant: Participant) {
    const metadata = participant?.metaData as ParticipantMetadata
    if (metadata.userRole === 'PROFESSOR') {
      Array.from(mMeetingRef.current?.participants?.values() ?? []).forEach((p: Participant) => {
        if (p.pinState.cam) {
          p.unpin('CAM')
        }
      })
      participant.pin('CAM')
    }
  }

  function onMeetingJoined() {
    Array.from(mMeetingRef.current?.participants?.values() ?? []).find((p: Participant) => {
      const metadata = p?.metaData as ParticipantMetadata
      if (metadata.userRole === 'PROFESSOR') {
        p.pin('CAM')
      }
    })

    const metadata = mMeetingRef.current?.localParticipant?.metaData as ParticipantMetadata

    if (metadata?.userRole === 'PROFESSOR' && import.meta.env.MODE !== 'development') {
      mMeetingRef.current?.startRecording(
        `${import.meta.env.VITE_BACKEND_URL}/api/webhook/recording-saved`,
        `/${import.meta.env.MODE}/`,
        {
          quality: 'med',
          layout: { type: 'SIDEBAR', gridSize: 4, priority: 'PIN' },
          mode: 'video-and-audio',
          orientation: 'landscape',
          theme: 'DEFAULT',
        }
      )
    }
  }

  function onMicRequested(data: { participantId: string; accept: () => void; reject: () => void }) {
    setMicRequestData(data)
    setShowMicModal(true)
  }

  function onWebcamRequested(data: {
    participantId: string
    accept: () => void
    reject: () => void
  }) {
    setWebcamRequestData(data)
    setShowWebcamModal(true)
  }

  function onMeetingLeft() {
    resetDevices()
    onMeetingLeave()
  }

  const onError = (error: { code: string; message: string }) => {
    const { code, message } = z.object({ code: z.number(), message: z.string() }).parse(error)

    const isCriticalError = code.toString().startsWith('500')

    void new Audio(
      isCriticalError
        ? `https://static.videosdk.live/prebuilt/notification_critical_err.mp3`
        : `https://static.videosdk.live/prebuilt/notification_err.mp3`
    ).play()

    if (isCriticalError) {
      Sentry.captureException(new Error(message), {
        extra: {
          code,
        },
      })
    }

    toast({
      title: message,
      variant: 'destructive',
    })
  }

  const mMeeting = useMeeting({
    onParticipantJoined,
    onMeetingLeft,
    onError,
    onMeetingJoined,
    onMicRequested,
    onWebcamRequested,
  }) as Meeting

  // useEffect(() => {
  //   mMeetingRef.current = mMeeting
  // }, [mMeeting])
  //
  // useEffect(() => {
  //   sidebarModeRef.current = sideBarMode
  // }, [sideBarMode])

  usePubSub('CHAT', {
    onMessageReceived: (data) => {
      const localParticipantId = mMeeting.localParticipant.id

      const { senderId, senderName, message } = data

      const isLocal = senderId === localParticipantId

      if (!isLocal && sidebarModeRef.current !== 'messages') {
        void new Audio(`https://static.videosdk.live/prebuilt/notification.mp3`).play()

        toast({ title: `${senderName} says: ${message}` })
      }
    },
  })

  // Nouvelle logique basée sur la fin du cours (60 min après le début théorique)
  const showClosingSoonBanner = timeUntilCourseEnd > 0 && timeUntilCourseEnd <= 5 * 60

  return (
    <SidebarProvider
      defaultOpen={false}
      className="bg-blue-950"
      sidebarWidth={sideBarMode === 'sheet' ? '600px' : undefined}
    >
      <GenericModal
        title="Le professeur demande l'activation de votre micro"
        description=""
        open={showMicModal}
        onOpenChange={setShowMicModal}
        width={400}
        shouldHideCloseBtn
        onConfirmText="Accepter"
        onCancelText="Refuser"
        onConfirm={() => {
          micRequestData?.accept()
          setShowMicModal(false)
        }}
        onCancel={() => {
          micRequestData?.reject()
          setShowMicModal(false)
        }}
      />

      <GenericModal
        title="Le professeur demande l'activation de votre caméra"
        description=""
        open={showWebcamModal}
        onOpenChange={setShowWebcamModal}
        width={400}
        shouldHideCloseBtn
        onConfirmText="Accepter"
        onCancelText="Refuser"
        onConfirm={() => {
          webcamRequestData?.accept()
          setShowWebcamModal(false)
        }}
        onCancel={() => {
          webcamRequestData?.reject()
          setShowWebcamModal(false)
        }}
      />
      <div className="relative flex h-screen w-full min-w-0 flex-1 flex-col items-center">
        {showClosingSoonBanner && (
          <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-md bg-yellow-500 px-4 py-2 text-sm font-semibold text-gray-900 shadow-lg">
            Le cours se terminera dans {Math.floor(timeUntilCourseEnd / 60)}m{' '}
            {(timeUntilCourseEnd % 60).toString().padStart(2, '0')}s
          </div>
        )}
        <TopBar />
        <ParticipantGrid />
        <div className="flex w-full items-center justify-between px-4">
          <div className="mb-6 flex h-[52px] min-w-[60px] flex-col justify-center rounded-2xl bg-gray-950 px-2 text-center text-white">
            {timeFromMeetingStart}
          </div>
          <BottomBar setIsMeetingLeft={setIsMeetingLeft} />
          <div className="mb-6 flex h-[52px] min-w-[60px]"></div>
        </div>
      </div>
      <MeetingSidebar />
    </SidebarProvider>
  )
}
