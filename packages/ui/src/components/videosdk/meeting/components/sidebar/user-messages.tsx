import { useFile, useParticipant } from '@videosdk.live/react-sdk'
import { LoaderCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useShallow } from 'zustand/shallow'

import { UserIcon } from '#components/shared/user-icon'
import { cn } from '#lib/utils'
import { useMeetingStore } from '#store/meeting.store'
import type { Message } from '#types/videosdk'

interface UserMessagesProps {
  message: Message
}

export function UserMessages({ message }: UserMessagesProps) {
  const { token } = useMeetingStore(
    useShallow((state) => ({
      token: state.token,
    }))
  )
  const { participant, isLocal } = useParticipant(message.senderId)
  const { fetchBase64File } = useFile()

  const [base64File, setBase64File] = useState<string | null>(null)

  const fetchFile = useCallback(
    async (url: string) => {
      if (!token) return

      const resp = await fetchBase64File({
        url,
        token,
      })

      setBase64File(resp)
    },
    [fetchBase64File, token]
  )

  useEffect(() => {
    if (message.payload?.mimeType) {
      void fetchFile(message.message)
    }
  }, [message, fetchFile])

  const [firstName, lastName] = participant?.displayName?.split(' ') ?? []

  const downloadBase64File = (): void => {
    if (!base64File) return
    const byteCharacters = atob(base64File)
    const byteArrays = []

    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
      const slice = byteCharacters.slice(offset, offset + 1024)
      const byteNumbers = new Array(slice.length)
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i)
      }
      byteArrays.push(new Uint8Array(byteNumbers))
    }

    const blob = new Blob(byteArrays, { type: message.payload?.mimeType })

    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.href = url
    link.download = message.payload?.fileName ?? 'file'

    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <div className={cn('flex gap-2', { 'flex-row-reverse items-end': isLocal })}>
      <UserIcon lastName={lastName} firstName={firstName} />
      <div className="flex flex-col gap-2">
        <div key={message.id} className="rounded-lg bg-blue-50 p-3">
          {message.message.startsWith('http') ? (
            message.payload?.isImage ? (
              <>
                {base64File ? (
                  <img
                    src={`data:${message.payload?.mimeType};base64,${base64File}`}
                    alt="Message Image"
                    className="h-auto max-w-full cursor-pointer rounded-md"
                    onClick={() => {
                      downloadBase64File()
                    }}
                  />
                ) : (
                  <LoaderCircle className="h-8 w-8 animate-spin" />
                )}
              </>
            ) : (
              <button
                className="text-blue-600"
                onClick={() => {
                  downloadBase64File()
                }}
              >
                {message.payload?.fileName}
              </button>
            )
          ) : (
            message.message
          )}
        </div>
      </div>
    </div>
  )
}
