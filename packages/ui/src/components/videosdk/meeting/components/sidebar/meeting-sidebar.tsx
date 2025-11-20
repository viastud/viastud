import { Separator } from '@radix-ui/react-dropdown-menu'
import { XIcon } from 'lucide-react'
import { useEffect } from 'react'

import { Button } from '#components/ui/button'
import { Sidebar, SidebarHeader } from '#components/ui/sidebar'
import { Messages } from '#components/videosdk/meeting/components/sidebar/messages'
import { ParticipantsList } from '#components/videosdk/meeting/components/sidebar/participants-list'
import { useSidebar } from '#hooks/use-sidebar'
import { useMeetingStore } from '#store/meeting.store'
import { sidebarModeLabel } from '#types/videosdk'

import { SheetView } from './sheet-view'

export function MeetingSidebar() {
  const {setSideBarMode, sideBarMode, slotId} = useMeetingStore()
  const { toggleSidebar, open, openMobile, isMobile } = useSidebar()

  useEffect(() => {
    if ((!isMobile && !open) || (isMobile && !openMobile)) {
      setSideBarMode(null)
    }
  }, [isMobile, open, openMobile, setSideBarMode])

  return (
    <Sidebar side="right" className="rounded-l-[24px] bg-white">
      {sideBarMode && (
        <SidebarHeader className="w-full flex-row items-center justify-between pl-6 pt-6 text-xl font-bold">
          <div className="flex flex-row items-center gap-2">
            <p>{sidebarModeLabel[sideBarMode]}</p>
            {/*{sideBarMode === 'exercice' && (
              <Button
                variant="default"
                size="icon"
                onClick={() => {
                  setSideBarMode('sheet')
                }}
              >
                Fiche de cours
              </Button>
            )}
            {sideBarMode === 'sheet' && (
              <Button
                variant="default"
                size="icon"
                onClick={() => {
                  setSideBarMode('exercice')
                }}
              >
                Exercices
              </Button>
            )}*/}
          </div>
          <Button variant="none" size="icon" onClick={toggleSidebar}>
            <XIcon />
          </Button>
        </SidebarHeader>
      )}
      <Separator className="bg-gray-200" />
      {sideBarMode === 'participants' && <ParticipantsList />}
      {sideBarMode === 'messages' && <Messages />}
      {sideBarMode === 'sheet' && slotId && <SheetView slotId={slotId} />}
    </Sidebar>
  )
}
