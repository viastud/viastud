import { zodResolver } from '@hookform/resolvers/zod'
import type { ModuleDto } from '@viastud/server/routers/module_router'
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
import { type AddQuestionSchema, addQuestionSchema } from '@viastud/utils'
import { PlusIcon, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'

import { type ParsedQuestion, parseQuizMarkdown } from '@/lib/quiz_markdown_parser'

interface IAddQuestionModalProps extends BaseFormModalProps {
  modules: ModuleDto[]
}

export const AddQuestionModal = ({ modules, refresh }: IAddQuestionModalProps) => {
  const [open, setOpen] = useState<boolean>(false)
  const [images, setImages] = useState<FileDto[]>([])
  const [importedQuestions, setImportedQuestions] = useState<ParsedQuestion[]>([])
  const [currentImportedIndex, setCurrentImportedIndex] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const addQuestionForm = useForm<AddQuestionSchema>({
    resolver: zodResolver(addQuestionSchema),
    defaultValues: {
      title: '',
      detailedAnswer: '',
      isMultipleChoice: true,
      answers: [],
      images: [],
    },
  })

  const { uploadFiles } = useUploadFile()

  const {
    fields: answers,
    append,
    remove,
    replace,
  } = useFieldArray({
    control: addQuestionForm.control,
    name: 'answers',
  })

  const { mutateAsync: addQuestionMutation } = trpc.question.create.useMutation({
    onSuccess: () => {
      refresh()
    },
  })

  const onSubmit = async (data: AddQuestionSchema) => {
    await uploadFiles(images)
    await addQuestionMutation(data)
    setOpen(false)
    addQuestionForm.reset()
  }

  function handleFileUpload(files: FileDto[]) {
    setImages(files)
    addQuestionForm.setValue(
      'images',
      files.map((file) => file.id.toString())
    )
  }

  function loadQuestionToForm(question: ParsedQuestion) {
    addQuestionForm.setValue('title', question.title)
    addQuestionForm.setValue('detailedAnswer', question.detailedAnswer)
    addQuestionForm.setValue('isMultipleChoice', question.isMultipleChoice)
    replace(question.answers)
  }

  function persistCurrentFormIntoImported() {
    if (!importedQuestions.length) return
    const next = [...importedQuestions]
    const current: ParsedQuestion = {
      title: addQuestionForm.getValues('title'),
      detailedAnswer: addQuestionForm.getValues('detailedAnswer'),
      isMultipleChoice: addQuestionForm.getValues('isMultipleChoice'),
      answers: addQuestionForm.getValues('answers') as ParsedQuestion['answers'],
    }
    next[currentImportedIndex] = current
    setImportedQuestions(next)
  }

  function handleMarkdownUpload(fileContent: string) {
    const parsed = parseQuizMarkdown(fileContent)
    if (!parsed.length) return
    setImportedQuestions(parsed)
    setCurrentImportedIndex(0)
    // Prefill from the first so user sees something editable
    loadQuestionToForm(parsed[0])
  }

  const watchedModuleId = addQuestionForm.watch('moduleId')
  const canBulkCreate = useMemo(
    () => importedQuestions.length > 0 && !!watchedModuleId,
    [importedQuestions.length, watchedModuleId]
  )

  const handleBulkCreate = async () => {
    // Persist the currently viewed form back into the imported list before submit
    persistCurrentFormIntoImported()
    await uploadFiles(images)
    const moduleId = addQuestionForm.getValues('moduleId')
    if (!moduleId) return
    setIsSubmitting(true)
    try {
      for (const q of importedQuestions) {
        await addQuestionMutation({
          moduleId,
          title: q.title,
          detailedAnswer: q.detailedAnswer,
          isMultipleChoice: q.isMultipleChoice,
          images: addQuestionForm.getValues('images'),
          answers: q.answers,
        })
      }
      setOpen(false)
      setImportedQuestions([])
      addQuestionForm.reset()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-9 min-w-9 rounded-full p-0">
          <PlusIcon className="size-4" color="#1D2CB6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw]">
        <Form {...addQuestionForm}>
          <form onSubmit={addQuestionForm.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-950">
                Ajouter une question
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-start gap-4 self-stretch py-4">
              <FileInput
                accept=".jpg, .jpeg, .png, .svg, .md"
                files={images}
                setFiles={handleFileUpload}
                multiple
                onTextFileUpload={handleMarkdownUpload}
              />
              <FormField
                control={addQuestionForm.control}
                name="moduleId"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col">
                    <FormLabel className="text-sm font-medium text-gray-700">Module</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le module associé" />
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
                    control={addQuestionForm.control}
                    name="isMultipleChoice"
                    render={({ field }) => (
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
              </div>
              <div className="flex w-full">
                <FormField
                  control={addQuestionForm.control}
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
                  <Myst text={addQuestionForm.watch('title')} images={images} displayError />
                </div>
              </div>
              {importedQuestions.length > 0 && (
                <div className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 px-3 py-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Questions importées:</span>
                    <span>
                      {currentImportedIndex + 1} / {importedQuestions.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (currentImportedIndex === 0) return
                        persistCurrentFormIntoImported()
                        const nextIndex = currentImportedIndex - 1
                        setCurrentImportedIndex(nextIndex)
                        loadQuestionToForm(importedQuestions[nextIndex])
                      }}
                      disabled={currentImportedIndex === 0}
                    >
                      Précédent
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (currentImportedIndex >= importedQuestions.length - 1) return
                        persistCurrentFormIntoImported()
                        const nextIndex = currentImportedIndex + 1
                        setCurrentImportedIndex(nextIndex)
                        loadQuestionToForm(importedQuestions[nextIndex])
                      }}
                      disabled={currentImportedIndex >= importedQuestions.length - 1}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex w-full">
                <FormField
                  control={addQuestionForm.control}
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
                    text={addQuestionForm.watch('detailedAnswer')}
                    images={images}
                    displayError
                  />
                </div>
              </div>
              <FormField
                control={addQuestionForm.control}
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
                                  value={addQuestionForm.watch('answers')[index]?.content ?? ''}
                                  onChange={(e) => {
                                    addQuestionForm.setValue(
                                      `answers.${index}.content`,
                                      e.target.value
                                    )
                                  }}
                                  className="flex-1"
                                />
                                <div className="flex-1">
                                  <Myst
                                    text={addQuestionForm.watch(`answers`, answers)[index].content}
                                    images={images}
                                    displayError
                                  />
                                </div>
                              </div>
                              <div className="flex flex-col items-center gap-1 rounded-2xl">
                                <p className="text-center text-xs text-gray-700">Bonne réponse</p>
                                <Checkbox
                                  checked={
                                    addQuestionForm.watch(`answers.${index}.isRightAnswer`) ?? false
                                  }
                                  onCheckedChange={(checked: boolean) => {
                                    addQuestionForm.setValue(
                                      `answers.${index}.isRightAnswer`,
                                      checked
                                    )
                                  }}
                                />
                              </div>
                              <div className="flex flex-col items-center gap-1 rounded-2xl">
                                <Trash2
                                  className="size-4 cursor-pointer"
                                  color="#DC2626"
                                  type="button"
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
              <div className="relative flex grow">
                {isSubmitting && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/60">
                    <span className="text-sm font-medium text-gray-700">
                      Import des questions en cours…
                    </span>
                  </div>
                )}
                <Button
                  variant="default"
                  className="flex grow"
                  type="button"
                  disabled={!canBulkCreate || isSubmitting}
                  onClick={handleBulkCreate}
                >
                  <p className="text-sm font-semibold">Créer toutes les questions</p>
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
