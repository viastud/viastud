import type { NodeRenderer } from '@myst-theme/providers'
import { InfoCircledIcon, LightningBoltIcon } from '@radix-ui/react-icons'
import {
  AlertTriangleIcon,
  ArrowRightCircleIcon,
  CircleXIcon,
  LightbulbIcon,
  MegaphoneIcon,
  PencilIcon,
} from 'lucide-react'
import type { GenericNode } from 'myst-common'
import { AdmonitionKind } from 'myst-common'
import type {
  Admonition as AdmonitionSpec,
  AdmonitionTitle as AdmonitionTitleSpec,
} from 'myst-spec'
import { MyST } from 'myst-to-react'
import type React from 'react'

import { cn } from '#lib/utils'

type Color = 'blue' | 'green' | 'red' | 'orange'
interface ColorAndKind {
  kind: AdmonitionKind
  color: Color
}

function getClasses(className?: string) {
  const classes =
    className
      ?.split(' ')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => !!s) ?? []
  return [...new Set(classes)]
}

function getFirstKind({
  kind,
  classes = [],
}: {
  kind?: AdmonitionKind | string
  classes?: string[]
}): ColorAndKind {
  if (kind === AdmonitionKind.note || classes.includes('note')) {
    return { kind: AdmonitionKind.note, color: 'blue' }
  }
  if (kind === AdmonitionKind.important || classes.includes('important')) {
    return { kind: AdmonitionKind.important, color: 'blue' }
  }
  if (kind === AdmonitionKind.hint || classes.includes('hint')) {
    return { kind: AdmonitionKind.hint, color: 'green' }
  }
  if (kind === AdmonitionKind.seealso || classes.includes('seealso')) {
    return { kind: AdmonitionKind.seealso, color: 'green' }
  }
  if (kind === AdmonitionKind.tip || classes.includes('tip')) {
    return { kind: AdmonitionKind.tip, color: 'green' }
  }
  if (kind === AdmonitionKind.attention || classes.includes('attention')) {
    return { kind: AdmonitionKind.attention, color: 'orange' }
  }
  if (kind === AdmonitionKind.warning || classes.includes('warning')) {
    return { kind: AdmonitionKind.warning, color: 'orange' }
  }
  if (kind === AdmonitionKind.caution || classes.includes('caution')) {
    return { kind: AdmonitionKind.caution, color: 'orange' }
  }
  if (kind === AdmonitionKind.danger || classes.includes('danger')) {
    return { kind: AdmonitionKind.danger, color: 'red' }
  }
  if (kind === AdmonitionKind.error || classes.includes('error')) {
    return { kind: AdmonitionKind.error, color: 'red' }
  }
  return { kind: AdmonitionKind.note, color: 'blue' }
}

function AdmonitionIcon({ kind, className }: { kind: AdmonitionKind; className?: string }) {
  const opts = {
    className: cn('w-5 h-5 shrink-0', className),
  }
  switch (kind) {
    case AdmonitionKind.note:
      return <InfoCircledIcon {...opts} />
    case AdmonitionKind.caution:
    case AdmonitionKind.warning:
    case AdmonitionKind.danger:
      return <AlertTriangleIcon {...opts} />
    case AdmonitionKind.error:
      return <CircleXIcon {...opts} />
    case AdmonitionKind.attention:
      return <MegaphoneIcon {...opts} />
    case AdmonitionKind.tip:
      return <PencilIcon {...opts} />
    case AdmonitionKind.hint:
      return <LightbulbIcon {...opts} />
    case AdmonitionKind.important:
      return <LightningBoltIcon {...opts} />
    case AdmonitionKind.seealso:
      return <ArrowRightCircleIcon {...opts} />
    default:
      return <AlertTriangleIcon {...opts} />
  }
}

export const AdmonitionTitle: NodeRenderer<AdmonitionTitleSpec> = ({ node }) => {
  return <MyST ast={node.children} />
}

export function Admonition({
  title,
  kind,
  color,
  children,
  className,
}: {
  title?: React.ReactNode
  color?: Color
  kind: AdmonitionKind
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'my-5 flex items-start gap-2 rounded-lg p-4',
        {
          'bg-blue-50': color === 'blue',
          'bg-green-50': color === 'green',
          'bg-[#FFEDD5]': color === 'orange',
          'bg-red-50': color === 'red',
        },
        className
      )}
    >
      <AdmonitionIcon kind={kind} className="mt-1" />
      <div>
        <span className="font-bold">{title} :</span> {children}
      </div>
    </div>
  )
}

export const AdmonitionRenderer: NodeRenderer<AdmonitionSpec> = ({ node }) => {
  const [title, body, ...rest] = node.children as GenericNode[]
  const classes = getClasses(node.class)
  const { kind, color } = getFirstKind({ kind: node.kind, classes })

  return (
    <Admonition title={<MyST ast={[title]} />} kind={kind} color={color} className={cn(classes)}>
      <MyST ast={body.children} />
      <MyST ast={rest} />
    </Admonition>
  )
}
