import type { UUID } from 'node:crypto'

import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { z } from 'zod'

import File from '#models/file'
import { deleteFile, type FileDto, getFile, s3Client } from '#services/file_service'
import { authProcedure, router } from '#services/trpc_service'
import env from '#start/env'

export const fileRouter = router({
  upload: authProcedure
    .input(z.object({ fileName: z.string(), fileId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const file = await File.updateOrCreate(
        {
          id: input.fileId as UUID,
        },
        {
          fileName: input.fileName,
        }
      )

      const command = new PutObjectCommand({
        Bucket: env.get('S3_BUCKET'),
        Key: file.id,
      })

      return {
        url: await getSignedUrl(s3Client, command, { expiresIn: 60 }),
        fileId: file.id,
      }
    }),
  get: authProcedure
    .meta({ guards: ['admin', 'user', 'professor'] })
    .input(z.object({ fileId: z.string() }))
    .query<FileDto>(async ({ input }) => {
      return getFile(input.fileId)
    }),
  delete: authProcedure.input(z.object({ fileId: z.string() })).mutation(async ({ input }) => {
    return deleteFile(input.fileId)
  }),
})
