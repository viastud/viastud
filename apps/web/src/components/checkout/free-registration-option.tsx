import { Button } from '@viastud/ui/button'
import { useState } from 'react'

export function FreeRegistrationOption() {
  const [isRegistering] = useState(false)

  return (
    <div className="p-6">
      <Button
        className="w-full bg-blue-600 py-3 text-lg font-bold hover:bg-blue-700"
        disabled={isRegistering}
        type="submit"
      >
        S&apos;inscrire gratuitement
      </Button>
    </div>
  )
}
