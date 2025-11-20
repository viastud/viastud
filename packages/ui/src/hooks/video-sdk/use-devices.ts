import type { DeviceInfo } from '@videosdk.live/react-sdk'
import { Constants, useMediaDevice } from '@videosdk.live/react-sdk'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useToast } from '#hooks/use-toast'
import useMediaStream from '#hooks/video-sdk/use-media-stream'
import { useMeetingStore } from '#store/meeting.store'

export function useDevices(setVideoStream: (videoStream: MediaStream | undefined) => void) {
  const [{ webcams, mics, speakers }, setDevices] = useState({
    webcams: [] as DeviceInfo[],
    mics: [] as DeviceInfo[],
    speakers: [] as DeviceInfo[],
  })

  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)

  const videoTrackRef = useRef<MediaStreamTrack | null>(null)
  const audioTrackRef = useRef<MediaStreamTrack | null>(null)

  const videoPlayerRef = useRef<HTMLVideoElement | null>(null)
  const mediaDeviceRef = useRef<ReturnType<typeof useMediaDevice> | null>(null)

  const { getVideoTrack, getAudioTrack } = useMediaStream()

  const { handleError } = useToast()

  const permissonAvailable = useRef<boolean>(null)

  const mediaDevices = useMediaDevice({
    onDeviceChanged,
  })

  useEffect(() => {
    mediaDeviceRef.current = mediaDevices
  }, [mediaDevices])

  const [dlgMuted, setDlgMuted] = useState(false)
  const [dlgDevices, setDlgDevices] = useState(false)
  const [didDeviceChange, setDidDeviceChange] = useState(false)

  const {
    localMicOn,
    localCameraOn,
    isMicAndCameraPermissionAllowed,
    selectedCamera,
    selectedMic,
    setSelectedMic,
    setSelectedWebcam,
    setSelectedSpeaker,
    setMicAndCameraPermissionAllowed,
    setLocalMicOn,
    setLocalCameraOn,
  } = useMeetingStore()

  const webcamRef = useRef<boolean>(null)
  const micRef = useRef<boolean>(null)

  useEffect(() => {
    webcamRef.current = localCameraOn
  }, [localCameraOn])

  useEffect(() => {
    micRef.current = localCameraOn
  }, [localCameraOn])

  async function startMuteListener() {
    if (audioTrackRef.current) {
      if (audioTrackRef.current.muted) {
        setDlgMuted(true)
      }
      audioTrackRef.current.addEventListener('mute', () => {
        setDlgMuted(true)
      })
    }
  }

  const requestAudioVideoPermission = useCallback(async () => {
    if (!mediaDeviceRef.current) return
    try {
      const permission = await mediaDeviceRef.current.requestPermission(
        Constants.permission.AUDIO_AND_VIDEO
      )

      const cameraAndMicrophonePermissionAllowed = permission.get(
        Constants.permission.AUDIO_AND_VIDEO
      )

      setMicAndCameraPermissionAllowed(!!cameraAndMicrophonePermissionAllowed)
      setLocalMicOn(!!cameraAndMicrophonePermissionAllowed)
      setLocalCameraOn(!!cameraAndMicrophonePermissionAllowed)
    } catch (error) {
      handleError(error, 'Erreur lors de la demande des permissions')
    }
  }, [setMicAndCameraPermissionAllowed, setLocalMicOn, setLocalCameraOn, handleError])

  const checkMediaPermission = useCallback(async () => {
    if (!mediaDeviceRef.current) return
    const checkAudioVideoPermission = await mediaDeviceRef.current.checkPermissions()
    const cameraAndMicrophonePermissionAllowed = checkAudioVideoPermission.get(
      Constants.permission.AUDIO_AND_VIDEO
    )

    if (cameraAndMicrophonePermissionAllowed) {
      setMicAndCameraPermissionAllowed(true)
      setLocalMicOn(true)
      setLocalCameraOn(true)
    } else {
      await requestAudioVideoPermission()
    }
  }, [
    requestAudioVideoPermission,
    setMicAndCameraPermissionAllowed,
    setLocalMicOn,
    setLocalCameraOn,
  ])

  const getCameraDevices = useCallback(async () => {
    if (!mediaDeviceRef.current) return
    try {
      if (permissonAvailable.current) {
        const newWebcams = await mediaDeviceRef.current.getCameras()
        setSelectedWebcam({
          id: newWebcams[0]?.deviceId,
          label: newWebcams[0]?.label,
        })
        setDevices((devices) => {
          return { ...devices, webcams: newWebcams }
        })
      }
    } catch (error) {
      handleError(error, 'Erreur lors de la récupération des caméras')
    }
  }, [handleError, setSelectedWebcam])

  const getAudioDevices = useCallback(async () => {
    if (!mediaDeviceRef.current) return
    try {
      if (permissonAvailable.current) {
        const newMics = await mediaDeviceRef.current.getMicrophones()
        const newSpeakers = await mediaDeviceRef.current.getPlaybackDevices()
        const hasMic = newMics.length > 0
        if (hasMic) {
          await startMuteListener()
        }
        setSelectedSpeaker({
          id: newSpeakers[0]?.deviceId,
          label: newSpeakers[0]?.label,
        })
        setSelectedMic({ id: newMics[0]?.deviceId, label: newMics[0]?.label })
        setDevices((devices) => {
          return { ...devices, mics: newMics, speakers: newSpeakers }
        })
      }
    } catch (error) {
      handleError(error, 'Erreur lors de la récupération des microphones')
    }
  }, [handleError, setSelectedMic, setSelectedSpeaker])

  useEffect(() => {
    const handleUpdateCamera = async () => {
      if (selectedCamera && localCameraOn) {
        const stream = await getVideoTrack({
          webcamId: selectedCamera.id,
        })

        if (videoPlayerRef.current && stream) {
          const isPlaying = !videoPlayerRef.current.paused && !videoPlayerRef.current.ended
          if (!isPlaying) {
            videoPlayerRef.current.srcObject = stream
            setVideoStream(stream)
          }
        }
      }
      // if (videoTrackRef.current) {
      //   videoTrackRef.current.stop()
      // }
      // if (selectedCamera && localCameraOn) {
      //   const stream = await getVideoTrack({
      //     webcamId: selectedCamera.id,
      //   })
      //
      //   setVideoStream(stream)
      //
      //   videoTrackRef.current = stream?.getVideoTracks()[0] ?? null
      //
      //   if (videoTrackRef.current) {
      //     const videoSrcObject = new MediaStream([videoTrackRef.current])
      //
      //     if (videoPlayerRef.current) {
      //       const isPlaying =
      //         videoPlayerRef.current.currentTime > 0 &&
      //         !videoPlayerRef.current.paused &&
      //         !videoPlayerRef.current.ended &&
      //         videoPlayerRef.current.readyState > videoPlayerRef.current.HAVE_NOTHING
      //
      //       videoPlayerRef.current.srcObject = videoSrcObject
      //       if (!isPlaying) {
      //         await videoPlayerRef.current.play().catch((error: unknown) => {
      //           handleError(error)
      //         })
      //       }
      //     }
      //   } else {
      //     if (videoPlayerRef.current) {
      //       videoPlayerRef.current.srcObject = null
      //     }
      //   }
      // }
    }
    void handleUpdateCamera()
  }, [getVideoTrack, handleError, selectedCamera, setVideoStream, localCameraOn])

  useEffect(() => {
    const handleUpdateMicrophone = async () => {
      if (audioTrackRef.current) {
        audioTrackRef.current.stop()
      }
      if (selectedMic && localMicOn) {
        const stream = await getAudioTrack({
          micId: selectedMic.id,
        })

        setAudioStream(stream)

        audioTrackRef.current = stream?.getAudioTracks()[0] ?? null
      }
    }

    void handleUpdateMicrophone()
  }, [getAudioTrack, localMicOn, selectedMic])

  useEffect(() => {
    async function init() {
      await checkMediaPermission()
      await getCameraDevices()
      await getAudioDevices()
    }
    void init()
  }, [checkMediaPermission, getAudioDevices, getCameraDevices])

  function onDeviceChanged() {
    setDidDeviceChange(true)
    void getCameraDevices()
    void getAudioDevices()
  }

  useEffect(() => {
    permissonAvailable.current = isMicAndCameraPermissionAllowed
  }, [isMicAndCameraPermissionAllowed])

  useEffect(() => {
    if (localMicOn) {
      void startMuteListener()
    }
  }, [localMicOn])

  return {
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
  }
}
