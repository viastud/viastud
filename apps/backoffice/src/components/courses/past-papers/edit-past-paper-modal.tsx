import type { PastPaperDto } from '@viastud/server/routers/past_paper_router'
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
import { useUploadFile } from '@viastud/ui/hooks/use-upload-file'
import { Input } from '@viastud/ui/input'
import { trpc } from '@viastud/ui/lib/trpc'
import type { BaseFormModalProps } from '@viastud/ui/types/base-form-modal'
import { Edit2, LoaderCircle } from 'lucide-react'
import { useState, useTransition } from 'react'
import { z } from 'zod'

interface IEditPastPaperModalProps extends BaseFormModalProps {
  pastPaper: PastPaperDto
}

const nameSchema = z.string().min(1, 'Le nom est requis')

export const EditPastPaperModal = ({ pastPaper, refresh }: IEditPastPaperModalProps) => {
  const [open, setOpen] = useState(false)
  const [pastPaperFiles, setPastPaperFiles] = useState<FileDto[]>(
    pastPaper.pastPaper ? [pastPaper.pastPaper] : []
  )
  const [correctionFiles, setCorrectionFiles] = useState<FileDto[]>(
    pastPaper.pastPaperCorrection ? [pastPaper.pastPaperCorrection] : []
  )
  const [name, setName] = useState(pastPaper.name)
  const [nameError, setNameError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const { uploadFiles } = useUploadFile()

  const { mutateAsync: editPastPaperMutation } = trpc.pastPaper.edit.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
    },
  })

  const onSubmit = async () => {
    const result = nameSchema.safeParse(name)
    if (!result.success) {
      setNameError(result.error.errors[0].message)
      return
    } else {
      setNameError(null)
    }
    startTransition(async () => {
      const pastPaperFilesToUpload = pastPaperFiles.filter(
        (file) => !pastPaper.pastPaper || file.id !== pastPaper.pastPaper.id
      )
      const correctionFilesToUpload = correctionFiles.filter(
        (file) => !pastPaper.pastPaperCorrection || file.id !== pastPaper.pastPaperCorrection.id
      )

      await uploadFiles([...pastPaperFilesToUpload, ...correctionFilesToUpload])

      await editPastPaperMutation({
        id: pastPaper.id,
        name,
        pastPaper: pastPaperFiles.length > 0 ? pastPaperFiles[0].id : null,
        pastPaperCorrection: correctionFiles.length > 0 ? correctionFiles[0].id : null,
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
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-950">
            Modifier un ancien sujet
          </DialogTitle>
        </DialogHeader>
        <div className="flex w-full items-start py-4">
          <div className="flex w-full flex-col items-start gap-4 self-stretch">
            <div className="flex w-full flex-col space-y-2">
              <p className="text-sm font-medium text-gray-700">Nom</p>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (nameError) setNameError(null)
                }}
                placeholder="Nom du sujet"
                required
              />
              {nameError && <span className="text-xs text-red-500">{nameError}</span>}
            </div>
            <div className="flex w-full flex-col space-y-2">
              <p className="text-sm font-medium text-gray-700">Sujet d&apos;examen (PDF)</p>
              <FileInput
                id="past-paper-file-input"
                accept=".pdf"
                files={pastPaperFiles}
                setFiles={setPastPaperFiles}
                multiple={false}
              />
            </div>

            <div className="flex w-full flex-col space-y-2">
              <p className="text-sm font-medium text-gray-700">Correction (PDF)</p>
              <FileInput
                id="correction-file-input"
                accept=".pdf"
                files={correctionFiles}
                setFiles={setCorrectionFiles}
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
            onClick={onSubmit}
          >
            <p className="text-sm font-semibold">Éditer</p>
            {isPending && <LoaderCircle className="h-4 w-4 animate-spin" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
