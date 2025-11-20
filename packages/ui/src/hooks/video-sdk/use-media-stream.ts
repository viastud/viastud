import { createCameraVideoTrack, createMicrophoneAudioTrack } from '@videosdk.live/react-sdk'
import { useCallback } from 'react'

type EncoderConfig = Parameters<typeof createCameraVideoTrack>[0]['encoderConfig']

const useMediaStream = () => {
  const getVideoTrack = useCallback(
    async ({ webcamId, encoderConfig }: { webcamId: string; encoderConfig?: EncoderConfig }) => {
      try {
        const track = await createCameraVideoTrack({
          cameraId: webcamId,
          encoderConfig: encoderConfig ?? 'h720p_w1280p',
          optimizationMode: 'motion',
          multiStream: false,
        })

        return track
      } catch {
        return undefined
      }
    },
    []
  )

  const getAudioTrack = useCallback(async ({ micId }: { micId: string }) => {
    try {
      const track = await createMicrophoneAudioTrack({
        microphoneId: micId,
      })
      return track
    } catch {
      return null
    }
  }, [])

  return { getVideoTrack, getAudioTrack }
}

export default useMediaStream
