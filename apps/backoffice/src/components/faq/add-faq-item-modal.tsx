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
import { trpc } from '@viastud/ui/lib/trpc'
import { RadioGroup, RadioGroupItem } from '@viastud/ui/radio-group'
import { Textarea } from '@viastud/ui/textarea'
import type { BaseFormModalProps } from '@viastud/ui/types/base-form-modal'
import {
  type AddFaqItemSchema,
  addFaqItemSchema,
  faqQuestionCategory,
  faqQuestionCategoryEnum,
} from '@viastud/utils'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

export const AddFaqItemModal = ({ refresh }: BaseFormModalProps) => {
  const addFaqItemForm = useForm<AddFaqItemSchema>({
    resolver: zodResolver(addFaqItemSchema),
    defaultValues: {
      question: '',
      answer: '',
      category: 'GENERAL',
    },
  })

  const [open, setOpen] = useState(false)

  const { mutateAsync: addFaqItemMutation } = trpc.faq.create.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
      addFaqItemForm.reset()
    },
  })

  const onSubmit = async (data: AddFaqItemSchema) => {
    await addFaqItemMutation(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-9 min-w-9 rounded-full p-0">
          <PlusIcon className="size-4" color="#1D2CB6" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...addFaqItemForm}>
          <form onSubmit={addFaqItemForm.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-950">
                Ajouter une question / réponse
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-start gap-4 self-stretch py-4">
              <FormField
                control={addFaqItemForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col">
                    <FormLabel className="text-sm font-medium text-gray-700">Catégorie</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        className="flex gap-4"
                        defaultValue="GENERAL"
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
                control={addFaqItemForm.control}
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
                control={addFaqItemForm.control}
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
