import { ChevronUp } from 'lucide-react'
import { useEffect, useState } from 'react'

import { cn } from '../../lib/utils'
import { Button } from '../ui/button'

interface ScrollToTopProps {
  className?: string
  threshold?: number
}

export function ScrollToTop({ className, threshold = 300 }: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > threshold) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => {
      window.removeEventListener('scroll', toggleVisibility)
    }
  }, [threshold])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  if (!isVisible) return null

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      className={cn(
        'fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-blue-600 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:bg-blue-700',
        className
      )}
      aria-label="Retour en haut de la page"
    >
      <ChevronUp className="h-6 w-6" />
    </Button>
  )
}
