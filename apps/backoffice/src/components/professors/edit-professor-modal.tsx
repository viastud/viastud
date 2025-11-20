import { zodResolver } from '@hookform/resolvers/zod'
import type { ProfessorDto } from '@viastud/server/routers/professor_router'
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
import type { EditProfessorSchema } from '@viastud/utils'
import { editProfessorSchema, subject, SubjectEnum } from '@viastud/utils'
import { Edit2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface IEditProfessorModalProps extends BaseFormModalProps {
  professor: ProfessorDto
}

export const EditProfessorModal = ({ professor, refresh }: IEditProfessorModalProps) => {
  const [open, setOpen] = useState(false)
  const editProfessorForm = useForm<EditProfessorSchema>({
    resolver: zodResolver(editProfessorSchema),
    defaultValues: {
      id: professor.id,
      firstName: professor.firstName,
      lastName: professor.lastName,
      email: professor.email,
      phoneNumber: professor.phoneNumber,
    },
  })

  const { mutateAsync: editProfessorMutation } = trpc.professor.edit.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
    },
  })

  const onSubmit = async (data: EditProfessorSchema) => {
    await editProfessorMutation(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="none" size="icon">
          <Edit2 className="size-4" color="#3347FF" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...editProfessorForm}>
          <form onSubmit={editProfessorForm.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-950">
                Modifier un professeur
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-start gap-4 self-stretch py-4">
              <FormField
                control={editProfessorForm.control}
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
                control={editProfessorForm.control}
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
                control={editProfessorForm.control}
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
                control={editProfessorForm.control}
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
                control={editProfessorForm.control}
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
                <Button variant="outline" className="">
                  <p className="text-sm font-semibold text-blue-800">Annuler</p>
                </Button>
              </DialogClose>
              <Button variant="default" className="flex grow" type="submit">
                <p className="text-sm font-semibold">Éditer</p>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
