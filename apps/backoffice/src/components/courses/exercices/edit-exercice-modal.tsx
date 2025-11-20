import { zodResolver } from '@hookform/resolvers/zod'
import type { ExerciceDto } from '@viastud/server/routers/exercice_router'
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
import { editExerciceSchema } from '@viastud/utils'
import { Edit2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

interface IEditExerciceModalProps extends BaseFormModalProps {
  exercice: ExerciceDto
  modules: ModuleDto[]
}

export const EditExerciceModal = ({ exercice, refresh, modules }: IEditExerciceModalProps) => {
  const [open, setOpen] = useState(false)
  const [images, setImages] = useState<FileDto[]>(exercice.images)
  const { data: chaptersData } = trpc.chapter.getAll.useQuery()
  const chapters = chaptersData ?? []

  const editExerciceForm = useForm<z.input<typeof editExerciceSchema>>({
    resolver: zodResolver(editExerciceSchema),
    defaultValues: {
      id: exercice.id,
      name: exercice.name,
      moduleId: exercice.module?.id ? exercice.module.id.toString() : undefined,
      chapterId: exercice.chapter?.id ? exercice.chapter.id.toString() : undefined,
      type: exercice.type,
      content: exercice.content,
      isCorrection: exercice.isCorrection,
    },
  })

  const { uploadFiles, uploadFile } = useUploadFile()

  const {
    pdfRef: exercicePdfRef,
    toPDF: generateExercicePDF,
    isPending: isExerciceUploadPending,
  } = useRenderPdf({
    fileName: editExerciceForm.watch('name'),
    margin: 10,
  })

  const { mutateAsync: editExerciceMutation } = trpc.exercice.edit.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
    },
  })

  const onSubmit = async (data: z.input<typeof editExerciceSchema>) => {
    const imagesToUpload = images.filter((image) => !exercice.images.find((i) => i.id === image.id))
    await uploadFiles(imagesToUpload)
    const exercicePdf = await generateExercicePDF()
    await uploadFile(exercicePdf)
    await editExerciceMutation({
      ...data,
      images: images.map((file) => file.id),
      exercicePdfId: exercicePdf.id,
    })
  }

  const handleFileUpload = async (content: string, fileExtension?: string) => {
    if (fileExtension === 'tex') {
      editExerciceForm.setValue('content', await latexToMyst(content))
    } else {
      editExerciceForm.setValue('content', content)
    }
  }

  const exerciceContent = editExerciceForm.watch('content')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="none" size="icon">
          <Edit2 className="size-4" color="#3347FF" />
        </Button>
      </DialogTrigger>
      <DialogContent className={cn({ 'max-w-[90vw]': exerciceContent })}>
        <Form {...editExerciceForm}>
          <form onSubmit={editExerciceForm.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-950">
                Modifier un exercice
              </DialogTitle>
            </DialogHeader>
            <div className="flex w-full items-start py-4">
              <div className="flex-2 sticky top-0 flex flex-col items-start gap-4 self-stretch">
                <FormField
                  control={editExerciceForm.control}
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
                  control={editExerciceForm.control}
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
                  control={editExerciceForm.control}
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
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editExerciceForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col">
                      <FormLabel className="text-sm font-medium text-gray-700">Nom</FormLabel>
                      <FormControl>
                        <Input className="w/full" placeholder="Nom de l'exercice" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {editExerciceForm.watch('type') === 'bilan' ? (
                  <FormField
                    control={editExerciceForm.control}
                    name="chapterId"
                    render={({ field }) => (
                      <FormItem className="w/full flex flex-col">
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
                            {chapters.map((chapter) => (
                              <SelectItem key={chapter.id} value={chapter.id.toString()}>
                                {chapter.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={editExerciceForm.control}
                    name="moduleId"
                    render={({ field }) => (
                      <FormItem className="w/full flex flex-col">
                        <FormLabel className="text-sm font-medium text-gray-700">Module</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  exercice.module?.name ?? 'Sélectionner le module associé'
                                }
                              />
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
                )}
              </div>
              {exerciceContent && (
                <div className="flex-3">
                  <Myst text={exerciceContent} images={images} displayError />
                </div>
              )}
            </div>
            <DialogFooter className="gap-4">
              <DialogClose asChild className="flex grow">
                <Button variant="outline" className="text-sm font-semibold text-blue-800">
                  Annuler
                </Button>
              </DialogClose>
              <Button
                variant="default"
                className="flex grow text-sm font-semibold"
                type="submit"
                disabled={isExerciceUploadPending}
              >
                Éditer
              </Button>
            </DialogFooter>
          </form>
          <MystDownload text={exerciceContent} images={images} ref={exercicePdfRef} />
        </Form>
      </DialogContent>
    </Dialog>
  )
}
