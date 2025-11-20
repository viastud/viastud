import { zodResolver } from '@hookform/resolvers/zod'
import type { ChapterDto } from '@viastud/server/routers/chapter'
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@viastud/ui/form'
import { Input } from '@viastud/ui/input'
import { trpc } from '@viastud/ui/lib/trpc'
import type { BaseFormModalProps } from '@viastud/ui/types/base-form-modal'
import type { EditChapterSchema } from '@viastud/utils'
import { editChapterSchema } from '@viastud/utils'
import { Edit2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface IEditChapterModalProps extends BaseFormModalProps {
  chapter: ChapterDto
}

export const EditChapterModal = ({ refresh, chapter }: IEditChapterModalProps) => {
  const editChapterForm = useForm<EditChapterSchema>({
    resolver: zodResolver(editChapterSchema),
    defaultValues: {
      id: chapter.id,
      name: chapter.name,
    },
  })
  const [open, setOpen] = useState(false)

  const { mutateAsync: editChapterMutation } = trpc.chapter.edit.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
      editChapterForm.reset()
    },
  })

  const onSubmit = async (data: EditChapterSchema) => {
    await editChapterMutation(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="none">
          <Edit2 className="size-4" color="#3347FF" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...editChapterForm}>
          <form onSubmit={editChapterForm.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-950">
                Éditer un chapitre
              </DialogTitle>
            </DialogHeader>
            <div className="flex w-full items-start py-4">
              <div className="flex-2 flex flex-col items-start gap-4 self-stretch">
                <FormField
                  control={editChapterForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col">
                      <FormLabel className="text-sm font-medium text-gray-700">Nom</FormLabel>
                      <FormControl>
                        <Input className="w-full" placeholder="Nom de l'exercice" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogFooter className="gap-4">
              <DialogClose asChild className="flex">
                <Button variant="outline">
                  <p className="text-sm font-semibold text-blue-800">Annuler</p>
                </Button>
              </DialogClose>
              <Button variant="default" type="submit">
                <p className="text-sm font-semibold">Ajouter</p>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
