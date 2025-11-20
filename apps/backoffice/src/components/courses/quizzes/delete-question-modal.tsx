import type { QuestionDto } from '@viastud/server/routers/question_router'
import { Button } from '@viastud/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@viastud/ui/dialog'
import { trpc } from '@viastud/ui/lib/trpc'
import { Myst } from '@viastud/ui/shared/myst'
import type { BaseFormModalProps } from '@viastud/ui/types/base-form-modal'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'

interface IDeleteExerciceModalProps extends BaseFormModalProps {
  question: QuestionDto
}
export const DeleteQuestionModal = ({ question, refresh }: IDeleteExerciceModalProps) => {
  const [open, setOpen] = useState(false)
  const { mutateAsync: deleteQuestionMutation } = trpc.question.delete.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
    },
  })

  const onSubmit = async () => {
    await deleteQuestionMutation(question.id)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="none" size="icon">
          <Trash2 className="size-4" color="#DC2626" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-8">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-950">
            Êtes-vous sûr de vouloir supprimer la question suivante ?
            <Myst text={question.title} images={[]} />
          </DialogTitle>
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
