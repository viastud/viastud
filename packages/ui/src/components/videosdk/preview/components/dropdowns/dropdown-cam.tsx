import type { DeviceInfo } from '@videosdk.live/react-sdk'
import { CameraIcon, CheckIcon } from 'lucide-react'

import { Popover, PopoverContent, PopoverTrigger } from '#components/ui/popover'
import { useMeetingStore } from '#store/meeting.store'

interface DropDownCamProps {
  webcams: DeviceInfo[]
}

export default function DropDownCam({ webcams }: DropDownCamProps) {
  const { setSelectedWebcam, selectedCamera, isMicAndCameraPermissionAllowed } = useMeetingStore()

  return (
    <>
      <Popover>
        <PopoverTrigger
          disabled={!isMicAndCameraPermissionAllowed}
          className="flex flex-1 items-center justify-center gap-4 overflow-hidden"
        >
          <CameraIcon className="h-4 w-4 flex-shrink-0" />
          <span className="overflow-hidden overflow-ellipsis whitespace-nowrap">
            {isMicAndCameraPermissionAllowed ? selectedCamera?.label : 'Permission Needed'}
          </span>
        </PopoverTrigger>
        <PopoverContent>
          {webcams.map((item, index) => {
            return (
              item.kind === 'videoinput' && (
                <div key={`webcams_${index}`} className="my-1 flex pl-4 pr-2 text-left text-black">
                  <span className="mr-2 flex w-6 items-center justify-center">
                    {selectedCamera?.label === item.label && <CheckIcon className="h-5 w-5" />}
                  </span>
                  <button
                    className="flex w-full flex-1 text-left"
                    value={item.deviceId}
                    onClick={() => {
                      setSelectedWebcam({
                        id: item.deviceId,
                        label: item.label,
                      })
                    }}
                  >
                    {item.label ? <span>{item.label}</span> : <span>{`Webcam ${index + 1}`}</span>}
                  </button>
                </div>
              )
            )
          })}
        </PopoverContent>
      </Popover>
    </>
  )
}
