import { zodResolver } from '@hookform/resolvers/zod'
import type { ModuleDto } from '@viastud/server/routers/module_router'
import type { SummarizedSheetDto } from '@viastud/server/routers/summarized_sheet_router'
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
import { Form } from '@viastud/ui/form'
import { useUploadFile } from '@viastud/ui/hooks/use-upload-file'
import { trpc } from '@viastud/ui/lib/trpc'
import type { BaseFormModalProps } from '@viastud/ui/types/base-form-modal'
import { Edit2, LoaderCircle } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const editSummarizedSheetSchema = z.object({
  id: z.string(),
})

type EditSummarizedSheetSchema = z.infer<typeof editSummarizedSheetSchema>

interface IEditSummarizedSheetModalProps extends BaseFormModalProps {
  summarizedSheet: SummarizedSheetDto
  modules: ModuleDto[]
}

export const EditSummarizedSheetModal = ({
  summarizedSheet,
  refresh,
}: IEditSummarizedSheetModalProps) => {
  const [open, setOpen] = useState(false)
  const [summarizedSheetFiles, setSummarizedSheetFiles] = useState<FileDto[]>(
    summarizedSheet.summarizedSheet ? [summarizedSheet.summarizedSheet] : []
  )
  const [isPending, startTransition] = useTransition()

  const editSummarizedSheetForm = useForm<EditSummarizedSheetSchema>({
    resolver: zodResolver(editSummarizedSheetSchema),
    defaultValues: {
      id: summarizedSheet.id,
    },
  })

  const { uploadFiles } = useUploadFile()

  const { mutateAsync: editSummarizedSheetMutation } = trpc.summarizedSheet.edit.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
    },
  })

  const onSubmit = async (data: EditSummarizedSheetSchema) => {
    startTransition(async () => {
      const summarizedSheetFilesToUpload = summarizedSheetFiles.filter(
        (file) => !summarizedSheet.summarizedSheet || file.id !== summarizedSheet.summarizedSheet.id
      )

      await uploadFiles([...summarizedSheetFilesToUpload])

      await editSummarizedSheetMutation({
        id: data.id,
        summarizedSheet: summarizedSheetFiles.length > 0 ? summarizedSheetFiles[0].id : null,
      })
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="none" size="icon">
          <Edit2 className="size-4" color="#3347FF" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...editSummarizedSheetForm}>
          <form onSubmit={editSummarizedSheetForm.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-950">
                Modifier la fiche résumée - {summarizedSheet.module.name}
              </DialogTitle>
            </DialogHeader>
            <div className="flex w-full items-start py-4">
              <div className="flex w-full flex-col items-start gap-4 self-stretch">
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
                <p className="text-sm font-semibold">Éditer</p>
                {isPending && <LoaderCircle className="h-4 w-4 animate-spin" />}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
