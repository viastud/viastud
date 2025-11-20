import { skipToken } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'

import { Separator } from '#components/ui/separator'
import { trpc } from '#lib/trpc'
import { useMeetingStore } from '#store/meeting.store'

import lockIcon from './lock-icon.svg'
import logo from './viastud-text-white-logo.png'
import { WhiteboardMeetingLinkButton } from './whiteboard-meeting-link'

export function TopBar() {
  const { slotId } = useMeetingStore()

  const { data: moduleData } = trpc.module.getOneMinimalBySlotId.useQuery(
    slotId ? { slotId: Number(slotId) } : skipToken
  )

  return (
    <div className="flex w-full items-center justify-between gap-4 px-8 py-4">
      <img src={logo} className="h-8" />
      <div className="flex items-center gap-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-shrink-0 items-start gap-2 whitespace-nowrap rounded-[20px] bg-gray-950 px-4 py-2 text-lg font-medium text-white">
          <img src={lockIcon} className="h-6" />
          <Separator orientation="vertical" className="flex h-6 bg-white" color="FFFFFF" />
          {moduleData?.name}
        </div>
        <Link
          target="_blank"
          to="/ressources/$grade/$subject"
          params={{
            grade: moduleData?.grade.toLowerCase() ?? '',
            subject: moduleData?.subject.toLowerCase() ?? '',
          }}
        >
          <div className="flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-[20px] bg-gray-950 px-4 py-2 text-lg font-medium text-white">
            Voir la fiche de cours
            <Separator orientation="vertical" className="flex h-6 bg-white" color="FFFFFF" />
            <ArrowUpRight className="h-6" />
          </div>
        </Link>
        <div className="flex-shrink-0">
          <WhiteboardMeetingLinkButton />
        </div>
      </div>
    </div>
  )
}
