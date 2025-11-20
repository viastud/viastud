import { useParticipant } from '@videosdk.live/react-sdk'
import { useEffect, useRef } from 'react'

import { useMeetingStore } from '#store/meeting.store'

interface AudioOnlyParticipantProps {
  participantId: string
}

export function AudioOnlyParticipant({ participantId }: AudioOnlyParticipantProps) {
  const { micStream, micOn, isLocal } = useParticipant(participantId)
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
    const audioEl = micRef.current
    if (audioEl) {
      if (micOn && micStream) {
        const mediaStream = new MediaStream()
        mediaStream.addTrack(micStream.track)
        audioEl.srcObject = mediaStream
        // eslint-disable-next-line no-console
        void audioEl.play().catch(console.error)
      } else {
        audioEl.srcObject = null
      }
    }
    return () => {
      if (audioEl) {
        audioEl.srcObject = null
        audioEl.pause()
      }
    }
  }, [micStream, micOn])

  useEffect(() => {
    const audioEl = micRef.current
    return () => {
      if (audioEl) {
        audioEl.srcObject = null
        audioEl.pause()
      }
    }
  }, [participantId])

  return <audio ref={micRef} autoPlay muted={isLocal} />
}
