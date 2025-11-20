import { useMeeting, useWhiteboard } from '@videosdk.live/react-sdk'
import { memo, useMemo } from 'react'

import { MemoizedParticipant } from '#components/videosdk/meeting/components/participant-view'
import { cn } from '#lib/utils'
import { useMeetingStore } from '#store/meeting.store'

import { AudioOnlyParticipant } from './audio-only-participant'

const MemoizedAudioOnlyParticipant = memo(AudioOnlyParticipant)

export function ParticipantGrid() {
  const { participants, pinnedParticipants, localParticipant } = useMeeting()

  const { sideBarMode } = useMeetingStore()

  const pinnedParticipantId = useMemo(() => [...pinnedParticipants.keys()][0], [pinnedParticipants])

  const participantIds = useMemo(() => {
    if (!participants.size) {
      return []
    }
    const ids = [...participants.keys()].filter((participantId) => {
      return pinnedParticipantId !== participantId && localParticipant.id !== participantId
    })

    if (localParticipant.id !== pinnedParticipantId) {
      ids.unshift(localParticipant.id)
    }

    if (pinnedParticipantId) {
      ids.unshift(pinnedParticipantId)
    }

    return ids.slice(0, 6)
  }, [participants, localParticipant, pinnedParticipantId])

  const { whiteboardUrl } = useWhiteboard()

  const hiddenParticipantIds = useMemo(() => {
    if ((sideBarMode !== 'sheet') || !participants.size) {
      return []
    }
    return [...participants.keys()].filter((id) => id !== localParticipant?.id)
  }, [sideBarMode, participants, localParticipant])

  return (
    <>
      <div
        className={cn(
          'grid aspect-[4/3] flex-1 grid-cols-5 gap-4 px-4',
          { 'flex aspect-auto w-full': whiteboardUrl },
          { 'aspect-auto grid-cols-1': sideBarMode === 'sheet' },
          { 'max-w-[calc(100vw-var(--sidebar-width))]': !!sideBarMode }
        )}
      >
        {whiteboardUrl ? (
          <>
            <div className="flex-1">
              <iframe
                src={whiteboardUrl}
                style={{ width: '100%', height: '100%' }}
                className="rounded-lg border shadow"
              ></iframe>
            </div>
            {sideBarMode !== 'sheet' && (
              <div className="max-h-[calc(100vh-200px)] w-48 overflow-y-auto">
                <div className="grid gap-4">
                  {participantIds.map((participantId) => {
                    const participant = participants.get(participantId)

                    if (participantId === localParticipant.id) {
                      participant?.setQuality('low')
                    } else {
                      participant?.setQuality('med')
                    }

                    return (
                      <div
                        key={participantId}
                        className={cn('aspect-square w-full shadow', {
                          'order-1 col-start-1 row-start-1': participantId === pinnedParticipantId,
                        })}
                      >
                        <MemoizedParticipant participantId={participantId} pinned={false} />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {participantIds.map((participantId) => {
              const participant = participants.get(participantId)

              if (participantId === pinnedParticipantId) {
                participant?.setQuality('high')
              } else {
                participant?.setQuality('med')
              }

              if (
                participantId !== pinnedParticipantId &&
                (sideBarMode === 'sheet')
              ) {
                return null
              }

              return (
                <div
                  key={participantId}
                  className={cn('aspect-square gap-4', {
                    'order-1 col-span-3 col-start-1 row-span-3 row-start-1':
                      participantId === pinnedParticipantId,
                  })}
                >
                  <MemoizedParticipant
                    participantId={participantId}
                    pinned={participantId === pinnedParticipantId}
                  />
                </div>
              )
            })}
          </>
        )}
      </div>

      {sideBarMode === 'sheet' &&
        hiddenParticipantIds.length > 0 && (
          <div style={{ display: 'none' }}>
            {hiddenParticipantIds.map((participantId) => (
              <MemoizedAudioOnlyParticipant key={participantId} participantId={participantId} />
            ))}
          </div>
        )}
    </>
  )
}
