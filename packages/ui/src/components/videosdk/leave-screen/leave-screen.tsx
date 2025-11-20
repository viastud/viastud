import { Link } from '@tanstack/react-router'
import { Button } from '@viastud/ui/button'
import { useState } from 'react'

import { EvaluateStudentsModal } from './evaluate-students-modal'
import { RatingProfessorModal } from './rating-professor-modal'

interface LeaveScreenProps {
  setIsMeetingLeft: (isMeetingLeft: boolean) => void
  setMeetingStarted: (isMeetingStarted: boolean) => void
  slotId: number
  isProfessor: boolean
}

export function LeaveScreen({ setIsMeetingLeft, setMeetingStarted, slotId, isProfessor }: LeaveScreenProps) {
  const [isRejoining, setIsRejoining] = useState(false)

  const handleRejoin = async () => {
    setIsRejoining(true)
    setMeetingStarted(false)
    try {
      setIsMeetingLeft(false)
    } catch {
      setIsMeetingLeft(false)
    } finally {
      setIsRejoining(false)
    }
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      {isProfessor ? (
        <EvaluateStudentsModal slotId={slotId} />
      ) : (
        <RatingProfessorModal slotId={slotId} />
      )}
      <h1 className="text-4xl">Vous avez quitté le cours !</h1>
      <div className="mt-12">
        <Button onClick={handleRejoin} disabled={isRejoining}>
          {isRejoining ? 'Reconnexion...' : 'Réintéger le cours'}
        </Button>
      </div>
      <div className="mt-12">
        <Link to="/">
          <Button
            onClick={() => {
              setIsMeetingLeft(false)
            }}
          >
            Revenir à l&apos;accueil
          </Button>
        </Link>
      </div>
    </div>
  )
}
