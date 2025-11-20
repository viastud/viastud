import { zodResolver } from '@hookform/resolvers/zod'
import type { ModuleDto } from '@viastud/server/routers/module_router'
import type { SheetDto } from '@viastud/server/routers/sheet_router'
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
import { type EditSheetSchema, editSheetSchema, level, LevelEnum } from '@viastud/utils'
import { Edit2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface IEditSheetModalProps extends BaseFormModalProps {
  modules: ModuleDto[]
  sheet: SheetDto
}

export const EditSheetModal = ({ sheet, modules, refresh }: IEditSheetModalProps) => {
  const [open, setOpen] = useState(false)
  const [images, setImages] = useState<FileDto[]>(sheet.images)
  const editSheetForm = useForm<EditSheetSchema>({
    resolver: zodResolver(editSheetSchema),
    defaultValues: {
      id: sheet.id,
      name: sheet.name,
      description: sheet.description,
      moduleId: sheet.module.id.toString(),
      isVisible: sheet.isVisible,
      content: sheet.content,
      level: sheet.level,
    },
  })

  const { uploadFiles, uploadFile } = useUploadFile()
  const { toast } = useToast()
  const {
    pdfRef: sheetPdfRef,
    toPDF: generateSheetPDF,
    isPending: isSheetUploadPending,
  } = useRenderPdf({
    fileName: editSheetForm.watch('name'),
    margin: 10,
  })

  const { mutateAsync: editSheetMutation } = trpc.sheet.edit.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
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
          description: error.message || 'Impossible de modifier la fiche.',
          variant: 'destructive',
        })
      }
    },
  })

  const onSubmit = async (data: EditSheetSchema) => {
    const imagesToUpload = images.filter((image) => !sheet.images.find((i) => i.id === image.id))
    await uploadFiles(imagesToUpload)
    const sheetPdf = await generateSheetPDF()
    await uploadFile(sheetPdf)
    await editSheetMutation({
      ...data,
      images: images.map((file) => file.id),
      sheetPdfId: sheetPdf.id,
    })
  }

  const handleFileUpload = async (content: string, fileExtension?: string) => {
    if (fileExtension === 'tex') {
      editSheetForm.setValue('content', await latexToMyst(content))
    } else {
      editSheetForm.setValue('content', content)
    }
  }

  const sheetContent = editSheetForm.watch('content')
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="none" size="icon">
          <Edit2 className="size-4" color="#3347FF" />
        </Button>
      </DialogTrigger>
      <DialogContent className={cn({ 'max-w-[90vw]': sheetContent })}>
        <Form {...editSheetForm}>
          <form onSubmit={editSheetForm.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-950">
                Modifier une fiche
              </DialogTitle>
            </DialogHeader>
            <div className="flex w-full items-start py-4">
              <div className="flex-2 sticky top-0 flex flex-col items-start gap-4 self-stretch">
                <FileInput
                  accept=".md, .tex, .jpg, .jpeg, .png, .svg"
                  onTextFileUpload={handleFileUpload}
                  files={images}
                  setFiles={setImages}
                  multiple
                />
                <FormField
                  control={editSheetForm.control}
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
                  control={editSheetForm.control}
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
                  control={editSheetForm.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col">
                      <FormLabel className="text-sm font-medium text-gray-700">Niveau</FormLabel>
                      <Select onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={LevelEnum[sheet.level]} />
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
                  control={editSheetForm.control}
                  name="moduleId"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col">
                      <FormLabel className="text-sm font-medium text-gray-700">Module</FormLabel>
                      <Select onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={sheet.module.name} />
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
                      control={editSheetForm.control}
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
                <p className="text-sm font-semibold">Éditer</p>
              </Button>
            </DialogFooter>
          </form>
          <MystDownload text={sheetContent} images={images} ref={sheetPdfRef} />
        </Form>
      </DialogContent>
    </Dialog>
  )
}
