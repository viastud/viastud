import { useShallow } from 'zustand/shallow'

import { Myst } from '#components/shared/myst'
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '#components/ui/sidebar'
import { trpc } from '#lib/trpc'
import { useMeetingStore } from '#store/meeting.store'

export function SheetView({ slotId }: { slotId: number }) {
  const { sidebarMode } = useMeetingStore(
    useShallow((state) => ({
      sidebarMode: state.sideBarMode,
    }))
  )
  const { data: sheetData } = trpc.sheet.getOneBySlotId.useQuery({ slotId })
  const sheet = sheetData?.sheet ?? {
    name: '',
    description: '',
    content: '',
    images: [],
  }
  const exercice = sheetData?.exercice ?? {
    name: '',
    content: '',
    images: [],
  }

  return (
    <SidebarContent>
      <SidebarGroup className="px-3">
        <SidebarGroupLabel className="pl-4 text-3xl font-extrabold text-gray-950">
          {sidebarMode === 'sheet' ? sheet.name : exercice.name}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <Myst
            text={sidebarMode === 'sheet' ? sheet.content : exercice.content}
            images={sidebarMode === 'sheet' ? sheet.images : exercice.images}
          />
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  )
}
