import { FrontmatterBlock } from '@myst-theme/frontmatter'
import { Theme, ThemeProvider } from '@myst-theme/providers'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import type { FileDto } from '@viastud/server/services/file_service'
import { AlertTriangleIcon, LoaderCircleIcon } from 'lucide-react'
import { MyST as MystElement } from 'myst-to-react'
import { memo, Suspense, use } from 'react'

import { areListEquals } from '#lib/are-list-equals'
import { parse, RENDERERS, replaceImages } from '#lib/myst'
import { cn } from '#lib/utils'

interface MystRendererProps {
  parsedTextPromise: ReturnType<typeof parse>
  displayError?: boolean
  withHeader?: boolean
}

const MystRenderer = ({
  parsedTextPromise,
  withHeader,
  displayError = false,
}: MystRendererProps) => {
  const parsedText = use(parsedTextPromise)

  return (
    parsedText && (
      <ThemeProvider renderers={RENDERERS} theme={Theme.light} setTheme={() => {}}>
        {parsedText.warnings.length > 0 && displayError && (
          <div className="mb-4 flex w-full gap-4">
            {parsedText.warnings.map((m) => (
              <div
                key={m.line ?? m.name}
                className={cn('not-prose w-full p-1 text-white shadow-inner', {
                  'bg-red-500 dark:bg-red-800': m.fatal === true,
                  'bg-orange-500 dark:bg-orange-700': m.fatal === false,
                  'bg-slate-500 dark:bg-slate-800': m.fatal === null,
                })}
              >
                {m.fatal === true && (
                  <AlertTriangleIcon width="1.3rem" height="1.3rem" className="mr-1 inline" />
                )}
                {m.fatal === false && (
                  <ExclamationTriangleIcon width="1.3rem" height="1.3rem" className="mr-1 inline" />
                )}
                {m.fatal === null && (
                  <AlertTriangleIcon width="1.3rem" height="1.3rem" className="mr-1 inline" />
                )}
                <code>{m.ruleId ?? m.source}</code>: {m.message}
              </div>
            ))}
          </div>
        )}
        {withHeader && <FrontmatterBlock frontmatter={parsedText.frontmatter} className="mt-4" />}
        <MystElement ast={parsedText.references.article?.children} />
      </ThemeProvider>
    )
  )
}

interface MystProps {
  text: string
  displayError?: boolean
  withHeader?: boolean
  images: FileDto[]
}

const Myst = ({ text, images, ...props }: MystProps) => {
  const newParsedText = parse(replaceImages(text, images))

  return (
    <div className="article w-full px-4">
      <Suspense fallback={<LoaderCircleIcon className="mx-auto my-auto h-5 w-5 animate-spin" />}>
        <MystRenderer {...props} parsedTextPromise={newParsedText} />
      </Suspense>
    </div>
  )
}

const MemoizedMyst = memo(
  Myst,
  (prev, next) => prev.text === next.text && areListEquals(prev.images, next.images)
)

export { MemoizedMyst as Myst, MystRenderer }
