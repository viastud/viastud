import { Link, linkOptions } from '@tanstack/react-router'
import { Button } from '@viastud/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@viastud/ui/dropdown-menu'
import { HelpCircle } from 'lucide-react'

import { useAuthStore } from '@/store/auth.store'

const tabs = [
  linkOptions({
    to: '/parent',
    label: 'Tableau de bord',
    activeOptions: { exact: true },
  }),
]

export default function ParentHeader() {
  const auth = useAuthStore()
  const initials = auth.isAuthenticated
    ? `${auth.user.firstName[0].toUpperCase()}${auth.user.lastName[0].toUpperCase()}`
    : '-'

  return (
    <div className="flex w-full justify-center p-4">
      <div className="h-70px flex w-5/6 items-center overflow-auto rounded-[68px] bg-white px-8 py-2 shadow-lg">
        <div className="flex grow items-center justify-between overflow-auto">
          <div className="flex shrink-0 items-center gap-4">
            <Link to="/parent">
              <img
                src="/logos/viastud-text-logo.png"
                alt="viastud logo"
                className="mb-px h-5 w-auto md:h-9"
              />
            </Link>
            {tabs.map((option) => (
              <Link
                className="flex items-center px-4 py-2"
                key={option.to}
                id={`btn-parent-header-${option.label}`}
                {...option}
                activeProps={{
                  className: 'text-blue-600 border-b-2 border-b-blue-600',
                }}
              >
                {option.label}
              </Link>
            ))}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="none"
                asChild
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-300 hover:bg-orange-300"
              >
                <p className="text-base font-semibold text-gray-950">{initials}</p>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="flex flex-col items-stretch focus:bg-blue-50">
                <Link className="flex items-center gap-2" to="/parent/settings">
                  <img className="size-4" src="/icons/settings.svg" alt="settings" />
                  <p className="text-sm font-medium text-gray-950">Paramètres</p>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-stretch focus:bg-blue-50">
                <Link className="flex items-center gap-2" to="/parent/support">
                  <HelpCircle className="size-4" />
                  <p className="text-sm font-medium text-gray-950">Support / Aide</p>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  auth.updateAuth({
                    user: undefined,
                    role: null,
                    isAuthenticated: false,
                  })
                }}
                className="gap-2 focus:bg-blue-50"
              >
                <img className="size-4" src="/icons/logout.svg" alt="logout" />
                <p className="text-sm font-medium text-gray-950">Se déconnecter</p>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
