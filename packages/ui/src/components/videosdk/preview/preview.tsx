import { Button } from '@viastud/ui/button'
import { useMeeting } from '@videosdk.live/react-sdk'
import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { Microphone01, MicrophoneOff01, VideoRecorder, VideoRecorderOff } from 'untitledui-js/react'

import { GenericModal } from '#components/shared/generic-modal'
import DropDownCam from '#components/videosdk/preview/components/dropdowns/dropdown-cam'
import DropDownMic from '#components/videosdk/preview/components/dropdowns/dropdown-mic'
import DropDownSpeaker from '#components/videosdk/preview/components/dropdowns/dropdown-speaker'
import { ParticipantList } from '#components/videosdk/preview/components/participant-list'
import { useDevices } from '#hooks/video-sdk/use-devices'
import { cn } from '#lib/utils'
import { useMeetingStore } from '#store/meeting.store'

interface PreviewProps {
  setMeetingStarted: (isMeetingStarted: boolean) => void
  setVideoStream: (videoStream: MediaStream | undefined) => void
}

export function Preview({ setMeetingStarted, setVideoStream }: PreviewProps) {
  const meeting = useMeeting()

  const {localCameraOn, localMicOn, isMicAndCameraPermissionAllowed, setLocalCameraOn, setLocalMicOn} = useMeetingStore()
  const [canJoinMeeting, setCanJoinMeeting] = useState<boolean>(false)

  const {
    dlgMuted,
    dlgDevices,
    setDlgMuted,
    setDlgDevices,
    webcams,
    mics,
    speakers,
    videoPlayerRef,
    didDeviceChange,
    setDidDeviceChange,
    audioStream,
  } = useDevices(setVideoStream)

  return (
    <>
      <div className="my-auto flex w-full items-center justify-center gap-8 px-52">
        <div className="flex w-3/5 flex-col">
          <div className="relative">
            <video
              autoPlay
              playsInline
              muted
              ref={videoPlayerRef}
              controls={false}
              style={{
                backgroundColor: 'rgb(32,33,36)',
              }}
              className="flip flex aspect-video h-full w-full items-center justify-center rounded-[10px] object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 top-0 flex items-center justify-center">
              {!localCameraOn ? (
                <p className="text-xl text-white xl:text-lg 2xl:text-xl">Caméra désactivée</p>
              ) : null}
            </div>

            <div className="absolute bottom-4 left-0 right-0 xl:bottom-6">
              <div className="container grid grid-flow-col items-center justify-center space-x-4 md:-m-2">
                <Button
                  disabled={!isMicAndCameraPermissionAllowed}
                  variant={localMicOn ? 'icon' : 'destructive'}
                  className={cn('p-4', localMicOn && 'bg-darkBlue text-white')}
                  size="icon"
                  onClick={() => {
                    setLocalMicOn(!localMicOn)
                  }}
                >
                  {localMicOn ? <Microphone01 size="20" /> : <MicrophoneOff01 size="20" />}
                </Button>
                <Button
                  disabled={!isMicAndCameraPermissionAllowed}
                  variant={localCameraOn ? 'icon' : 'destructive'}
                  className={cn('p-4', localCameraOn && 'bg-darkBlue text-white')}
                  size="icon"
                  onClick={() => {
                    setLocalCameraOn(!localCameraOn)
                  }}
                >
                  {localCameraOn ? <VideoRecorder size="20" /> : <VideoRecorderOff size="20" />}
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-3 flex justify-between gap-6">
            <DropDownMic
              mics={mics}
              audioStream={audioStream}
              micOn={localMicOn}
              didDeviceChange={didDeviceChange}
              setDidDeviceChange={setDidDeviceChange}
            />
            <DropDownSpeaker speakers={speakers} />
            <DropDownCam webcams={webcams} />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-6 pl-8">
          <div className="flex flex-col gap-3">
            <div className="text-2xl font-bold">Prêt à participer à votre cours ?</div>
            <ParticipantList setCanJoinMeeting={setCanJoinMeeting} />
          </div>
          <Button
            onClick={() => {
              meeting.join()
              setMeetingStarted(true)
            }}
            className="mr-6 flex-1"
            disabled={!canJoinMeeting}
          >
            <div className="flex items-center gap-2">
              Participer au cours
              {!canJoinMeeting && <LoaderCircle className="h-4 w-4 animate-spin" />}
            </div>
          </Button>
        </div>
      </div>
      <GenericModal
        open={dlgMuted}
        onOpenChange={setDlgMuted}
        title="System mic is muted"
        description="You're default microphone is muted, please unmute it or increase audio
            input volume from system settings."
      />
      <GenericModal
        open={dlgDevices}
        onOpenChange={setDlgDevices}
        title="Mic or webcam not available"
        description="Please connect a mic and webcam to speak and share your video in the meeting. You can also join without them."
      />
    </>
  )
}
