import { Button } from '@viastud/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@viastud/ui/dialog'

interface CancelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isLoading: boolean
}

export function CancelDialog({ open, onOpenChange, onConfirm, isLoading }: CancelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Annuler mon abonnement</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-600">
          Êtes-vous sûr de vouloir annuler votre abonnement ? Vous conserverez l&apos;accès
          jusqu&apos;à la fin de votre période actuelle.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
            }}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Annulation...' : 'Confirmer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
