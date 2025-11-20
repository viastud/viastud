import type { FileDto } from '@viastud/server/services/file_service'
import { Upload, X } from 'lucide-react'
import type * as React from 'react'

import { Button } from '#components/ui/button'
import { Input } from '#components/ui/input'
import { Label } from '#components/ui/label'
import { fileToFileDto } from '#lib/file-utils'

interface FileInputProps extends React.ComponentProps<'input'> {
  onTextFileUpload?: (fileContent: string, fileExtension?: string) => void
  files: FileDto[]
  setFiles: (files: FileDto[]) => void
}

const getFileExtension = (fileName: string) => {
  return fileName.split('.').pop() ?? ''
}

const FileInput = ({
  ref,
  files,
  setFiles,
  onTextFileUpload,
  accept,
  ...props
}: FileInputProps) => {
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const filesArray = Array.from(event.target.files ?? [])
    const filesToUpload = filesArray.filter(
      (file) => !['tex', 'md'].includes(getFileExtension(file.name)) || !onTextFileUpload
    )
    if (props.multiple) {
      for (const file of filesToUpload) {
        setFiles([...files, fileToFileDto(file)])
      }
    } else if (filesToUpload.length) {
      const file = filesToUpload[0]
      setFiles([fileToFileDto(file)])
    }
    const textFile = filesArray.find((file) => ['tex', 'md'].includes(getFileExtension(file.name)))
    if (onTextFileUpload && textFile) {
      const reader = new FileReader()
      reader.onload = (e) => {
        onTextFileUpload(e.target?.result as string, textFile.name.split('.').pop())
      }

      reader.readAsText(textFile)
    }
  }

  const removeFile = (fileId: string) => {
    setFiles(files.filter((file) => file.id !== fileId))
  }

  return (
    <>
      <Label
        htmlFor={props.id ?? 'file'}
        className="flex w-full cursor-pointer flex-col items-center rounded-xl border border-gray-200 py-4"
      >
        <div className="rounded-lg border border-gray-200 p-2">
          <Upload />
        </div>
        <p className="mt-3 text-sm font-normal text-gray-700">
          <b className="text-blue-600">Cliquer pour importer</b> ou glisser & déposer
        </p>
        {accept && <p className="mt-1 text-gray-600">{accept} (max. 15Mo)</p>}
      </Label>
      <Input
        id={props.id ?? 'file'}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileUpload}
        onClick={(event) => {
          const element = event.target as HTMLInputElement
          element.value = ''
        }}
        ref={ref}
        {...props}
      />
      {files.map((file) => (
        <div
          key={file.id}
          className="flex w-full items-center justify-between rounded-xl border border-gray-200 p-4 text-gray-700"
        >
          {file.name}
          <Button
            variant="icon"
            onClick={() => {
              removeFile(file.id)
            }}
          >
            <X className="text-gray-500" />
          </Button>
        </div>
      ))}
    </>
  )
}

FileInput.displayName = 'FileInput'

export { FileInput }
