import type { DeviceInfo } from '@videosdk.live/react-sdk'
import { CheckIcon, SpeakerIcon } from 'lucide-react'
import { useState } from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '#components/ui/popover'
import { useToast } from '#hooks/use-toast'
import { useMeetingStore } from '#store/meeting.store'

import test_sound from '../sounds/test_sound.mp3'

interface DropDownSpeakerProps {
  speakers: DeviceInfo[]
}

export default function DropDownSpeaker({ speakers }: DropDownSpeakerProps) {
  const { setSelectedSpeaker, selectedSpeaker, isMicAndCameraPermissionAllowed } = useMeetingStore()

  const [audioProgress, setAudioProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const { handleError, toast } = useToast()

  const testSpeakers = () => {
    const selectedSpeakerDeviceId = selectedSpeaker?.id
    if (selectedSpeakerDeviceId) {
      const audio = new Audio(test_sound)
      try {
        void audio.setSinkId(selectedSpeakerDeviceId).then(() => {
          void audio.play()
          setIsPlaying(true)
          audio.addEventListener('timeupdate', () => {
            const progress = (audio.currentTime / audio.duration) * 100
            setAudioProgress(progress)
          })
          audio.addEventListener('ended', () => {
            setAudioProgress(0)
            setIsPlaying(false)
          })
        })
      } catch (error) {
        handleError(error)
      }
      audio.play().catch((error: unknown) => {
        handleError(error)
      })
    } else {
      toast({ title: 'Une erreur est survenue', description: 'Aucun haut parleur sélectionné' })
    }
  }

  return (
    <Popover>
      <PopoverTrigger
        disabled={!isMicAndCameraPermissionAllowed}
        className="flex flex-1 items-center gap-4 overflow-hidden"
      >
        <SpeakerIcon className="h-4 w-4 flex-shrink-0" />
        <span className="max-w-full overflow-hidden overflow-ellipsis whitespace-nowrap">
          {isMicAndCameraPermissionAllowed ? selectedSpeaker?.label : 'Permission Needed'}
        </span>
      </PopoverTrigger>
      <PopoverContent>
        {speakers.map((item, index) => {
          return (
            item.kind === 'audiooutput' && (
              <div key={`speaker_${index}`} className="my-1 flex pl-4 pr-2 text-left">
                <span className="mr-2 flex w-6 items-center justify-center">
                  {selectedSpeaker?.label === item.label && <CheckIcon className="h-5 w-5" />}
                </span>
                <button
                  className="flex w-full flex-1 text-left"
                  value={item.deviceId}
                  onClick={() => {
                    setSelectedSpeaker({
                      id: item.deviceId,
                      label: item.label,
                    })
                  }}
                >
                  {item.label ? <span>{item.label}</span> : <span>{`Speaker ${index + 1}`}</span>}
                </button>
              </div>
            )
          )
        })}
        {speakers.length && (
          <>
            <hr className="mb-1 mt-2 border border-gray-50" />
            <div className="my-1 pl-4 pr-2 text-left">
              <button
                className="mb-1 flex w-full flex-1 pl-1 text-left focus:outline-none"
                onClick={testSpeakers}
              >
                <span className="mr-3">
                  <SpeakerIcon />
                </span>
                {isPlaying ? (
                  <div className="bg-gray-450 mt-2 h-2 w-52 rounded-full dark:bg-gray-700">
                    <div
                      className="h-2 rounded-full bg-white opacity-50"
                      style={{ width: `${audioProgress}%` }}
                    ></div>
                  </div>
                ) : (
                  <span>Test Speakers</span>
                )}
              </button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
