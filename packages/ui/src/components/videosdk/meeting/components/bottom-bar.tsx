import { Button } from '@viastud/ui/button'
import type { DeviceInfo } from '@videosdk.live/react-sdk'
import { useMediaDevice, useMeeting, useWhiteboard } from '@videosdk.live/react-sdk'
import { FileTextIcon } from 'lucide-react'
import {
  Clapperboard,
  LogOut04,
  MessageSmileCircle,
  Microphone01,
  MicrophoneOff01,
  Users03,
  VideoRecorder,
  VideoRecorderOff,
} from 'untitledui-js/react'
import { useShallow } from 'zustand/shallow'

import { useSidebar } from '#hooks/use-sidebar'
import useMediaStream from '#hooks/video-sdk/use-media-stream'
import { cn } from '#lib/utils'
import { useMeetingStore } from '#store/meeting.store'
import type { ParticipantMetadata } from '#types/videosdk'

const MicBTN = () => {
  const {setSelectedSpeaker} = useMeetingStore()

  const mMeeting = useMeeting()
  const localMicOn = mMeeting.localMicOn

  useMediaDevice({
    onDeviceChanged,
  })

  async function onDeviceChanged(devices: Promise<DeviceInfo[]>) {
    const newSpeakerList = (await devices).filter((device) => device.kind === 'audiooutput')

    if (newSpeakerList.length > 0) {
      setSelectedSpeaker({
          id: newSpeakerList[0].deviceId,
          label: newSpeakerList[0].label
      })
    }
  }
  return (
    <Button
      variant={localMicOn ? 'icon' : 'destructive'}
      className={cn('p-4', { 'bg-darkBlue': localMicOn })}
      size="icon"
      onClick={() => {
        mMeeting.toggleMic()
      }}
    >
      {localMicOn ? (
        <Microphone01 size="20" color="white" />
      ) : (
        <MicrophoneOff01 size="20" color="white" />
      )}
    </Button>
  )
}

const WebCamBTN = () => {
  const { selectedCamera } = useMeetingStore()

  const mMeeting = useMeeting()
  const { getVideoTrack } = useMediaStream()

  const localWebcamOn = mMeeting.localWebcamOn

  return (
    <Button
      variant={localWebcamOn ? 'icon' : 'destructive'}
      className={cn('p-4', { 'bg-darkBlue': localWebcamOn })}
      size="icon"
      onClick={async () => {
        let track
        if (!localWebcamOn) {
          track = await getVideoTrack({
            webcamId: selectedCamera?.id ?? '',
          })
        }
        mMeeting.toggleWebcam(track)
      }}
    >
      {localWebcamOn ? <VideoRecorder size="20" color="white" /> : <VideoRecorderOff size="20" />}
    </Button>
  )
}

const WhiteBoardBtn = () => {
  const { startWhiteboard, stopWhiteboard, whiteboardUrl } = useWhiteboard()

  const isWhiteboardOpen = whiteboardUrl !== null

  return (
    <Button
      variant={isWhiteboardOpen ? 'outline' : 'icon'}
      className={cn('p-4', { 'bg-darkBlue': !isWhiteboardOpen })}
      size="icon"
      onClick={async () => {
        if (!isWhiteboardOpen) {
          await startWhiteboard()
        } else {
          await stopWhiteboard()
        }
      }}
    >
      {!isWhiteboardOpen ? <Clapperboard size="20" color="white" /> : <Clapperboard size="20" />}
    </Button>
  )
}

export function BottomBar({ setIsMeetingLeft }: { setIsMeetingLeft: (value: boolean) => void }) {
  const { localParticipant, meeting, leave } = useMeeting()
  const { toggleSidebar, state } = useSidebar()
  const { setSideBarMode, sidebarMode } = useMeetingStore(
    useShallow((state) => ({
      setSideBarMode: state.setSideBarMode,
      sidebarMode: state.sideBarMode,
    }))
  )
  const localMetadata = localParticipant?.metaData as ParticipantMetadata
  const isLocalProfessor = localMetadata?.userRole === 'PROFESSOR'

  return (
    <div className="w-full overflow-x-auto p-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max items-center gap-6">
        {isLocalProfessor && (
          <div className="flex flex-shrink-0 flex-col items-center gap-1">
            <WhiteBoardBtn />
            <p className="text-white">Tableau</p>
          </div>
        )}
        <div className="flex flex-shrink-0 flex-col items-center gap-1">
          <MicBTN />
          <p className="text-white">Micro</p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-center gap-1">
          <WebCamBTN />
          <p className="text-white">Caméra</p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-center gap-1">
          <Button
            variant="icon"
            className={cn(
              'bg-darkBlue border-4 border-transparent p-3',
              sidebarMode === 'messages' && 'border-4 border-[#9E77ED3D]'
            )}
            size="icon"
            onClick={() => {
              if (sidebarMode === 'messages' || state === 'collapsed') {
                toggleSidebar()
              }
              setSideBarMode('messages')
            }}
          >
            <MessageSmileCircle size="20" fill="white" strokeWidth={1.5} />
          </Button>
          <p className="text-white">Chat</p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-center gap-1">
          <Button
            variant="icon"
            className={cn(
              'bg-darkBlue border-4 border-transparent p-3',
              (sidebarMode === 'sheet') &&
                'border-4 border-[#9E77ED3D]'
            )}
            size="icon"
            onClick={() => {
              if (sidebarMode === 'sheet' || state === 'collapsed') {
                toggleSidebar()
              }
              setSideBarMode('sheet')
            }}
          >
            <FileTextIcon size="20" fill="white" strokeWidth={1.5} />
          </Button>
          <p className="text-white">Cours</p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-center gap-1">
          <Button
            variant="icon"
            className={cn(
              'bg-darkBlue border-4 border-transparent p-3',
              sidebarMode === 'participants' && 'border-4 border-[#9E77ED3D]'
            )}
            size="icon"
            onClick={() => {
              if (sidebarMode === 'participants' || state === 'collapsed') {
                toggleSidebar()
              }
              setSideBarMode('participants')
            }}
          >
            <Users03 size="20" fill="white" strokeWidth={0.5} />
          </Button>
          <p className="text-white">Participants</p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-center gap-1">
          <Button
            variant="destructive"
            className="p-4"
            size="icon"
            onClick={() => {
              leave()
              if (isLocalProfessor) {
                meeting.stopRecording()
              }
              setIsMeetingLeft(true)
            }}
          >
            <LogOut04 size="20" />
          </Button>
          <p className="text-white">Quitter</p>
        </div>
      </div>
    </div>
  )
}
