import type { ModuleDto } from '@viastud/server/routers/module_router'
import { Checkbox } from '@viastud/ui/checkbox'

interface SelectModuleProps {
  module: ModuleDto
  checked: boolean
  selectModule: (moduleId: number) => void
}

export function SelectModule({ module, checked, selectModule }: SelectModuleProps) {
  return (
    <div
      key={module.id}
      className="flex cursor-pointer items-center justify-start gap-2 rounded-2xl bg-blue-50 p-4 transition-colors duration-300 hover:bg-blue-100"
      onClick={() => {
        selectModule(module.id)
      }}
    >
      <Checkbox checked={checked} />
      <p className="text-sm font-medium text-gray-700">{module.name}</p>
    </div>
  )
}
