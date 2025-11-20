import { Button } from '@viastud/ui/button'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog'

interface ConfirmLeaveModalProps {
  open: boolean
  title: string
  cancel?: () => void
  confirm?: () => void
}

export function ConfirmLeaveModal({ open, title, cancel, confirm }: ConfirmLeaveModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="flex flex-col gap-8">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-950">{title}</DialogTitle>
        </DialogHeader>
        <DialogFooter className="gap-6">
          <Button variant="outline" className="flex grow" onClick={cancel}>
            <p className="text-sm font-semibold text-blue-800">Annuler</p>
          </Button>
          <Button className="flex grow" onClick={confirm}>
            <p className="text-sm font-semibold">Continuer</p>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
