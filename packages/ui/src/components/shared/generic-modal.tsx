import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@viastud/ui/dialog'
import { X } from 'lucide-react'

import { Button } from '#components/ui/button'

interface ModalProps {
  title: string
  description: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm?: () => void
  onCancel?: () => void
  details?: string
  onCancelText?: string
  onConfirmText?: string
  customContent?: React.ReactNode
  shouldHideCloseBtn?: boolean
  width?: number
  preventClose?: boolean
}
export const GenericModal = ({
  title,
  description,
  open,
  onOpenChange,
  onConfirm = () => {
    onOpenChange(false)
  },
  onCancel,
  details,
  onConfirmText,
  onCancelText,
  customContent,
  shouldHideCloseBtn,
  width,
  preventClose,
}: ModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{ width: width ?? 'auto' }}
        onEscapeKeyDown={
          preventClose
            ? (e) => {
                e.preventDefault()
              }
            : undefined
        }
        onInteractOutside={
          preventClose
            ? (e) => {
                e.preventDefault()
              }
            : undefined
        }
      >
        <DialogHeader>
          <DialogTitle className="max-w-[90%] text-xl font-bold text-gray-900">{title}</DialogTitle>
          {!shouldHideCloseBtn && !preventClose && (
            <DialogClose asChild>
              <Button
                variant="default"
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" fill="white" color="white" />
              </Button>
            </DialogClose>
          )}
        </DialogHeader>
        {description && (
          <div className="mt-4 whitespace-pre-wrap text-base text-gray-700">{description}</div>
        )}
        {details && <div className="mt-4 whitespace-pre-wrap text-sm text-gray-700">{details}</div>}
        {customContent}
        <div className="mt-6 flex justify-center space-x-4">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="flex-1 px-4 py-2" size="lg">
              {onCancelText ?? 'Annuler'}
            </Button>
          )}
          <Button
            variant="default"
            onClick={onConfirm}
            className="flex-1 bg-green-500 px-4 py-2 text-white hover:bg-green-600"
            size="lg"
          >
            {onConfirmText ?? 'Confirmer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
