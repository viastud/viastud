import { NoDataSvg } from '@viastud/ui/assets/no-data-svg'
import { Badge } from '@viastud/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@viastud/ui/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@viastud/ui/card'
import { trpc } from '@viastud/ui/lib/trpc'
import { EmptyState } from '@viastud/ui/shared/empty-state'
import type { Grade } from '@viastud/utils'
import { GradeEnum } from '@viastud/utils'
import { Download } from 'lucide-react'
import { useMemo } from 'react'

function extractYearFromText(text: string | null | undefined): number | undefined {
  if (!text) return undefined
  const match = /\b(20[0-9]{2})\b/.exec(text)
  if (match) return Number(match[1])
  return undefined
}

function getYearForPastPaper(input: {
  name?: string | null
  pastPaper?: { name?: string | null } | null
  pastPaperCorrection?: { name?: string | null } | null
}): number {
  const candidates: string[] = []
  if (typeof input.name === 'string' && input.name.length > 0) candidates.push(input.name)
  if (typeof input.pastPaper?.name === 'string' && input.pastPaper.name.length > 0)
    candidates.push(input.pastPaper.name)
  if (
    typeof input.pastPaperCorrection?.name === 'string' &&
    input.pastPaperCorrection.name.length > 0
  )
    candidates.push(input.pastPaperCorrection.name)

  for (const value of candidates) {
    const year = extractYearFromText(value)
    if (year) return year
  }
  // Default to 2025 if no year found
  return 2025
}

function toFriendlyTitle(raw: string | null | undefined): string {
  const source = typeof raw === 'string' ? raw : 'Document'
  const base = source
    .replace(/\.[a-zA-Z0-9]+$/u, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

  const replacements: [RegExp, string][] = [
    [/\bspe\b|\bspecialite\b/u, 'Spécialité'],
    [/\bmetropole\b/u, 'Métropole'],
    [/\bmathematique(s)?\b/u, 'Mathématiques'],
    [/\banglais\b/u, 'Anglais'],
    [/\bphysique(\s*chimie)?\b/u, 'Physique-Chimie'],
    [/\bsvt\b/u, 'SVT'],
    [/\bsujet(\s*officiel)?\b/u, 'Sujet'],
    [/\bcorrection\b/u, 'Correction'],
    [/\bj(\s*)?1\b/iu, 'J1'],
    [/\bj(\s*)?2\b/iu, 'J2'],
  ]

  let friendly = base
  for (const [pattern, value] of replacements) {
    friendly = friendly.replace(pattern, value)
  }

  // Capitalize words
  friendly = friendly
    .split(' ')
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')

  return friendly
}

function removeDiacritics(input: string): string {
  return input.normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

function normalizeToken(input: string): string {
  const base = removeDiacritics(input).toLowerCase().trim()
  return base.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function extractMatiere(text: string | null | undefined): string | undefined {
  if (!text) return undefined
  const t = removeDiacritics(text).toLowerCase()
  if (/(mathematique|mathématiques|maths)/.test(t)) return 'mathematiques'
  if (/(physique\s*-?\s*chimie|physique)/.test(t)) return 'physique-chimie'
  if (/\bsvt\b/.test(t)) return 'svt'
  if (t.includes('anglais')) return 'anglais'
  return undefined
}

function extractVille(text: string | null | undefined): string | undefined {
  if (!text) return undefined
  const t = removeDiacritics(text).toLowerCase()
  const m = /metropole\s*-?\s*(\d+)/.exec(t)
  if (m) return `metropole-${m[1]}`
  if (t.includes('metropole')) return 'metropole'
  return undefined
}

function toUniformTitle(args: {
  raw: string | null | undefined
  fallback?: string | null | undefined
  kind: 'sujet' | 'correction'
}): string {
  const candidates = [args.raw, args.fallback]
  let year: number | undefined
  let matiere: string | undefined
  let ville: string | undefined
  for (const c of candidates) {
    year ??= extractYearFromText(c)
    matiere ??= extractMatiere(c ?? undefined)
    ville ??= extractVille(c ?? undefined)
  }
  const safeYear = year ?? 2025
  const safeMatiere = matiere ? normalizeToken(matiere) : ''
  const safeVille = ville ? normalizeToken(ville) : ''
  const safeKind = normalizeToken(args.kind)
  const tokens = [safeKind, safeMatiere, safeVille, String(safeYear)].filter((t) => t !== '')
  return tokens.join('_')
}

export function PastPaperRessource({ grade }: { grade: Grade }) {
  const pastPapersQuery = trpc.pastPaper.getAll.useQuery()

  const pastPapers = useMemo(() => pastPapersQuery.data ?? [], [pastPapersQuery.data])
  const isLoading = pastPapersQuery.isLoading
  const groupedByYear = useMemo(() => {
    const groups = new Map<number, typeof pastPapers>()
    for (const p of pastPapers) {
      const year = getYearForPastPaper({
        name: p.name,
        pastPaper: p.pastPaper ? { name: p.pastPaper.name } : null,
        pastPaperCorrection: p.pastPaperCorrection ? { name: p.pastPaperCorrection.name } : null,
      })
      const arr = groups.get(year) ?? []
      arr.push(p)
      groups.set(year, arr)
    }
    return Array.from(groups.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, items]) => ({ year, items }))
  }, [pastPapers])
  return (
    <div className="flex w-4/5 flex-col items-stretch gap-4 pt-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/ressources">Ressources</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to={`/ressources/${grade.toLowerCase()}`}>
              {GradeEnum[grade]}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Annales de bac</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <p className="text-2xl font-extrabold text-gray-950">Annales de bac</p>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-gray-500">Chargement des ressources...</p>
          </div>
        </div>
      ) : pastPapers.length > 0 ? (
        <div className="flex flex-col gap-6">
          {groupedByYear.map(({ year, items }) => (
            <Card key={year} className="border-blue-100">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-xl font-extrabold text-gray-950">{year}</CardTitle>
                {year >= new Date().getFullYear() && (
                  <Badge className="rounded-full bg-green-500/90 text-white">Nouveau</Badge>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {items.map((pastPaper) => {
                  const friendlyName = toFriendlyTitle(pastPaper.name)
                  return (
                    <div
                      key={pastPaper.id}
                      className="rounded-xl border border-neutral-200 bg-white p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-lg font-semibold text-gray-950">{friendlyName}</p>
                        <Badge variant="secondary" className="rounded-full">
                          Annales
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-2">
                        {pastPaper.pastPaper ? (
                          <a
                            href={pastPaper.pastPaper.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-gray-900 transition hover:bg-neutral-100"
                          >
                            <span className="flex items-center gap-2">
                              <span className="h-8 w-8 rounded-lg bg-blue-500/90"></span>
                              {toUniformTitle({
                                raw: pastPaper.pastPaper.name,
                                fallback: pastPaper.name,
                                kind: 'sujet',
                              })}
                            </span>
                            <Download className="h-4 w-4 opacity-70 transition group-hover:opacity-100" />
                          </a>
                        ) : (
                          <span className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-gray-400">
                            <span className="flex items-center gap-2">
                              <span className="h-8 w-8 rounded-lg bg-neutral-200"></span>
                              Aucun
                            </span>
                          </span>
                        )}
                        {pastPaper.pastPaperCorrection ? (
                          <a
                            href={pastPaper.pastPaperCorrection.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-gray-900 transition hover:bg-neutral-100"
                          >
                            <span className="flex items-center gap-2">
                              <span className="h-8 w-8 rounded-lg bg-emerald-500/90"></span>
                              {toUniformTitle({
                                raw: pastPaper.pastPaperCorrection.name,
                                fallback: pastPaper.name,
                                kind: 'correction',
                              })}
                            </span>
                            <Download className="h-4 w-4 opacity-70 transition group-hover:opacity-100" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          image={<NoDataSvg />}
          title="Cette matière arrive bientôt !"
          message={
            <>
              Nous travaillons actuellement sur le contenu pour <strong>Annales de bac</strong>.
            </>
          }
        />
      )}
    </div>
  )
}
