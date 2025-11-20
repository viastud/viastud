import { zodResolver } from '@hookform/resolvers/zod'
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
import type { AddChapterSchema } from '@viastud/utils'
import { addChapterSchema } from '@viastud/utils'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

export const AddChapterModal = ({ refresh }: BaseFormModalProps) => {
  const addChapterForm = useForm<AddChapterSchema>({
    resolver: zodResolver(addChapterSchema),
    defaultValues: {
      name: '',
    },
  })
  const [open, setOpen] = useState(false)

  const { mutateAsync: addChapterMutation } = trpc.chapter.create.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
      addChapterForm.reset()
    },
  })

  const onSubmit = async (data: AddChapterSchema) => {
    await addChapterMutation(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-9 min-w-9 rounded-full p-0">
          <PlusIcon className="size-4" color="#1D2CB6" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...addChapterForm}>
          <form onSubmit={addChapterForm.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-950">
                Ajouter un chapitre
              </DialogTitle>
            </DialogHeader>
            <div className="flex w-full items-start py-4">
              <div className="flex-2 flex flex-col items-start gap-4 self-stretch">
                <FormField
                  control={addChapterForm.control}
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
