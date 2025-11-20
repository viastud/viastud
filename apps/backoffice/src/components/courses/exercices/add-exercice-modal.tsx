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
import { useRenderPdf } from '@viastud/ui/hooks/use-render-pdf'
import { useUploadFile } from '@viastud/ui/hooks/use-upload-file'
import { Input } from '@viastud/ui/input'
import { latexToMyst } from '@viastud/ui/lib/myst'
import { trpc } from '@viastud/ui/lib/trpc'
import { cn } from '@viastud/ui/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@viastud/ui/select'
import { Myst } from '@viastud/ui/shared/myst'
import { MystDownload } from '@viastud/ui/shared/myst-download'
import type { BaseFormModalProps } from '@viastud/ui/types/base-form-modal'
import { addExerciceSchema } from '@viastud/utils'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

interface IAddExerciceModalProps extends BaseFormModalProps {
  modules: ModuleDto[]
}

export const AddExerciceModal = ({ refresh, modules }: IAddExerciceModalProps) => {
  const addExerciceForm = useForm<z.input<typeof addExerciceSchema>>({
    resolver: zodResolver(addExerciceSchema),
    defaultValues: {
      name: '',
      type: 'application',
      content: '',
      isCorrection: false,
    },
  })
  const [open, setOpen] = useState(false)
  const [images, setImages] = useState<FileDto[]>([])
  const type = addExerciceForm.watch('type')
  const { data: chaptersData, isLoading: isChaptersLoading } = trpc.chapter.getAll.useQuery(
    undefined,
    { enabled: open && type === 'bilan' }
  )
  const chapters = chaptersData ?? []

  const { uploadFiles, uploadFile } = useUploadFile()

  const {
    pdfRef: exercicePdfRef,
    toPDF: generateExercicePDF,
    isPending: isExerciceUploadPending,
  } = useRenderPdf({
    fileName: addExerciceForm.watch('name'),
    margin: 10,
  })

  const { mutateAsync: addExerciceMutation } = trpc.exercice.create.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
      addExerciceForm.reset()
    },
  })

  const onSubmit = async (data: z.input<typeof addExerciceSchema>) => {
    await uploadFiles(images)
    const exercicePdf = await generateExercicePDF()
    await uploadFile(exercicePdf)
    await addExerciceMutation({
      ...data,
      images: images.map((file) => file.id),
      exercicePdfId: exercicePdf.id,
    })
  }

  const handleFileUpload = async (content: string, fileExtension?: string) => {
    if (fileExtension === 'tex') {
      addExerciceForm.setValue('content', await latexToMyst(content))
    } else {
      addExerciceForm.setValue('content', content)
    }
  }

  const exerciceContent = addExerciceForm.watch('content')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-9 min-w-9 rounded-full p-0">
          <PlusIcon className="size-4" color="#1D2CB6" />
        </Button>
      </DialogTrigger>
      <DialogContent className={cn({ 'max-w-[90vw]': exerciceContent })}>
        <Form {...addExerciceForm}>
          <form onSubmit={addExerciceForm.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-950">
                Ajouter un exercice
              </DialogTitle>
            </DialogHeader>
            <div className="flex w-full items-start py-4">
              <div className="flex-2 flex flex-col items-start gap-4 self-stretch">
                <FormField
                  control={addExerciceForm.control}
                  name="isCorrection"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-row items-center gap-2">
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Est une correction
                      </FormLabel>
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={addExerciceForm.control}
                  name="content"
                  render={() => (
                    <FormItem className="flex w-full flex-col">
                      <FileInput
                        accept=".md, .tex, .jpg, .jpeg, .png, .svg"
                        onTextFileUpload={handleFileUpload}
                        files={images}
                        setFiles={setImages}
                        multiple
                      />
                      {!exerciceContent && <FormMessage />}
                    </FormItem>
                  )}
                />
                <FormField
                  control={addExerciceForm.control}
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
                <FormField
                  control={addExerciceForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col">
                      <FormLabel className="text-sm font-medium text-gray-700">Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le type d'exercice" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="application">Exercices d&apos;application</SelectItem>
                          <SelectItem value="training">Exercices d&apos;entraînement</SelectItem>
                          <SelectItem value="bilan">Exercices bilan</SelectItem>
                        </SelectContent>
                        <FormMessage />
                      </Select>
                    </FormItem>
                  )}
                />
                {addExerciceForm.watch('type') === 'bilan' ? (
                  <FormField
                    control={addExerciceForm.control}
                    name="chapterId"
                    render={({ field }) => (
                      <FormItem className="flex w-full flex-col">
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Chapitre
                        </FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner le chapitre associé" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {!isChaptersLoading && chapters.length === 0 ? (
                              <SelectItem value="__none" disabled>
                                Aucun chapitre
                              </SelectItem>
                            ) : (
                              chapters.map((chapter) => (
                                <SelectItem key={chapter.id} value={chapter.id.toString()}>
                                  {chapter.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                          <FormMessage />
                        </Select>
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={addExerciceForm.control}
                    name="moduleId"
                    render={({ field }) => (
                      <FormItem className="flex w-full flex-col">
                        <FormLabel className="text-sm font-medium text-gray-700">Module</FormLabel>
                        <Select onValueChange={field.onChange}>
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
                          <FormMessage />
                        </Select>
                      </FormItem>
                    )}
                  />
                )}
              </div>
              {exerciceContent && (
                <div className="flex-3">
                  <Myst text={exerciceContent} images={images} displayError />
                </div>
              )}
            </div>
            <DialogFooter className="gap-4">
              <DialogClose asChild className="flex">
                <Button variant="outline" className={cn({ grow: !exerciceContent })}>
                  <p className="text-sm font-semibold text-blue-800">Annuler</p>
                </Button>
              </DialogClose>
              <Button
                variant="default"
                className={cn({ grow: !exerciceContent })}
                type="submit"
                disabled={isExerciceUploadPending}
              >
                <p className="text-sm font-semibold">Ajouter</p>
              </Button>
            </DialogFooter>
          </form>
          <MystDownload text={exerciceContent} images={images} ref={exercicePdfRef} />
        </Form>
      </DialogContent>
    </Dialog>
  )
}
