import type { ModuleDto } from '@viastud/server/routers/module_router'
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
import { trpc } from '@viastud/ui/lib/trpc'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@viastud/ui/select'
import { Myst } from '@viastud/ui/shared/myst'
import { Textarea } from '@viastud/ui/textarea'
import { CheckCircle2, Upload } from 'lucide-react'
import { useMemo, useState } from 'react'

import { type ParsedQuestion, parseQuizMarkdown } from '@/lib/quiz_markdown_parser'

interface ImportQuestionsFromMdModalProps {
  modules: ModuleDto[]
  refresh: () => void
}

export const ImportQuestionsFromMdModal = ({
  modules,
  refresh,
}: ImportQuestionsFromMdModalProps) => {
  const [open, setOpen] = useState<boolean>(false)
  const [rawContent, setRawContent] = useState<string>('')
  const [parsed, setParsed] = useState<ParsedQuestion[]>([])
  const [moduleId, setModuleId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [files, setFiles] = useState<FileDto[]>([])

  const { mutateAsync: addQuestion } = trpc.question.create.useMutation()

  const canSubmit = useMemo(() => moduleId && parsed.length > 0, [moduleId, parsed.length])

  const handleTextFileUpload = (fileContent: string) => {
    setRawContent(fileContent)
    setParsed(parseQuizMarkdown(fileContent))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      for (const q of parsed) {
        await addQuestion({
          moduleId: moduleId,
          title: q.title,
          detailedAnswer: q.detailedAnswer,
          isMultipleChoice: q.isMultipleChoice,
          images: [],
          answers: q.answers,
        })
      }
      setOpen(false)
      setRawContent('')
      setParsed([])
      setModuleId('')
      refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-9 min-w-9 rounded-full p-0">
          <Upload className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-950">
            Importer des questions (.md)
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <FileInput
                accept=".md"
                files={files}
                setFiles={setFiles}
                multiple={false}
                onTextFileUpload={handleTextFileUpload}
              />
            </div>
            <div>
              <Select onValueChange={setModuleId} value={moduleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-4">
            {parsed.length === 0 ? (
              <p className="text-sm text-gray-600">Aucune question trouvée.</p>
            ) : (
              parsed.map((q, idx) => (
                <div key={idx} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">Question {idx + 1}</p>
                    {q.answers.some((a) => a.isRightAnswer) && (
                      <CheckCircle2 className="size-4 text-green-600" />
                    )}
                  </div>
                  <Myst text={q.title} images={[]} />
                  <div className="mt-2 space-y-1">
                    {q.answers.map((a, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${a.isRightAnswer ? 'bg-green-600' : 'bg-gray-300'}`}
                        />
                        <Myst text={a.content} images={[]} />
                      </div>
                    ))}
                  </div>
                  {q.detailedAnswer && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-600">Explication</p>
                      <Myst text={q.detailedAnswer} images={[]} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-gray-600">Markdown</p>
            <Textarea
              value={rawContent}
              onChange={(e) => {
                setRawContent(e.target.value)
                setParsed(parseQuizMarkdown(e.target.value))
              }}
              className="h-80"
            />
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
            className="flex grow"
            disabled={!canSubmit || isSubmitting}
            onClick={handleSubmit}
          >
            <p className="text-sm font-semibold">Valider et créer</p>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
