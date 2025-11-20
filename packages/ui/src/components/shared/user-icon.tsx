interface UserIconProps {
  firstName?: string
  lastName?: string
}

export function UserIcon({ firstName, lastName }: UserIconProps) {
  const initials = `${firstName?.[0].toUpperCase() ?? ''}${lastName?.[0]?.toUpperCase() ?? ''}`
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-base font-semibold text-gray-950 hover:bg-yellow-300">
      {initials}
    </div>
  )
}
