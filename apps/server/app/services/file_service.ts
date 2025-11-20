import { DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { SignJWT } from 'jose'

import File from '#models/file'
import env from '#start/env'

export const s3Client = new S3Client({
  region: 'eu-west-3',
  profile: env.get('PROFILE_NAME') ?? undefined,
})

export interface FileDto {
  name: string
  id: string
  url: string
}

export async function deleteFile(fileId: string) {
  const command = new DeleteObjectCommand({
    Bucket: env.get('S3_BUCKET'),
    Key: fileId,
  })

  await s3Client.send(command)

  const file = await File.findOrFail(fileId)
  await file.delete()
}

export async function getFile(fileId: string): Promise<FileDto> {
  const file = await File.findOrFail(fileId)

  return {
    url: String(await getFileUrl(fileId)),
    id: file.id,
    name: file.fileName,
  }
}

export async function getFileUrl(
  fileId: string,
  bucket = env.get('S3_BUCKET'),
  isRecording = false
) {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileId,
    })

    const expirationTime = isRecording ? 604800 : 86400

    if (isRecording) {
      const filename = fileId.split('/').pop()
      const id = filename?.split('.').shift()
      const payload = {
        apikey: env.get('VIDEOSDK_API_KEY'),
        permissions: [`allow_join`],
        version: 2,
      }
      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('10m')
        .sign(new TextEncoder().encode(env.get('VIDEOSDK_SECRET_KEY')))
      const url = `https://api.videosdk.live/v2/recordings/${id}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
      })
      const data = (await response.json()) as { file: { fileUrl: string } }
      return data.file.fileUrl
    }

    return await getSignedUrl(s3Client, command, { expiresIn: expirationTime })
  } catch {
    return undefined
  }
}

export async function getFileAsBase64(fileId: string) {
  const file = await File.findOrFail(fileId)
  const command = new GetObjectCommand({
    Bucket: env.get('S3_BUCKET'),
    Key: fileId,
  })
  const getObjectCommand = await s3Client.send(command)
  const base64File = await getObjectCommand.Body?.transformToString('base64')
  return {
    base64File: base64File ?? '',
    id: file.id,
    name: file.fileName,
  }
}
