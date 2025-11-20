import type { DeviceInfo } from '@videosdk.live/react-sdk'
import { CheckIcon, MicIcon, MicOff, PauseIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '#components/ui/popover'
import { useToast } from '#hooks/use-toast'
import { useMeetingStore } from '#store/meeting.store'

interface DropDownProps {
  mics: DeviceInfo[]
  audioStream: MediaStream | null
  micOn: boolean
  didDeviceChange: boolean
  setDidDeviceChange: (didDeviceChange: boolean) => void
}

export default function DropDownMic({
  mics,
  audioStream,
  micOn,
  didDeviceChange,
  setDidDeviceChange,
}: DropDownProps) {
  const { setSelectedMic, selectedMic, selectedSpeaker, isMicAndCameraPermissionAllowed } = useMeetingStore()
  const [audioProgress, setAudioProgress] = useState(0)
  const [recordingProgress, setRecordingProgress] = useState(0)
  const [recordingStatus, setRecordingStatus] = useState('inactive')
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [volume, setVolume] = useState<number>(0)
  const [audio, setAudio] = useState<string>()

  const intervalRef = useRef<NodeJS.Timeout>(null)
  const audioAnalyserIntervalRef = useRef<NodeJS.Timeout>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)

  const { handleError } = useToast()

  const mimeType = 'audio/webm'

  useEffect(() => {
    const audioTrack = audioStream?.getAudioTracks()[0]
    if (audioTrack) {
      analyseAudio(audioTrack)
    } else {
      stopAudioAnalyse()
    }
  }, [audioStream])

  useEffect(() => {
    if (didDeviceChange) {
      setDidDeviceChange(false)
      if (mediaRecorder.current != null && mediaRecorder.current.state === 'recording') {
        stopRecording()
      }
      setRecordingProgress(0)
      setRecordingStatus('inactive')
    }
  }, [didDeviceChange, setDidDeviceChange])

  const analyseAudio = (audioTrack: MediaStreamTrack) => {
    const audioStream = new MediaStream([audioTrack])
    const audioContext = new AudioContext()
    const audioSource = audioContext.createMediaStreamSource(audioStream)
    const analyser = audioContext.createAnalyser()

    analyser.fftSize = 512
    analyser.minDecibels = -127
    analyser.maxDecibels = 0
    analyser.smoothingTimeConstant = 0.4

    audioSource.connect(analyser)

    const volumes = new Uint8Array(analyser.frequencyBinCount)
    const volumeCallback = () => {
      analyser.getByteFrequencyData(volumes)
      const volumeSum = volumes.reduce((sum, vol) => sum + vol)
      const averageVolume = volumeSum / volumes.length
      setVolume(averageVolume)
    }
    audioAnalyserIntervalRef.current = setInterval(volumeCallback, 100)
  }

  const stopAudioAnalyse = () => {
    if (audioAnalyserIntervalRef.current) {
      clearInterval(audioAnalyserIntervalRef.current)
    }
  }

  const handlePlaying = async () => {
    setRecordingStatus('playing')
    const audioTags = document.getElementsByTagName('audio')

    for (const audioTag of audioTags) {
      await audioTag.setSinkId(selectedSpeaker?.id ?? '')
      await audioTag.play()
      audioTag.addEventListener('timeupdate', () => {
        const progress = (audioTag.currentTime / recordingDuration) * 100
        setAudioProgress(progress)
      })
      audioTag.addEventListener('ended', () => {
        setAudioProgress(0)
      })
    }
  }

  const startRecording = async () => {
    setRecordingStatus('recording')
    if (!audioStream) return

    try {
      const media = new MediaRecorder(audioStream)
      mediaRecorder.current = media
      mediaRecorder.current.start()
      let localAudioChunks: Blob[] = []

      mediaRecorder.current.ondataavailable = (event) => {
        if (typeof event.data === 'undefined') return
        if (event.data.size === 0) return
        localAudioChunks.push(event.data)
      }

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(localAudioChunks, { type: mimeType })
        const audioUrl = URL.createObjectURL(audioBlob)
        setAudio(audioUrl)
        localAudioChunks = []
        const elapsedTime = Date.now() - startTime
        const durationInSeconds = elapsedTime / 1000
        setRecordingDuration(durationInSeconds)
      }

      const startTime = Date.now()
      intervalRef.current = setInterval(() => {
        const elapsedTime = Date.now() - startTime
        const progress = (elapsedTime / 7000) * 100
        setRecordingProgress(progress)
      })

      setTimeout(() => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
        stopRecording()
      }, 7000)
    } catch (err) {
      handleError(err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state != 'inactive') {
      setRecordingProgress(0)
      setRecordingStatus('stopped recording')
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      mediaRecorder.current.stop()
    }
  }

  return (
    <>
      <Popover>
        <PopoverTrigger
          className="flex flex-1 items-center justify-center gap-4 overflow-hidden"
          disabled={!isMicAndCameraPermissionAllowed}
          onClick={() => {
            if (mediaRecorder.current != null && mediaRecorder.current.state == 'recording') {
              stopRecording()
            }
            setRecordingProgress(0)
            setRecordingStatus('inactive')
          }}
        >
          <MicIcon className="h-4 w-4 flex-shrink-0" />
          <span className="max-w-full overflow-hidden overflow-ellipsis whitespace-nowrap">
            {isMicAndCameraPermissionAllowed ? selectedMic?.label : 'Permission Needed'}
          </span>
        </PopoverTrigger>
        <PopoverContent>
          {mics.map((item, index) => {
            return (
              item.kind === 'audioinput' && (
                <div key={`mics_${index}`} className="my-1 flex pl-4 pr-2 text-left">
                  <span className="mr-2 flex w-6 items-center justify-center">
                    {selectedMic?.label === item.label && <CheckIcon className="h-5 w-5" />}
                  </span>
                  <button
                    className="flex w-full flex-1 text-left"
                    value={item.deviceId}
                    onClick={() => {
                      setSelectedMic({
                        label: item.label,
                        id: item.deviceId,
                      })
                      if (
                        mediaRecorder.current != null &&
                        mediaRecorder.current.state == 'recording'
                      ) {
                        stopRecording()
                      }
                      setRecordingProgress(0)
                      setRecordingStatus('inactive')
                    }}
                  >
                    {item.label ? <span>{item.label}</span> : <span>{`Mic ${index + 1}`}</span>}
                  </button>
                </div>
              )
            )
          })}

          <hr className="mb-1 mt-2 border border-gray-50" />

          {micOn ? (
            <div className="my-1 mb-2 flex w-full flex-1 pl-4 pr-2 text-left">
              <span className="mr-4 mt-1">
                <MicIcon />
              </span>

              <div className="bg-gray-450 mt-3 h-1 w-36 rounded-full dark:bg-gray-700">
                <div
                  className="h-1 rounded-full bg-black opacity-50"
                  style={{ width: `${(volume / 256) * 100}%` }}
                ></div>
              </div>

              {recordingStatus == 'inactive' && (
                <button
                  className="bg-gray-450 ml-5 h-7 w-16 rounded text-xs"
                  onClick={startRecording}
                >
                  Record
                </button>
              )}

              {recordingStatus == 'stopped recording' && (
                <button
                  className="bg-gray-450 ml-5 h-7 w-16 rounded text-xs"
                  onClick={handlePlaying}
                >
                  Play
                </button>
              )}

              {recordingStatus == 'recording' && (
                <button
                  className="bg-gray-450 relative z-0 ml-5 h-7 w-16 rounded text-xs"
                  onClick={stopRecording}
                >
                  <div
                    className="absolute left-0 top-0 h-7 rounded bg-[#6F767E]"
                    style={{ width: `${recordingProgress}%` }}
                  >
                    <PauseIcon />
                  </div>
                </button>
              )}

              {recordingStatus == 'playing' && (
                <button
                  className="bg-gray-450 relative z-0 ml-5 h-7 w-16 rounded text-xs"
                  onClick={handlePlaying}
                >
                  <div
                    className="absolute left-0 top-0 h-7 rounded bg-[#6F767E]"
                    style={{ width: `${audioProgress}%` }}
                  >
                    <PauseIcon />
                  </div>
                </button>
              )}
            </div>
          ) : (
            <div className="mb-2 flex w-full flex-1 items-center pl-5 text-[#747B84]">
              <MicOff />
              Unmute to test your mic
            </div>
          )}
        </PopoverContent>
      </Popover>
      <audio src={audio}></audio>
    </>
  )
}
