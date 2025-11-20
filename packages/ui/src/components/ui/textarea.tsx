import { useEffect, useRef, useState } from 'react'

import { cn } from '#lib/utils'

interface UseAutosizeTextAreaProps {
  minHeight?: number
  maxHeight?: number
  triggerAutoSize: string
}

const useAutosizeTextArea = ({
  triggerAutoSize,
  maxHeight = Number.MAX_SAFE_INTEGER,
  minHeight = 0,
}: UseAutosizeTextAreaProps) => {
  const [init, setInit] = useState(true)
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  useEffect(() => {
    const offsetBorder = 6
    const textAreaElement = textAreaRef.current
    if (textAreaElement) {
      if (init) {
        textAreaElement.style.minHeight = `${minHeight + offsetBorder}px`
        if (maxHeight > minHeight) {
          textAreaElement.style.maxHeight = `${maxHeight}px`
        }
        setInit(false)
      }
      textAreaElement.style.height = `${minHeight + offsetBorder}px`
      const scrollHeight = textAreaElement.scrollHeight
      if (scrollHeight > maxHeight) {
        textAreaElement.style.height = `${maxHeight}px`
      } else {
        textAreaElement.style.height = `${scrollHeight + offsetBorder}px`
      }
    }
  }, [init, maxHeight, minHeight, triggerAutoSize])

  return textAreaRef
}

export interface TextareaProps extends React.ComponentProps<'textarea'> {
  error?: boolean
  maxHeight?: number
  minHeight?: number
  autoresize?: boolean
}

export const Textarea = ({
  maxHeight = Number.MAX_SAFE_INTEGER,
  minHeight = 52,
  className,
  onChange,
  value,
  error,
  autoresize = true,
  ...props
}: TextareaProps) => {
  const [triggerAutoSize, setTriggerAutoSize] = useState('')

  const textAreaRef = useAutosizeTextArea({
    triggerAutoSize: triggerAutoSize,
    maxHeight,
    minHeight,
  })

  useEffect(() => {
    if (autoresize) {
      setTriggerAutoSize(value as string)
    }
  }, [props?.defaultValue, value, autoresize])

  return (
    <textarea
      {...props}
      value={value}
      ref={textAreaRef}
      className={cn(
        'shadow-custom flex min-h-[60px] w-full rounded-2xl border border-neutral-200 bg-transparent px-3 py-2 text-base placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:border-neutral-800 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300',
        {
          'border-red-500 focus-visible:ring-red-500': error,
        },
        className
      )}
      onChange={(e) => {
        if (autoresize) {
          setTriggerAutoSize(e.target.value)
        }
        onChange?.(e)
      }}
    />
  )
}
Textarea.displayName = 'Textarea'
