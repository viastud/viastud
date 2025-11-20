import { zodResolver } from '@hookform/resolvers/zod'
import type { FileDto } from '@viastud/server/services/file_service'
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
import { FileInput } from '@viastud/ui/file-input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@viastud/ui/form'
import { useUploadFile } from '@viastud/ui/hooks/use-upload-file'
import { trpc } from '@viastud/ui/lib/trpc'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@viastud/ui/select'
import type { BaseFormModalProps } from '@viastud/ui/types/base-form-modal'
import { LoaderCircle, PlusIcon } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const addSummarizedSheetSchema = z.object({
  moduleId: z.string().min(1, 'Le module est requis'),
})

type AddSummarizedSheetSchema = z.infer<typeof addSummarizedSheetSchema>

export const AddSummarizedSheetModal = ({ refresh }: BaseFormModalProps) => {
  const [open, setOpen] = useState(false)
  const [summarizedSheetFiles, setSummarizedSheetFiles] = useState<FileDto[]>([])
  const [isPending, startTransition] = useTransition()
  const modulesData = trpc.module.getAllWithoutSummarizedSheets.useQuery()
  const modules = modulesData.data ?? []

  const addSummarizedSheetForm = useForm<AddSummarizedSheetSchema>({
    resolver: zodResolver(addSummarizedSheetSchema),
    defaultValues: {
      moduleId: '',
    },
  })

  const { uploadFiles } = useUploadFile()

  const { mutateAsync: addSummarizedSheetMutation } = trpc.summarizedSheet.create.useMutation({
    onSuccess: async () => {
      setOpen(false)
      refresh()
      await modulesData.refetch()
      addSummarizedSheetForm.reset()
      setSummarizedSheetFiles([])
    },
  })

  const onSubmit = async (data: AddSummarizedSheetSchema) => {
    startTransition(async () => {
      await uploadFiles([...summarizedSheetFiles])

      await addSummarizedSheetMutation({
        moduleId: Number(data.moduleId),
        summarizedSheet: summarizedSheetFiles.length > 0 ? summarizedSheetFiles[0].id : null,
      })
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-9 min-w-9 rounded-full p-0">
          <PlusIcon className="size-4" color="#1D2CB6" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...addSummarizedSheetForm}>
          <form onSubmit={addSummarizedSheetForm.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-950">
                Ajouter une fiche résumée
              </DialogTitle>
            </DialogHeader>
            <div className="flex w-full items-start py-4">
              <div className="flex w-full flex-col items-start gap-4 self-stretch">
                <FormField
                  control={addSummarizedSheetForm.control}
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
                  <p className="text-sm font-medium text-gray-700">Fiche résumée (PDF)</p>
                  <FileInput
                    id="summarized-sheet-file-input"
                    accept=".pdf"
                    files={summarizedSheetFiles}
                    setFiles={setSummarizedSheetFiles}
                    multiple={false}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-4">
              <DialogClose asChild className="flex grow">
                <Button variant="outline">
                  <p className="text-sm font-semibold text-blue-800">Annuler</p>
                </Button>
              </DialogClose>
              <Button
                variant="default"
                disabled={isPending}
                className="flex grow gap-2"
                type="submit"
              >
                <p className="text-sm font-semibold">Ajouter</p>
                {isPending && <LoaderCircle className="h-4 w-4 animate-spin" />}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
