import type React from 'react'

import type { Heading } from '../../types/heading'

interface NavigationButtonProps {
  heading: Heading
  onClick: () => void
  className?: string
}

export const NavigationButton: React.FC<NavigationButtonProps> = ({
  heading,
  onClick,
  className = '',
}) => {
  const baseStyle =
    'w-full text-left transition font-semibold rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400'
  const depthStyles = {
    2: 'text-blue-600 bg-blue-100 hover:bg-blue-200 text-sm',
    3: 'text-gray-700 bg-gray-100 hover:bg-gray-200 text-xs ml-4',
  }

  const depthStyle = depthStyles[heading.depth as keyof typeof depthStyles] || depthStyles[2]

  return (
    <button onClick={onClick} className={`${baseStyle} ${depthStyle} ${className}`.trim()}>
      {heading.value}
    </button>
  )
}
