import type { NodeRenderer } from '@myst-theme/providers'
import { InfoCircledIcon } from '@radix-ui/react-icons'
import { EyeIcon, FileTextIcon, SearchIcon } from 'lucide-react'
import type { GenericNode } from 'myst-common'
import type { Admonition as AdmonitionSpec } from 'myst-spec'
import { MyST } from 'myst-to-react'
import type React from 'react'

import { cn } from '#lib/utils'

import { HashLink } from './hash-link'

enum ProofKind {
  proof = 'proof',
  axiom = 'axiom',
  lemma = 'lemma',
  definition = 'definition',
  criterion = 'criterion',
  remark = 'remark',
  conjecture = 'conjecture',
  corollary = 'corollary',
  algorithm = 'algorithm',
  example = 'example',
  property = 'property',
  observation = 'observation',
  proposition = 'proposition',
  assumption = 'assumption',
  theorem = 'theorem',
}

const proofLabels: Record<ProofKind, string> = {
  proof: 'Démonstration',
  axiom: 'Axiome',
  lemma: 'Lemme',
  definition: 'Définition',
  criterion: 'Critère',
  remark: 'Remarque',
  conjecture: 'Conjecture',
  corollary: 'Corollaire',
  algorithm: 'Algorithme',
  example: 'Exemple',
  property: 'Propriété',
  observation: 'Observation',
  proposition: 'Proposition',
  assumption: 'Hypothèse',
  theorem: 'Théorème',
}

function ProofIcon({ kind, className }: { kind: ProofKind; className?: string }) {
  const opts = {
    className: cn('w-5 h-5 shrink-0', className),
  }
  switch (kind) {
    case ProofKind.definition:
      return <InfoCircledIcon {...opts} />
    case ProofKind.example:
      return <SearchIcon {...opts} />
    case ProofKind.observation:
    case ProofKind.proof:
      return <EyeIcon {...opts} />
    default:
      return <FileTextIcon {...opts} />
  }
}

type Color = 'gray' | 'blue-gray' | 'blue' | 'yellow' | 'orange'

function getClasses(className?: string) {
  const classes =
    className
      ?.split(' ')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => !!s) ?? []
  return [...new Set(classes)]
}

function getColor({ kind }: { kind?: ProofKind | string; classes?: string[] }): {
  color: Color
} {
  switch (kind) {
    case ProofKind.criterion:
    case ProofKind.definition:
    case ProofKind.proposition:
    case ProofKind.remark:
      return { color: 'blue' }
    case ProofKind.corollary:
    case ProofKind.property:
    case ProofKind.algorithm:
    case ProofKind.lemma:
    case ProofKind.conjecture:
    case ProofKind.theorem:
      return { color: 'orange' }
    case ProofKind.observation:
    case ProofKind.assumption:
    case ProofKind.axiom:
      return { color: 'yellow' }
    case ProofKind.proof:
    case ProofKind.example:
      return { color: 'blue-gray' }
    default:
      return { color: 'blue' }
  }
}

export function Proof({
  title,
  kind,
  color,
  dropdown,
  children,
  identifier,
  enumerator,
}: {
  title?: React.ReactNode
  color?: Color
  kind: ProofKind
  children: React.ReactNode
  dropdown?: boolean
  identifier?: string
  enumerator?: string
}) {
  return (
    <div id={identifier} className="shadow-custom my-5 overflow-hidden rounded-lg">
      <div
        className={cn(
          'm-0 flex min-w-0 items-center gap-1 break-words px-4 py-2 font-bold text-gray-950',
          {
            'bg-yellow-300': color === 'yellow',
            'bg-blue-500 text-white': color === 'blue',
            'bg-blue-200': color === 'blue-gray',
            'bg-blue-100': color === 'gray',
            'bg-yellow-400': color === 'orange',
          }
        )}
      >
        <ProofIcon kind={kind} className="mr-1" />
        <HashLink id={identifier} className="font-bold">
          {proofLabels[kind]} {enumerator}
        </HashLink>
        {title && <>({title})</>}
      </div>
      <div className={cn('px-4', { 'details-body': dropdown })}>{children}</div>
    </div>
  )
}

export const ProofRenderer: NodeRenderer<AdmonitionSpec> = ({ node }) => {
  const [title, ...rest] = node.children as GenericNode[]
  const classes = getClasses(node.class)
  const { color } = getColor({ kind: node.kind, classes })
  const isDropdown = classes.includes('dropdown')

  const useTitle = title.type === 'admonitionTitle'

  return (
    <Proof
      identifier={node.html_id}
      title={useTitle ? <MyST ast={[title]} /> : undefined}
      kind={node.kind as ProofKind}
      enumerator={node.enumerator}
      color={color}
      dropdown={isDropdown}
    >
      {useTitle ? <MyST ast={rest} /> : <MyST ast={node.children} />}
    </Proof>
  )
}
