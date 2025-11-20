import { DrawingPinFilledIcon } from '@radix-ui/react-icons'
import { MicrophoneOff01 } from 'untitledui-js/react'

import { Button } from '#components/ui/button'
import { cn } from '#lib/utils'

interface CornerDisplayNameProps {
  displayName: string
  isLocal: boolean
  micOn: boolean
  pinned: boolean
}

export const CornerDisplayName = ({
  displayName,
  isLocal,
  micOn,
  pinned,
}: CornerDisplayNameProps) => {
  return (
    <div className="absolute bottom-2 left-2 flex items-center gap-1">
      {!micOn ? (
        <Button variant="destructive" size="icon" className="h-[25px] w-[28px]">
          <MicrophoneOff01 color="white" />
        </Button>
      ) : null}
      <p
        className={cn(
          'flex items-center gap-1 rounded-[20px] bg-[#0C111D80]/50 px-2 py-1 text-xs text-white',
          pinned && 'bg-yellow-300 text-black'
        )}
      >
        {pinned && <DrawingPinFilledIcon className="h-3 w-3" />}
        {displayName?.split(' ')[0]}
        {isLocal ? ' (Vous)' : ''}
      </p>
    </div>
  )
}
