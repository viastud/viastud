import type dayjs from 'dayjs'
import { create } from 'zustand'

type SidebarMode = 'participants' | 'messages' | 'sheet'

interface Device {
  id: string
  label: string
}

export interface MeetingState {
  // room
  roomId: string | null
  slotId: number | null
  token: string | null
  startDate: dayjs.Dayjs | null

  setMeetingInfo: (
    meetingInfo: Partial<{
      roomId: string | null
      slotId: number | null
      token: string | null
      startDate: dayjs.Dayjs | null
    }>
  ) => void

  // devices
  localMicOn: boolean
  localCameraOn: boolean
  selectedMic: Device | null
  selectedCamera: Device | null
  selectedSpeaker: Device | null

  setLocalMicOn: (enabled: boolean) => void
  setLocalCameraOn: (enabled: boolean) => void
  setSelectedMic: (device: Device) => void
  setSelectedWebcam: (device: Device) => void
  setSelectedSpeaker: (device: Device) => void
  resetDevices: () => void

  // permission
  isMicAndCameraPermissionAllowed: boolean

  setMicAndCameraPermissionAllowed: (isAllowed: boolean) => void

  // ui
  sideBarMode: SidebarMode | null

  setSideBarMode: (mode: SidebarMode | null) => void
}

export const useMeetingStore = create<MeetingState>()((set) => {
  return {
    // room
    roomId: null,
    slotId: null,
    token: null,
    startDate: null,

    setMeetingInfo: (
      meetingInfo: Partial<{
        roomId?: string | null
        slotId?: number | null
        token?: string | null
        startDate?: dayjs.Dayjs | null
      }>
    ) => {
      set({
        roomId: meetingInfo.roomId,
        slotId: meetingInfo.slotId,
        token: meetingInfo.token,
        startDate: meetingInfo.startDate,
      })
    },

    // devices
    localMicOn: false,
    localCameraOn: false,
    selectedMic: null,
    selectedCamera: null,
    selectedSpeaker: null,

    setLocalMicOn: (enabled) => {
      set({ localMicOn: enabled })
    },
    setLocalCameraOn: (enabled) => {
      set({ localCameraOn: enabled })
    },
    setSelectedMic: (device) => {
      set({ selectedMic: device })
    },
    setSelectedWebcam: (device) => {
      set({ selectedCamera: device })
    },
    setSelectedSpeaker: (device) => {
      set({ selectedSpeaker: device })
    },
    resetDevices: () => {
      set({
        localMicOn: false,
        localCameraOn: false,
        selectedMic: null,
        selectedCamera: null,
        selectedSpeaker: null,
      })
    },

    // permission
    isMicAndCameraPermissionAllowed: false,
    setMicAndCameraPermissionAllowed: (isAllowed) => {
      set({ isMicAndCameraPermissionAllowed: isAllowed })
    },

    // ui
    sideBarMode: null,
    setSideBarMode: (mode) => {
      set({ sideBarMode: mode })
    },
  }
})
