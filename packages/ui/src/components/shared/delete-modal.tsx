import { Trash2 } from 'lucide-react'

import { Button } from '#components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#components/ui/dialog'

interface DeleteModalProps {
  title: string
  onSubmit: () => void
  open: boolean
  setOpen: (open: boolean) => void
}

export const DeleteModal = ({ title, onSubmit, open, setOpen }: DeleteModalProps) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="none" size="icon">
          <Trash2 className="size-4" color="#DC2626" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-8">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-950">{title}</DialogTitle>
        </DialogHeader>
        <DialogFooter className="gap-6">
          <DialogClose asChild className="flex grow">
            <Button variant="outline" className="">
              <p className="text-sm font-semibold text-blue-800">Annuler</p>
            </Button>
          </DialogClose>
          <Button variant="destructive" className="flex grow" onClick={onSubmit}>
            <p className="text-sm font-semibold">Supprimer</p>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
