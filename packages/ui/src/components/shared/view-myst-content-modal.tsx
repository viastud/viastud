import { DialogTitle } from '@radix-ui/react-dialog'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import type { FileDto } from '@viastud/server/services/file_service'
import { Button } from '@viastud/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@viastud/ui/dialog'
import { cn } from '@viastud/ui/lib/utils'
import { Myst } from '@viastud/ui/shared/myst'
import { Eye } from 'lucide-react'
import { useState } from 'react'

interface IViewMystContentModalProps {
  content: string
  images: FileDto[]
}
export const ViewMystContentModal = ({ content, images }: IViewMystContentModalProps) => {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="none" size="icon">
          <Eye className="size-4" color="#3347FF" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn('flex max-h-[90vh] w-full max-w-5xl flex-col items-center overflow-y-auto')}
      >
        <VisuallyHidden.Root>
          <DialogTitle>Myst modal</DialogTitle>
        </VisuallyHidden.Root>
        <div className="w-full">
          <Myst text={content} images={images} />
        </div>
        <Button
          onClick={() => {
            setOpen(false)
          }}
          className="mt-4 flex-shrink-0"
        >
          <p className="text-sm font-semibold">Fermer</p>
        </Button>
      </DialogContent>
    </Dialog>
  )
}
