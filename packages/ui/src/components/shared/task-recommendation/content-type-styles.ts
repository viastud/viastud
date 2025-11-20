import { BookOpen, Play, Star } from 'lucide-react'

export const contentTypeStyles = {
  sheet: {
    color: 'bg-blue-600 hover:bg-blue-700 text-white',
    cardBg: 'bg-blue-50', // light blue background
    cardBorder: 'border-blue-400', // blue border
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    icon: BookOpen,
    label: 'Fiche',
  },
  quiz: {
    color: 'bg-yellow-400 hover:bg-yellow-500 text-gray-900',
    cardBg: 'bg-yellow-50',
    cardBorder: 'border-yellow-400',
    button: 'bg-yellow-400 hover:bg-yellow-500 text-gray-900',
    icon: Star,
    label: 'Quiz',
  },
  exercise: {
    color: 'bg-violet-600 hover:bg-violet-700 text-white',
    cardBg: 'bg-violet-50',
    cardBorder: 'border-violet-400',
    button: 'bg-violet-600 hover:bg-violet-700 text-white',
    icon: Play,
    label: 'Exercice',
  },
} as const

export type ContentType = keyof typeof contentTypeStyles
