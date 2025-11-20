import { cn } from '@viastud/ui/lib/utils'
import { useMeeting, useParticipant, VideoPlayer } from '@videosdk.live/react-sdk'
import { memo, useEffect, useRef, useState } from 'react'
import {
  Microphone01,
  MicrophoneOff01,
  Pin02,
  VideoRecorder,
  VideoRecorderOff,
} from 'untitledui-js/react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#components/ui/dropdown-menu'
import { CornerDisplayName } from '#components/videosdk/meeting/components/corner-display-name'
import { useMeetingStore } from '#store/meeting.store'
import type { ParticipantMetadata } from '#types/videosdk'

interface ParticipantViewProps {
  participantId: string
  pinned: boolean
}

function ParticipantView({ participantId, pinned }: ParticipantViewProps) {
  const {
    displayName,
    micStream,
    webcamOn,
    micOn,
    isLocal,
    isActiveSpeaker,
    participant,
  } = useParticipant(participantId)

  const { localParticipant } = useMeeting()

  const [menuOpen, setMenuOpen] = useState(false)

  const localMetadata = localParticipant.metaData as ParticipantMetadata
  const isLocalProfessor = localMetadata.userRole === 'PROFESSOR'
  const participantMetadata = participant?.metaData as ParticipantMetadata
  const isParticipantProfessor = participantMetadata?.userRole === 'PROFESSOR'

  const { selectedSpeaker } = useMeetingStore()
  const micRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox')
    if (micRef.current) {
      if (!isFirefox) {
        void micRef.current.setSinkId(selectedSpeaker?.id ?? '')
      }
    }
  }, [selectedSpeaker])

  useEffect(() => {
    if (micRef.current) {
      if (micOn && micStream) {
        const mediaStream = new MediaStream()
        mediaStream.addTrack(micStream.track)
        micRef.current.srcObject = mediaStream
        void micRef.current.play()
      } else {
        micRef.current.srcObject = null
      }
    }
  }, [micStream, micOn, micRef])

  return (
    <div
      className={cn(
        'video-cover relative aspect-square h-full overflow-hidden rounded-2xl bg-blue-950',
        {
          'border-2 border-green-400': isActiveSpeaker,
        }
      )}
    >
      {isLocalProfessor && !isParticipantProfessor && (
        <div className="absolute right-2 top-2 z-10">
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button className="flex h-[25px] w-[32px] flex-col items-center justify-center gap-[2px] rounded-full bg-gray-700 text-white hover:bg-gray-600">
                <span className="block h-[2.67px] w-[2.67px] rounded-full bg-white"></span>
                <span className="block h-[2.67px] w-[2.67px] rounded-full bg-white"></span>
                <span className="block h-[2.67px] w-[2.67px] rounded-full bg-white"></span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-54 rounded-lg bg-white p-2 shadow-lg">
              <DropdownMenuItem
                className={cn('flex items-center gap-2', participant.micOn && 'text-red-500')}
                onClick={() => {
                  if (participant.micOn) {
                    participant.disableMic()
                  } else {
                    participant.enableMic()
                  }
                }}
              >
                {participant.micOn ? <MicrophoneOff01 size="20" /> : <Microphone01 size="20" />}
                {participant.micOn ? 'Désactiver le micro' : 'Activer le micro'}
              </DropdownMenuItem>
              <DropdownMenuItem
                className={cn('flex items-center gap-2', participant.webcamOn && 'text-red-500')}
                onClick={() => {
                  if (participant.webcamOn) {
                    participant.disableWebcam()
                  } else {
                    participant.enableWebcam()
                  }
                }}
              >
                {participant.webcamOn ? (
                  <VideoRecorderOff size="20" />
                ) : (
                  <VideoRecorder size="20" />
                )}
                {participant.webcamOn ? 'Désactiver la caméra' : 'Activer la caméra'}
              </DropdownMenuItem>
              <DropdownMenuItem
                className={cn('flex items-center gap-2')}
                onClick={() => {
                  if (participant.pinState.cam) {
                    participant.unpin('CAM')
                    localParticipant.pin('CAM')
                  } else {
                    localParticipant.unpin('CAM')
                    participant.pin('CAM')
                  }
                }}
              >
                {participant.pinState.cam ? <Pin02 size="20" /> : <Pin02 size="20" />}
                {participant.pinState.cam ? 'Retirer' : 'Mettre en avant'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      <audio ref={micRef} autoPlay muted={isLocal} />
      {webcamOn ? (
        <VideoPlayer
          participantId={participantId}
          type="video"
          containerStyle={{
            width: '100%',
            height: '100%',
            borderRadius: '0.5rem',
            overflow: 'hidden',
          }}
          className="flex h-full w-full items-center justify-center bg-blue-200 p-4"
          classNameVideo="object-cover h-full w-full"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="z-10 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gray-700 2xl:h-[92px] 2xl:w-[92px]">
            <p className="text-2xl">{String(displayName).charAt(0).toUpperCase()}</p>
          </div>
        </div>
      )}
      <CornerDisplayName
        displayName={displayName}
        isLocal={isLocal}
        micOn={micOn}
        pinned={pinned}
      />
    </div>
  )
}

export const MemoizedParticipant = memo(ParticipantView, (prevProps, nextProps) => {
  return (
    prevProps.participantId === nextProps.participantId && prevProps.pinned === nextProps.pinned
  )
})
