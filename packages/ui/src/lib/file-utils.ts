import type { FileDto } from '@viastud/server/services/file_service'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

export const fileToFileDto = (file: File): FileDto => {
  const fileUrl = URL.createObjectURL(file)

  const uuid = uuidv4()

  return {
    id: uuid,
    name: file.name,
    url: fileUrl,
  }
}

export async function fileDtoToFile(fileDto: FileDto) {
  const response = await axios.get<Blob>(fileDto.url, {
    responseType: 'blob',
  })

  const blob = response.data

  const inferMimeTypeFromExtension = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'png':
        return 'image/png'
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg'
      case 'gif':
        return 'image/gif'
      case 'webp':
        return 'image/webp'
      case 'svg':
        return 'image/svg+xml'
      case 'pdf':
        return 'application/pdf'
      case 'md':
        return 'text/markdown'
      case 'tex':
        return 'application/x-tex'
      default:
        return 'application/octet-stream'
    }
  }

  const headerMimeType = response.headers['content-type']
  const mimeType = blob.type ?? headerMimeType ?? inferMimeTypeFromExtension(fileDto.name)

  const file = new File([blob], fileDto.name, { type: mimeType })

  return file
}
