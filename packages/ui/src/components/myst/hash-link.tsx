import { useXRefState } from '@myst-theme/providers'
import type { MouseEventHandler, ReactNode } from 'react'

import { cn } from '#lib/utils'

export interface HashLinkBehavior {
  scrollBehavior?: ScrollBehavior
  historyState?: 'replace' | 'push' | null
  focusTarget?: boolean
}

function openDetails(el: HTMLElement | null) {
  if (!el) return
  if (el.nodeName === 'DETAILS') {
    ;(el as HTMLDetailsElement).open = true
  }
  openDetails(el.parentElement)
}

function scrollToElement(
  el: HTMLElement | null,
  {
    htmlId = el?.id,
    scrollBehavior = 'smooth',
    historyState = 'replace',
    focusTarget = true,
  }: {
    /** Update the URL fragment to this ID */
    htmlId?: string
  } & HashLinkBehavior = {}
) {
  if (!el) return
  openDetails(el)
  el.scrollIntoView({ behavior: scrollBehavior })
  if (historyState === 'push') {
    history.pushState(undefined, '', `#${htmlId}`)
  } else if (historyState === 'replace') {
    history.replaceState(undefined, '', `#${htmlId}`)
  }
  if (focusTarget) {
    // Changes keyboard tab-index location
    if (el.tabIndex === -1) el.tabIndex = -1
    el.focus({ preventScroll: true })
  }
}

export function HashLink({
  id,
  children = '¶',
  canSelectText = false,
  hover,
  className = '',
  hideInPopup,
  scrollBehavior,
  historyState,
  focusTarget,
}: {
  id?: string
  hover?: boolean
  children?: ReactNode
  canSelectText?: boolean
  className?: string
  hideInPopup?: boolean
} & HashLinkBehavior) {
  const { inCrossRef } = useXRefState()
  if (inCrossRef || !id) {
    // If we are in a cross-reference pop-out, either hide hash link
    // or return something that is **not** a link
    return hideInPopup ? null : <span className={cn('select-none', className)}>{children}</span>
  }
  const scroll: MouseEventHandler<HTMLAnchorElement> = (evt) => {
    evt.preventDefault()
    const el = document.getElementById(id)
    scrollToElement(el, { scrollBehavior, historyState, focusTarget })
  }
  return (
    <a
      className={cn('text-inherit no-underline hover:text-inherit', className, {
        'select-none': !canSelectText,
        'opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-70': hover,
        'hover:underline': !hover,
      })}
      onClick={scroll}
      href={`#${id}`}
      title="lien vers l'élément"
      aria-label="lien vers l'élément"
    >
      {children}
    </a>
  )
}
