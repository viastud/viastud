import { zodResolver } from '@hookform/resolvers/zod'
import { Cross2Icon } from '@radix-ui/react-icons'
import type { FileDto } from '@viastud/server/services/file_service'
import { type ContactSchema, contactSchema } from '@viastud/utils'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '#components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#components/ui/dialog'
import { FileInput } from '#components/ui/file-input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '#components/ui/form'
import { Input } from '#components/ui/input'
import { Textarea } from '#components/ui/textarea'
import { useUploadFile } from '#hooks/use-upload-file'
import { trpc } from '#lib/trpc'

export interface ContactModalProps {
  firstName: string
  lastName: string
  email: string
}

export function ContactModal({ firstName, lastName, email }: ContactModalProps) {
  const [open, setOpen] = useState<boolean>(false)
  const [images, setImages] = useState<FileDto[]>([])
  const { uploadFiles } = useUploadFile()

  const contactForm = useForm<ContactSchema>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: firstName,
      lastName: lastName,
      email: email,
      emailSubject: '',
      message: '',
    },
  })

  const { mutateAsync: contactMutation } = trpc.faq.contact.useMutation({
    onSuccess: () => {
      setOpen(false)
      setImages([])
      contactForm.reset()
    },
  })

  const onSubmit = async (data: ContactSchema) => {
    await uploadFiles(images)
    await contactMutation({
      ...data,
      images: images.map((image) => image.id),
    })
  }

  return (
    <div
      onClick={(event) => {
        event.stopPropagation()
      }}
    >
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="flex w-fit">Contactez-nous</Button>
        </DialogTrigger>
        <DialogContent>
          <Form {...contactForm}>
            <form onSubmit={contactForm.handleSubmit(onSubmit)}>
              <DialogHeader className="flex flex-row items-center justify-between">
                <DialogTitle className="text-xl font-bold text-gray-950">
                  Contactez-nous
                </DialogTitle>
                <DialogClose asChild>
                  <Button variant="none" className="h-6 w-6 p-0">
                    <Cross2Icon className="h-6 w-6" />
                  </Button>
                </DialogClose>
              </DialogHeader>
              <div className="flex flex-col items-start gap-4 self-stretch py-4">
                <FormField
                  control={contactForm.control}
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
                  control={contactForm.control}
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
                  control={contactForm.control}
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
                  control={contactForm.control}
                  name="emailSubject"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col">
                      <FormLabel className="text-sm font-medium text-gray-700">Objet</FormLabel>
                      <FormControl>
                        <Input className="w-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={contactForm.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col">
                      <FormLabel className="text-sm font-medium text-gray-700">Message</FormLabel>
                      <FormControl>
                        <Textarea className="w-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex w-full flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Pièces jointes
                  </label>
                  <FileInput
                    accept=".svg, .jpg, .jpeg, .png, .gif"
                    files={images}
                    setFiles={setImages}
                    multiple
                  />
                </div>
              </div>
              <DialogFooter className="gap-4">
                <Button variant="default" className="flex grow text-sm font-semibold" type="submit">
                  Envoyer
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
