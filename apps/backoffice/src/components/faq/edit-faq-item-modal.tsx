import { zodResolver } from '@hookform/resolvers/zod'
import type { FaqItemDto } from '@viastud/server/routers/faq_router'
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
import { trpc } from '@viastud/ui/lib/trpc'
import { RadioGroup, RadioGroupItem } from '@viastud/ui/radio-group'
import { Textarea } from '@viastud/ui/textarea'
import type { BaseFormModalProps } from '@viastud/ui/types/base-form-modal'
import type { EditFaqItemSchema } from '@viastud/utils'
import { editFaqItemSchema, faqQuestionCategory, faqQuestionCategoryEnum } from '@viastud/utils'
import { Edit2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface IEditFaqItemModalProps extends BaseFormModalProps {
  faqItem: FaqItemDto
}

export const EditFaqItemModal = ({ faqItem, refresh }: IEditFaqItemModalProps) => {
  const editFaqItemForm = useForm<EditFaqItemSchema>({
    resolver: zodResolver(editFaqItemSchema),
    defaultValues: {
      id: faqItem.id,
      question: faqItem.question,
      answer: faqItem.answer,
      category: faqItem.category,
    },
  })

  const [open, setOpen] = useState(false)

  const { mutateAsync: editFaqItemMutation } = trpc.faq.edit.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
      editFaqItemForm.reset()
    },
  })

  const onSubmit = async (data: EditFaqItemSchema) => {
    await editFaqItemMutation(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="none">
          <Edit2 className="size-4" color="#3347FF" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...editFaqItemForm}>
          <form onSubmit={editFaqItemForm.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-950">
                Modifier une question / réponse
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-start gap-4 self-stretch py-4">
              <FormField
                control={editFaqItemForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col">
                    <FormLabel className="text-sm font-medium text-gray-700">Catégorie</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        className="flex gap-4"
                        defaultValue={faqItem.category}
                      >
                        {faqQuestionCategory.map((faqItem) => (
                          <div className="flex items-center gap-2" key={faqItem}>
                            <RadioGroupItem value={faqItem} />
                            <p className="text-sm font-medium text-gray-700">
                              {faqQuestionCategoryEnum[faqItem]}
                            </p>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editFaqItemForm.control}
                name="question"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col">
                    <FormLabel className="text-sm font-medium text-gray-700">Question</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ajoutez votre question"
                        className="w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editFaqItemForm.control}
                name="answer"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col">
                    <FormLabel className="text-sm font-medium text-gray-700">Réponse</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ajoutez votre réponse" className="w-full" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="gap-4">
              <DialogClose asChild className="flex grow">
                <Button variant="outline" className="text-sm font-semibold text-blue-800">
                  Annuler
                </Button>
              </DialogClose>
              <Button variant="default" className="flex grow text-sm font-semibold" type="submit">
                Ajouter
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
