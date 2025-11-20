import type { FileDto } from '@viastud/server/services/file_service'

import { fileDtoToFile } from '#lib/file-utils'
import { trpc, vanillaTrpc } from '#lib/trpc'

export const useUploadFile = () => {
  const trpcMutation = trpc.file.upload.useMutation()

  const uploadFile = async (file: FileDto) => {
    const data = await fileDtoToFile(file)
    const reponse = await trpcMutation.mutateAsync({ fileName: file.name, fileId: file.id })
    await fetch(reponse.url, {
      method: 'PUT',
      body: data,
      headers: {
        'Content-Type': data.type,
      },
    })

    return vanillaTrpc.file.get.query({ fileId: reponse.fileId })
  }

  const uploadFiles = async (files: FileDto[]) => {
    const uploadedFiles: FileDto[] = []

    for (const file of files) {
      const fileDto = await uploadFile(file)
      uploadedFiles.push(fileDto)
    }

    return uploadedFiles
  }

  return { uploadFile, uploadFiles }
}
