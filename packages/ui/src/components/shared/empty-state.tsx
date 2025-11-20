import type React from 'react'

interface EmptyStateProps {
  image: React.ReactNode
  title: string
  message: React.ReactNode
}

export function EmptyState({ image, title, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="h-64 w-64">{image}</div>
      <div className="mt-4">
        <p className="text-xl font-bold text-gray-800">{title}</p>
        <p className="mt-1 text-gray-500">{message}</p>
      </div>
    </div>
  )
}
