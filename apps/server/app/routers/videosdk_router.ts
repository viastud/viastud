import { TRPCError } from '@trpc/server'
import axios from 'axios'
import type { JWTPayload } from 'jose'
import { SignJWT } from 'jose'
import { z } from 'zod'

import Professor from '#models/professor'
import Slot from '#models/slot'
import { authProcedure, publicProcedure } from '#services/trpc_service'
import env from '#start/env'

type Permissions = 'allow_join' | 'allow_mod' | 'ask_join'

type Roles = 'rtc' | 'crawler'

interface VideoSdkToken extends JWTPayload {
  apikey: string
  permissions: Permissions[]
  version?: 2
  roomId?: string
  participantId?: string
  roles?: Roles[]
}

interface CreateRoom {
  autoCloseConfig?: {
    duration: number
  }
  webhook?: {
    endPoint: string
    events: string[]
  }
  autoStartConfig?: {
    recording?: {
      transcription?: {
        enabled: boolean
      }
      config?: {
        quality: 'med' | 'high'
        layout: { type: 'SIDEBAR'; gridSize: number; priority: 'PIN' }
        mode: 'video-and-audio'
        orientation: 'landscape'
        theme: 'DEFAULT'
      }
      awsDirPath: string
    }
  }
}

async function generateToken(userId: string, permissions: Permissions[]) {
  const API_KEY = env.get('VIDEOSDK_API_KEY')
  const SECRET_KEY = new TextEncoder().encode(env.get('VIDEOSDK_SECRET_KEY'))

  const payload: VideoSdkToken = {
    apikey: API_KEY,
    permissions: permissions,
    participantId: userId,
  }

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(SECRET_KEY)
}

export const videoSdkRouter = {
  getRoomIdAndToken: authProcedure
    .meta({ guards: ['user', 'professor'] })
    .input(z.object({ slotId: z.number() }))
    .query(async ({ input, ctx }) => {
      const url = `${env.get('VIDEOSDK_API_ENDPOINT')}/rooms`

      let token: string

      if (ctx.genericAuth instanceof Professor) {
        token = await generateToken(ctx.genericAuth.id, ['allow_join', 'allow_mod'])
      } else {
        token = await generateToken(ctx.genericAuth.id, ['allow_join'])
      }

      const slot = await Slot.findBy('id', input.slotId)

      if (!slot) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Slot not found',
        })
      }

      if (slot.roomId) return { roomId: slot.roomId, token }

      const options = {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
      }

      const body: CreateRoom = {
        autoCloseConfig: {
          duration: 70, // 5 min avant + 60 min cours + 5 min après
        },
      }

      try {
        const response = await axios.post<{ roomId: string; customRoomId: string; id: string }>(
          url,
          body,
          options
        )

        slot.roomId = response.data.roomId

        await slot.save()

        return { roomId: response.data.roomId, token }
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create meeting',
        })
      }
    }),
  getMeetingDetails: publicProcedure
    .input(z.object({ roomId: z.string(), token: z.string() }))
    .query(async ({ input }) => {
      const { roomId } = input

      const getSession = `${env.get('VIDEOSDK_API_ENDPOINT')}/sessions`
      const headers = {
        'Authorization': input.token,
        'Content-Type': 'application/json',
      }

      const response = await axios.get<GetSessionsResponse>(getSession, {
        headers,
        params: { roomId, status: 'ongoing' },
      })

      const meetingDetails =
        response.data.data.find((session) => session.end === null) ?? ({} as GetSessionData)
      return {
        start: meetingDetails.start,
        participants: meetingDetails.participants,
      }
    }),
}

interface GetSessionsResponse {
  data: GetSessionData[]
}

interface GetSessionData {
  id: string
  start: string
  end: string | null
  roomId: string
  participants: ParticipantData[]
}

interface ParticipantData {
  participantId: string
  name: string
}
