import { Cross2Icon } from '@radix-ui/react-icons'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@viastud/ui/dialog'
import { StarIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '#components/ui/button'
import { trpc } from '#lib/trpc'

interface ModalProps {
  slotId: number
}
export const RatingProfessorModal = ({ slotId }: ModalProps) => {
  const [rating, setRating] = useState<number>(0)

  const [open, setOpen] = useState<boolean>(true)

  const { mutate: rateProfessor } = trpc.rating.createProfessorRatingByStudent.useMutation()

  const onConfirmRating = () => {
    rateProfessor({
      rating,
      slotId,
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[80vh] w-[1000px] max-w-[90%]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="max-w-[90%] text-xl font-bold text-gray-900">
            Notez le professeur
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="none" className="m-0 mt-0 h-6 w-6 justify-start p-0">
              <Cross2Icon className="h-6 w-6" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="flex gap-1 px-4">
          {[1, 2, 3, 4, 5].map((value) => (
            <div
              key={value}
              className="flex cursor-pointer gap-1"
              onClick={() => {
                setRating(value)
              }}
            >
              {rating >= value ? (
                <StarIcon color="#ECB306" fill="#ECB306" className="flex size-6 shrink-0" />
              ) : (
                <StarIcon color="#ECB306" className="flex size-6 shrink-0" />
              )}
            </div>
          ))}
        </div>
        <Button
          variant={rating === 0 ? 'secondary' : 'default'}
          disabled={rating === 0}
          onClick={onConfirmRating}
          className="mt-4 flex-1 px-4 py-2 font-bold"
          size="lg"
        >
          Valider la note
        </Button>
      </DialogContent>
    </Dialog>
  )
}
