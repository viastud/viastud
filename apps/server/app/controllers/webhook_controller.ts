import { verify } from 'node:crypto'

import { errors } from '@adonisjs/auth'
import type { HttpContext } from '@adonisjs/core/http'
import { z } from 'zod'

import NotFoundException from '#exceptions/not_found_exception'
import Slot from '#models/slot'

const recordingSavedSchema = z.object({
  webhookType: z.string(),
  data: z.object({
    meetingId: z.string(),
    sessionId: z.string(),
    filePath: z.string(),
    fileUrl: z.string().nullable(),
  }),
})

const VIDEO_SDK_PUBLIC_KEY =
  '\n-----BEGIN RSA PUBLIC KEY-----\nMIIBCgKCAQEAnXG9YNown/i5KoSVpVXqm2zXxGeHekYcEXnSiFfsZNShRggHUk1e\nhCx3Wwr7vZdIt+UgAMtJkVHH/HTNj9p1fr55h/wnLgf/U+wpFrqZfUIdirfGz5gU\nh9JV+oszHO4bfPR4HVkEJswx+n1AIQ8Vas7cwr49qxrcgL71If3E+xXL68s+QoN0\nP0Iuq4gFBWd2oVo2+EOKMsJYvMBMA66INrDSD06vzoFbwcUbme/z89Mxwhrn5C0O\nrvFogxhDL2xlUT1n8eEeLbaXOe4Vh2NnDY38jCO6rY74rNZGmlRotErNqoyLo4OG\nXATbfEueS4+EGK/rVIIdqbJCA4Jv6BnOKQIDAQAB\n-----END RSA PUBLIC KEY-----\n'

export default class WebhookController {
  async recordingSaved(ctx: HttpContext) {
    const signature = ctx.request.header('videosdk-signature')
    const body = ctx.request.body()

    if (!signature) {
      throw errors.E_UNAUTHORIZED_ACCESS
    }

    const isVerified = verify(
      'RSA-SHA256',
      Buffer.from(JSON.stringify(body)),
      VIDEO_SDK_PUBLIC_KEY,
      Buffer.from(signature, 'base64')
    )

    if (!isVerified) {
      throw errors.E_UNAUTHORIZED_ACCESS
    }

    const parsedBody = recordingSavedSchema.parse(body)

    const slot = await Slot.findBy('roomId', parsedBody.data.meetingId)

    if (!slot) {
      throw new NotFoundException('Slot not found')
    }

    slot.recordingId = parsedBody.data.filePath

    await slot.save()

    ctx.response.ok('success')
  }
}
