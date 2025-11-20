import { useWhiteboard } from '@videosdk.live/react-sdk'
import { ArrowUpRight } from 'lucide-react'

import { Separator } from '#components/ui/separator'

export function WhiteboardMeetingLinkButton() {
  const { whiteboardUrl } = useWhiteboard()

  const openInNewTab = () => {
    if (whiteboardUrl) {
      window.open(whiteboardUrl, '_blank')
    }
  }

  if (!whiteboardUrl) {
    return (
      <div className="flex items-center gap-2 rounded-[20px] bg-gray-950 px-4 py-2 text-lg font-medium text-white">
        URL du tableau non disponible
      </div>
    )
  }

  return (
    <div
      className="flex cursor-pointer items-center gap-2 rounded-[20px] bg-gray-950 px-4 py-2 text-lg font-medium text-white"
      onClick={openInNewTab}
    >
      Lien du tableau blanc
      <Separator orientation="vertical" className="flex h-6 bg-white" color="FFFFFF" />
      <ArrowUpRight className="h-6" />
    </div>
  )
}
