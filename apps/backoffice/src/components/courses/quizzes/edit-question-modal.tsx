import { zodResolver } from '@hookform/resolvers/zod'
import type { ModuleDto } from '@viastud/server/routers/module_router'
import type { QuestionDto } from '@viastud/server/routers/question_router'
import type { FileDto } from '@viastud/server/services/file_service'
import { Button } from '@viastud/ui/button'
import { Checkbox } from '@viastud/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@viastud/ui/dialog'
import { FileInput } from '@viastud/ui/file-input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@viastud/ui/form'
import { useUploadFile } from '@viastud/ui/hooks/use-upload-file'
import { trpc } from '@viastud/ui/lib/trpc'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@viastud/ui/select'
import { Myst } from '@viastud/ui/shared/myst'
import { Textarea } from '@viastud/ui/textarea'
import type { BaseFormModalProps } from '@viastud/ui/types/base-form-modal'
import { type EditQuestionSchema, editQuestionSchema } from '@viastud/utils'
import { Edit2, PlusIcon, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'

interface IEditQuestionModalProps extends BaseFormModalProps {
  modules: ModuleDto[]
  question: QuestionDto
}

export const EditQuestionModal = ({ modules, question, refresh }: IEditQuestionModalProps) => {
  const [open, setOpen] = useState<boolean>(false)
  const [images, setImages] = useState<FileDto[]>(question.images)
  const editQuestionForm = useForm<EditQuestionSchema>({
    resolver: zodResolver(editQuestionSchema),
    defaultValues: {
      id: question.id,
      moduleId: question.module.id.toString(),
      title: question.title,
      detailedAnswer: question.detailedAnswer,
      isMultipleChoice: question.isMultipleChoice,
      answers: question.answers,
      images: question.images.map((image) => image.id.toString()),
    },
  })

  const {
    fields: answers,
    append,
    remove,
  } = useFieldArray({
    control: editQuestionForm.control,
    name: 'answers',
  })

  const { uploadFiles } = useUploadFile()

  const { mutateAsync: editQuestionMutation } = trpc.question.edit.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
      editQuestionForm.reset()
    },
  })

  const onSubmit = async (data: EditQuestionSchema) => {
    const imagesToUpload = images.filter((image) => !question.images.find((i) => i.id === image.id))
    await uploadFiles(imagesToUpload)
    await editQuestionMutation(data)
  }

  function handleFileUpload(files: FileDto[]) {
    setImages(files)
    editQuestionForm.setValue(
      'images',
      files.map((file) => file.id.toString())
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="none" size="icon">
          <Edit2 className="size-4" color="#3347FF" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw]">
        <Form {...editQuestionForm}>
          <form onSubmit={editQuestionForm.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-950">
                Éditer une question
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-start gap-4 self-stretch py-4">
              <FileInput
                accept=".jpg, .jpeg, .png, .svg"
                files={images}
                setFiles={handleFileUpload}
                multiple
              />
              <FormField
                control={editQuestionForm.control}
                name="moduleId"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col">
                    <FormLabel className="text-sm font-medium text-gray-700">Module</FormLabel>
                    <Select onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={question.module.name} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {modules.map((module) => (
                          <SelectItem key={module.id} value={module.id.toString()}>
                            {module.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex w-full flex-col space-y-2">
                <p className="text-sm font-medium text-gray-700">Type de question</p>
                <div className="ransition-colors flex h-9 w-full items-center justify-between rounded-3xl border border-neutral-200 bg-transparent px-3 py-1">
                  <p className="text-sm">Question à choix multiples</p>
                  <FormField
                    control={editQuestionForm.control}
                    name="isMultipleChoice"
                    render={({ field }) => (
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
              </div>
              <div className="flex w-full">
                <FormField
                  control={editQuestionForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="flex flex-1 flex-col">
                      <FormLabel className="text-sm font-medium text-gray-700">Question</FormLabel>
                      <FormControl>
                        <Textarea
                          className="h-10 w-full"
                          placeholder="Intitulé de la question"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex-1">
                  <Myst text={editQuestionForm.watch('title')} images={images} displayError />
                </div>
              </div>
              <div className="flex w-full">
                <FormField
                  control={editQuestionForm.control}
                  name="detailedAnswer"
                  render={({ field }) => (
                    <FormItem className="flex flex-1 flex-col">
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Réponse détaillée
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          className="w-full"
                          placeholder="Réponse détaillée à la question"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex-1">
                  <Myst
                    text={editQuestionForm.watch('detailedAnswer')}
                    images={images}
                    displayError
                  />
                </div>
              </div>
              <FormField
                control={editQuestionForm.control}
                name="answers"
                render={({ formState, fieldState }) => (
                  <div className="flex w-full flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">Réponses</p>
                      <Button
                        variant="default"
                        className="h-6 w-6 rounded-full p-0"
                        type="button"
                        onClick={() => {
                          append({
                            content: '',
                            isRightAnswer: false,
                          })
                        }}
                      >
                        <PlusIcon className="size-4" />
                      </Button>
                    </div>
                    <FormControl>
                      <div className="flex w-full flex-col gap-2">
                        {answers.map((field, index) => (
                          <div className="flex flex-col gap-1" key={field.id}>
                            <div className="flex w-full items-center gap-2">
                              <div className="flex w-full">
                                <Textarea
                                  placeholder={`Réponse n° ${index + 1}`}
                                  key={field.id}
                                  onChange={(e) => {
                                    editQuestionForm.setValue(
                                      `answers.${index}.content`,
                                      e.target.value
                                    )
                                  }}
                                  value={editQuestionForm.watch(`answers`, answers)[index].content}
                                  className="flex-1"
                                />
                                <div className="flex-1">
                                  <Myst
                                    text={editQuestionForm.watch(`answers`, answers)[index].content}
                                    images={images}
                                    displayError
                                  />
                                </div>
                              </div>
                              <div className="flex flex-col items-center gap-1 rounded-2xl">
                                <p className="text-center text-xs text-gray-700">Bonne réponse</p>
                                <Checkbox
                                  defaultChecked={
                                    editQuestionForm.watch(`answers`, answers)[index].isRightAnswer
                                  }
                                  onCheckedChange={(checked: boolean) => {
                                    editQuestionForm.setValue(
                                      `answers.${index}.isRightAnswer`,
                                      checked
                                    )
                                  }}
                                />
                              </div>
                              <div className="flex flex-col items-center gap-1 rounded-2xl">
                                <Trash2
                                  className="size-4 cursor-pointer"
                                  type="button"
                                  color="#DC2626"
                                  onClick={() => {
                                    remove(index)
                                  }}
                                />
                              </div>
                            </div>
                            <p className="text-xs text-red-500">
                              {formState.errors.answers?.[index]?.content?.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <p className="text-xs text-red-500">{formState.errors.root?.message}</p>
                    <p className="text-xs text-red-500">{fieldState.error?.message}</p>
                  </div>
                )}
              />
            </div>
            <DialogFooter className="gap-4">
              <DialogClose asChild className="flex grow">
                <Button variant="outline">
                  <p className="text-sm font-semibold text-blue-800">Annuler</p>
                </Button>
              </DialogClose>
              <Button variant="default" className="flex grow" type="submit">
                <p className="text-sm font-semibold">Modifier</p>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
