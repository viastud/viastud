import { zodResolver } from '@hookform/resolvers/zod'
import type { ChapterDto } from '@viastud/server/routers/chapter'
import type { ModuleDto } from '@viastud/server/routers/module_router'
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
  type EditModuleSchema,
  editModuleSchema,
  grade,
  GradeEnum,
  subject,
  SubjectEnum,
} from '@viastud/utils'
import { Edit2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface IEditModuleModalProps extends BaseFormModalProps {
  module: ModuleDto
  chapters: ChapterDto[]
}

export const EditModuleModal = ({ module, chapters, refresh }: IEditModuleModalProps) => {
  const [open, setOpen] = useState(false)
  const editModuleForm = useForm<EditModuleSchema>({
    resolver: zodResolver(editModuleSchema),
    defaultValues: {
      id: module.id.toString(),
      name: module.name,
      grade: module.grade,
      subject: module.subject,
      chapterId: module.chapter?.id?.toString() ?? '',
    },
  })

  const { mutateAsync: editModuleMutation } = trpc.module.edit.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
    },
  })

  const onSubmit = async (data: EditModuleSchema) => {
    await editModuleMutation(data)
  }

  return (
    <Form {...editModuleForm}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="none">
            <Edit2 className="size-4" color="#3347FF" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-950">
              Modifier un module
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-start gap-4 self-stretch py-4">
            <FormField
              control={editModuleForm.control}
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
              control={editModuleForm.control}
              name="grade"
              render={({ field }) => (
                <FormItem className="flex w-full flex-col">
                  <FormLabel className="text-sm font-medium text-gray-700">Classe</FormLabel>
                  <Select onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={GradeEnum[module.grade]} />
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
              control={editModuleForm.control}
              name="subject"
              render={({ field }) => (
                <FormItem className="flex w-full flex-col">
                  <FormLabel className="text-sm font-medium text-gray-700">Matière</FormLabel>
                  <Select onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={SubjectEnum[module.subject]} />
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
              control={editModuleForm.control}
              name="chapterId"
              render={({ field }) => (
                <FormItem className="flex w-full flex-col">
                  <FormLabel className="text-sm font-medium text-gray-700">Chapitre</FormLabel>
                  <Select onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={module.chapter?.name} />
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
            <Button
              variant="default"
              className="flex grow"
              onClick={editModuleForm.handleSubmit(onSubmit)}
            >
              <p className="text-sm font-semibold">Éditer</p>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  )
}
