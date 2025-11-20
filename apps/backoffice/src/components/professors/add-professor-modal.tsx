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
import { PhoneInput } from '@viastud/ui/phone-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@viastud/ui/select'
import type { BaseFormModalProps } from '@viastud/ui/types/base-form-modal'
import { type AddProfessorSchema, addProfessorSchema, subject, SubjectEnum } from '@viastud/utils'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

export const AddProfessorModal = ({ refresh }: BaseFormModalProps) => {
  const addProfessorForm = useForm<AddProfessorSchema>({
    resolver: zodResolver(addProfessorSchema),
    defaultValues: {
      lastName: '',
      firstName: '',
      email: '',
      phoneNumber: '',
    },
  })

  const [open, setOpen] = useState(false)

  const { mutateAsync: addProfessorMutation } = trpc.professor.create.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
      addProfessorForm.reset()
    },
  })

  const onSubmit = async (data: AddProfessorSchema) => {
    await addProfessorMutation(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-9 min-w-9 rounded-full p-0">
          <PlusIcon className="size-4" color="#1D2CB6" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...addProfessorForm}>
          <form onSubmit={addProfessorForm.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-950">
                Ajouter un professeur
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-start gap-4 self-stretch py-4">
              <FormField
                control={addProfessorForm.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col">
                    <FormLabel className="text-sm font-medium text-gray-700">Nom</FormLabel>
                    <FormControl>
                      <Input className="w-full" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addProfessorForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col">
                    <FormLabel className="text-sm font-medium text-gray-700">Prénom</FormLabel>
                    <FormControl>
                      <Input className="w-full" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addProfessorForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Adresse e-mail
                    </FormLabel>
                    <FormControl>
                      <Input className="w-full" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addProfessorForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Numéro de téléphone
                    </FormLabel>
                    <FormControl>
                      <PhoneInput className="w-full" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addProfessorForm.control}
                name="subject"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col">
                    <FormLabel className="text-sm font-medium text-gray-700">Matière</FormLabel>
                    <Select onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner la matière associée" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subject.map((key) => (
                          <SelectItem key={key} value={key}>
                            {SubjectEnum[key]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
