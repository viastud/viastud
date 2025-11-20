import type { FileDto } from '@viastud/server/services/file_service'
import { LoaderCircleIcon } from 'lucide-react'
import { memo, Suspense } from 'react'

import { MystRenderer } from '#components/shared/myst'
import { parse, replaceImages } from '#lib/myst'

interface MystDownloadProps extends React.ComponentProps<'div'> {
  text: string
  images: FileDto[]
}
const MystDownload = ({ text, images, ref }: MystDownloadProps) => {
  const newParsedText = parse(replaceImages(text, images))

  return (
    <div className="article clipped download w-[56rem] px-4" ref={ref}>
      <Suspense fallback={<LoaderCircleIcon className="mx-auto my-auto h-5 w-5 animate-spin" />}>
        <MystRenderer parsedTextPromise={newParsedText} withHeader />
      </Suspense>
    </div>
  )
}

const MemoizedMystDownload = memo(MystDownload, (prev, next) => prev.text === next.text)

export { MemoizedMystDownload as MystDownload }
