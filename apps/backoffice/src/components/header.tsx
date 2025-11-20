import { Link, linkOptions } from '@tanstack/react-router'
import { Button } from '@viastud/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@viastud/ui/dropdown-menu'
import { UserIcon } from '@viastud/ui/shared/user-icon'

import { useAuthStore } from '../store/auth.store'

const tabs = [
  linkOptions({
    to: '/',
    label: 'Tableau de bord',
    activeOptions: { exact: true },
  }),
  linkOptions({
    to: '/users',
    label: 'Utilisateurs',
  }),
  linkOptions({
    to: '/professors',
    label: 'Professeurs',
  }),
  linkOptions({
    to: '/courses',
    label: 'Classes',
  }),
  linkOptions({
    to: '/analytics',
    label: 'Analytics',
  }),
  linkOptions({
    to: '/faq',
    label: 'FAQ',
  }),
  linkOptions({
    to: '/administration',
    label: 'Administration',
  }),
]

export default function Header() {
  const auth = useAuthStore()

  return (
    <div className="flex w-full justify-center p-4">
      <div className="h-70px shadow-custom flex w-5/6 items-center rounded-[68px] bg-white px-8 py-2">
        <div className="flex grow items-center justify-between">
          <div className="flex shrink-0 items-center gap-4">
            <img
              src="/logos/viastud-text-logo.png"
              alt="viastud logo"
              className="mb-px h-9 w-auto"
            />
            {tabs.map((option) => (
              <Link
                className="flex items-center px-4 py-2"
                key={option.to}
                to={option.to}
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
              <Button variant="none" asChild>
                <div className="cursor-pointer">
                  <UserIcon firstName={auth.admin?.firstName} lastName={auth.admin?.lastName} />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="flex flex-col items-stretch focus:bg-blue-50">
                <Link className="flex items-center gap-2" to="/settings">
                  <img className="size-4" src="/icons/settings.svg" alt="settings" />
                  <p className="text-sm font-medium text-gray-950">Paramètres</p>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  auth.updateAuth({
                    admin: undefined,
                    isAuthenticated: false,
                  })
                }}
                className="gap-2 text-sm font-medium text-gray-950 focus:bg-blue-50"
              >
                <img className="size-4" src="/icons/logout.svg" alt="logout" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
