import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { useMeeting, useParticipant } from '@videosdk.live/react-sdk'
import type { Participant } from '@videosdk.live/react-sdk/dist/types/participant'
import {
  Microphone01,
  MicrophoneOff01,
  Pin02,
  VideoRecorder,
  VideoRecorderOff,
} from 'untitledui-js/react'

import { UserIcon } from '#components/shared/user-icon'
import { Button } from '#components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#components/ui/dropdown-menu'
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from '#components/ui/sidebar'
import { cn } from '#lib/utils'
import type { ParticipantMetadata } from '#types/videosdk'

const ParticipantUser = ({
  participantId,
  localParticipant,
}: {
  participantId: string
  localParticipant: Participant
}) => {
  const { participant } = useParticipant(participantId)
  const localMetadata = localParticipant.metaData as ParticipantMetadata

  const [firstName, lastName] = participant.displayName?.split(' ') ?? []

  const isLocalProfessor = localMetadata.userRole === 'PROFESSOR'

  return (
    <SidebarMenuItem className="flex items-center gap-4">
      <UserIcon firstName={firstName} lastName={lastName} />
      <p className="flex-1 text-lg font-medium">{participant?.displayName}</p>
      {participantId !== localParticipant.id && isLocalProfessor && (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="icon" size="icon">
              <DotsHorizontalIcon height={24} width={24} />
            </Button>
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
              {participant.webcamOn ? <VideoRecorderOff size="20" /> : <VideoRecorder size="20" />}
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
      )}
    </SidebarMenuItem>
  )
}

export function ParticipantsList() {
  const { participants, localParticipant } = useMeeting()

  return (
    <SidebarContent>
      <SidebarGroup className="px-3">
        <SidebarGroupLabel className="pl-0 text-gray-500">
          {participants.size} participants
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="mt-4 flex flex-col gap-4">
            {[...participants.keys()].map((participantId) => {
              return (
                <ParticipantUser
                  participantId={participantId}
                  localParticipant={localParticipant}
                  key={participantId}
                />
              )
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  )
}
