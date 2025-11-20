import { UserIcon } from '@viastud/ui/shared/user-icon'

interface ChildTab {
  id: string
  firstName: string
}

interface ParentChildrenTabsProps {
  childrenList: ChildTab[]
  selectedChildId?: string
  onSelect: (childId: string) => void
}

export function ParentChildrenTabs({
  childrenList,
  selectedChildId,
  onSelect,
}: ParentChildrenTabsProps) {
  return (
    <div className="flex w-full gap-6 overflow-x-auto px-1 py-4">
      {childrenList.map((child) => {
        const isSelected = child.id === selectedChildId
        return (
          <button
            key={child.id}
            type="button"
            onClick={() => {
              onSelect(child.id)
            }}
            className={`shadow-custom flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-5 py-3 transition-all duration-150 ${isSelected ? 'bg-blue-50 ring-2 ring-blue-600' : 'hover:bg-neutral-50'} `}
            style={{ minWidth: 220 }}
          >
            <UserIcon firstName={child.firstName} lastName="" />
            <span className="text-base font-semibold">{child.firstName}</span>
          </button>
        )
      })}
    </div>
  )
}
