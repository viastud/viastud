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
import { LoaderCircle, PlusIcon } from 'lucide-react'
import { useState, useTransition } from 'react'
import { z } from 'zod'

const nameSchema = z.string().min(1, 'Le nom est requis')

export const AddPastPaperModal = ({ refresh }: BaseFormModalProps) => {
  const [open, setOpen] = useState(false)
  const [pastPaperFiles, setPastPaperFiles] = useState<FileDto[]>([])
  const [correctionFiles, setCorrectionFiles] = useState<FileDto[]>([])
  const [name, setName] = useState('')
  const [isPending, startTransition] = useTransition()
  const [nameError, setNameError] = useState<string | null>(null)

  const { uploadFiles } = useUploadFile()

  const { mutateAsync: addPastPaperMutation } = trpc.pastPaper.create.useMutation({
    onSuccess: async () => {
      setOpen(false)
      refresh()
      setPastPaperFiles([])
      setCorrectionFiles([])
      setName('')
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
      await uploadFiles([...pastPaperFiles, ...correctionFiles])
      await addPastPaperMutation({
        name,
        pastPaper: pastPaperFiles.length > 0 ? pastPaperFiles[0].id : null,
        pastPaperCorrection: correctionFiles.length > 0 ? correctionFiles[0].id : null,
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
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-950">
            Ajouter un ancien sujet
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
            <Button variant="outline" onClick={() => {}}>
              <p className="text-sm font-semibold text-blue-800">Annuler</p>
            </Button>
          </DialogClose>
          <Button
            variant="default"
            disabled={isPending}
            className="flex grow gap-2"
            onClick={onSubmit}
          >
            <p className="text-sm font-semibold">Ajouter</p>
            {isPending && <LoaderCircle className="h-4 w-4 animate-spin" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
