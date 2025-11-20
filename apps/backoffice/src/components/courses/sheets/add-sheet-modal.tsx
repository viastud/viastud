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
import { useToast } from '@viastud/ui/hooks/use-toast'
import { useUploadFile } from '@viastud/ui/hooks/use-upload-file'
import { Input } from '@viastud/ui/input'
import { latexToMyst } from '@viastud/ui/lib/myst'
import { trpc } from '@viastud/ui/lib/trpc'
import { cn } from '@viastud/ui/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@viastud/ui/select'
import { Myst } from '@viastud/ui/shared/myst'
import { MystDownload } from '@viastud/ui/shared/myst-download'
import { Textarea } from '@viastud/ui/textarea'
import type { BaseFormModalProps } from '@viastud/ui/types/base-form-modal'
import { type AddSheetSchema, addSheetSchema, level, LevelEnum } from '@viastud/utils'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface IAddSheetModalProps extends BaseFormModalProps {
  modules: ModuleDto[]
}

export const AddSheetModal = ({ modules, refresh }: IAddSheetModalProps) => {
  const [open, setOpen] = useState(false)
  const [images, setImages] = useState<FileDto[]>([])
  const addSheetForm = useForm<AddSheetSchema>({
    resolver: zodResolver(addSheetSchema),
    defaultValues: {
      name: '',
      description: '',
      content: ' ',
      isVisible: false,
    },
  })

  const { uploadFiles, uploadFile } = useUploadFile()
  const { toast } = useToast()

  const {
    pdfRef: sheetPdfRef,
    toPDF: generateSheetPDF,
    isPending: isSheetUploadPending,
  } = useRenderPdf({
    fileName: addSheetForm.watch('name'),
    margin: 10,
  })

  const { mutateAsync: addSheetMutation } = trpc.sheet.create.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
      addSheetForm.reset()
    },
    onError: (error) => {
      if (error.data?.code === 'CONFLICT') {
        toast({
          title: 'Erreur',
          description:
            error.message || 'Une fiche avec le même module et le même niveau existe déjà.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Erreur',
          description: error.message || "Impossible d'ajouter la fiche.",
          variant: 'destructive',
        })
      }
    },
  })

  const onSubmit = async (data: AddSheetSchema) => {
    await uploadFiles(images)
    const sheetPdf = await generateSheetPDF()
    await uploadFile(sheetPdf)
    await addSheetMutation({
      ...data,
      images: images.map((file) => file.id),
      sheetPdfId: sheetPdf.id,
    })
  }

  const handleFileUpload = async (content: string, fileExtension?: string) => {
    if (fileExtension === 'tex') {
      addSheetForm.setValue('content', await latexToMyst(content))
    } else {
      addSheetForm.setValue('content', content)
    }
  }

  const sheetContent = addSheetForm.watch('content')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-9 min-w-9 rounded-full p-0">
          <PlusIcon className="size-4" color="#1D2CB6" />
        </Button>
      </DialogTrigger>
      <DialogContent className={cn({ 'max-w-[1600px]': sheetContent })}>
        <Form {...addSheetForm}>
          <form onSubmit={addSheetForm.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-950">
                Ajouter une fiche
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 items-start py-4">
              <div className="flex flex-1 flex-col items-start gap-4 self-stretch">
                <FileInput
                  accept=".md, .tex, .jpg, .jpeg, .png, .svg"
                  onTextFileUpload={handleFileUpload}
                  files={images}
                  setFiles={setImages}
                  multiple
                />
                <FormField
                  control={addSheetForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col">
                      <FormLabel className="text-sm font-medium text-gray-700">Nom</FormLabel>
                      <FormControl>
                        <Input className="w-full" placeholder="Nom de la fiche" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addSheetForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col">
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          className="w-full"
                          placeholder="Description de la fiche"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addSheetForm.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col">
                      <FormLabel className="text-sm font-medium text-gray-700">Niveau</FormLabel>
                      <Select onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le niveau associé" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {level.map((key) => (
                            <SelectItem key={key} value={key}>
                              {LevelEnum[key]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addSheetForm.control}
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
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex w-full flex-col space-y-2">
                  <p className="text-sm font-medium text-gray-700">Visibilité</p>
                  <div className="ransition-colors flex h-9 w-full items-center justify-between rounded-3xl border border-neutral-200 bg-transparent px-3 py-1">
                    <p className="text-sm">Visible par les utilisateurs</p>
                    <FormField
                      control={addSheetForm.control}
                      name="isVisible"
                      render={({ field }) => (
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                  </div>
                </div>
              </div>
              {sheetContent && (
                <div className="flex-3">
                  <Myst text={sheetContent} images={images} displayError />
                </div>
              )}
            </div>
            <DialogFooter className="gap-4">
              <DialogClose asChild className="flex">
                <Button variant="outline" className={cn({ grow: !sheetContent })}>
                  <p className="text-sm font-semibold text-blue-800">Annuler</p>
                </Button>
              </DialogClose>
              <Button
                variant="default"
                className={cn({ grow: !sheetContent })}
                type="submit"
                disabled={isSheetUploadPending}
              >
                <p className="text-sm font-semibold">Ajouter</p>
              </Button>
            </DialogFooter>
          </form>
          <MystDownload text={sheetContent} images={images} ref={sheetPdfRef} />
        </Form>
      </DialogContent>
    </Dialog>
  )
}
