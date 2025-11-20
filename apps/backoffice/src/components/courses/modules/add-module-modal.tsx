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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@viastud/ui/select'
import type { BaseFormModalProps } from '@viastud/ui/types/base-form-modal'
import {
  type AddModuleSchema,
  addModuleSchema,
  grade,
  GradeEnum,
  subject,
  SubjectEnum,
} from '@viastud/utils'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface IAddModuleModalProps extends BaseFormModalProps {
  chapters: ChapterDto[]
}

export const AddModuleModal = ({ refresh, chapters }: IAddModuleModalProps) => {
  const [open, setOpen] = useState(false)
  const addModuleForm = useForm<AddModuleSchema>({
    resolver: zodResolver(addModuleSchema),
    defaultValues: {
      name: '',
    },
  })

  const { mutateAsync: addModuleMutation } = trpc.module.create.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
      addModuleForm.reset()
    },
  })

  const onSubmit = async (data: AddModuleSchema) => {
    await addModuleMutation(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-ful min-h-9 min-w-9 p-0">
          <PlusIcon className="size-4" color="#1D2CB6" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...addModuleForm}>
          <form onSubmit={addModuleForm.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-950">
                Ajouter un module
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-start gap-4 self-stretch py-4">
              <FormField
                control={addModuleForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col">
                    <FormLabel className="text-sm font-medium text-gray-700">Nom</FormLabel>
                    <FormControl>
                      <Input className="w-full" placeholder="Nom du module" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addModuleForm.control}
                name="grade"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col">
                    <FormLabel className="text-sm font-medium text-gray-700">Classe</FormLabel>
                    <Select onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner la classe associée" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {grade.map((key) => (
                          <SelectItem key={key} value={key}>
                            {GradeEnum[key]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addModuleForm.control}
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
              <FormField
                control={addModuleForm.control}
                name="chapterId"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col">
                    <FormLabel className="text-sm font-medium text-gray-700">Chapitre</FormLabel>
                    <Select onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le chapitre associée" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {chapters.map((chapter) => (
                          <SelectItem key={`chapter_${chapter.id}`} value={chapter.id.toString()}>
                            {chapter.name}
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
                <p className="text-sm font-semibold">Ajouter</p>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
