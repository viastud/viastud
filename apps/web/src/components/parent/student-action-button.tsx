import { Button } from '@viastud/ui/button'
import type React from 'react'

interface StudentActionButtonProps {
  studentName: string
  variant?: 'primary' | 'secondary'
  icon?: React.ReactNode
  label?: string
}

const StudentActionButton: React.FC<StudentActionButtonProps> = ({
  variant = 'primary',
  icon,
  label,
}) => {
  const defaultLabel = 'Voir les progrès'
  const displayLabel = label ?? defaultLabel

  return (
    <Button
      variant={variant === 'primary' ? 'outline' : 'outline'}
      size="sm"
      className="border-gray-300 px-4 py-3 text-sm font-normal text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900"
    >
      {icon && <span className="mr-2">{icon}</span>}
      {displayLabel}
    </Button>
  )
}

export default StudentActionButton
