import { useNavigate } from '@tanstack/react-router'
import { Button } from '@viastud/ui/button'

export function NoCourses() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center space-y-8 py-16 text-center">
      <img src="/pictures/booking.svg" alt="No courses" className="h-64 w-64" />
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-800">Vous n&apos;avez pas encore de séances</h2>
        <p className="mx-auto max-w-md text-gray-600">
          Dès qu&apos;une séance est programmée, elle apparaîtra ici.
        </p>
      </div>
      <Button
        variant="default"
        className="rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-lg transition-transform hover:scale-105"
        onClick={() => navigate({ to: '/availabilities' })}
      >
        Gérer mes disponibilités
      </Button>
    </div>
  )
}
