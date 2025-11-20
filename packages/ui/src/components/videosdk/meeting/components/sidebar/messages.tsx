import { useFile, usePubSub } from '@videosdk.live/react-sdk'
import { LoaderCircle, PaperclipIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useShallow } from 'zustand/shallow'

import { Button } from '#components/ui/button'
import { Input } from '#components/ui/input'
import { Separator } from '#components/ui/separator'
import { SidebarContent, SidebarFooter } from '#components/ui/sidebar'
import { UserMessages } from '#components/videosdk/meeting/components/sidebar/user-messages'
import { useToast } from '#hooks/use-toast'
import { useMeetingStore } from '#store/meeting.store'

export function Messages() {
  const { token } = useMeetingStore(
    useShallow((state) => ({
      token: state.token,
    }))
  )
  const { publish, messages: messagesRaw } = usePubSub('CHAT')
  const { uploadBase64File } = useFile()
  const { handleError } = useToast()

  const [input, setInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [previousMessageCount, setPreviousMessageCount] = useState(0)

  const handlePublishMessage = () => {
    if (file) {
      if (file.size >= 4 * 1000 * 1000) {
        handleError(
          new Error('Le fichier est trop grand. La taille maximale est de 4MB.'),
          "Erreur lors de l'envoi du fichier"
        )
        return
      }
      uploadFile(file)
    } else {
      publish(input, { persist: true })
      setInput('')
      setTimeout(scrollToBottom, 100)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const uploadFile = (file: File) => {
    startTransition(async () => {
      if (!token) return
      try {
        const base64Data = await convertToBase64(file)
        const fileUrl = await uploadBase64File({
          base64Data,
          token,
          fileName: file.name,
        })
        if (!fileUrl) return

        publish(
          fileUrl,
          { persist: true },
          {
            isImage: file.type.startsWith('image'),
            mimeType: file.type,
            fileName: file.name,
          }
        )
        setFile(null)
      } catch (error) {
        handleError(error, 'Error uploading file')
      }
    })
  }

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.readAsDataURL(file)

      reader.onloadend = () => {
        const base64String = reader.result as string
        const base64Data = base64String.split(',')[1]
        resolve(base64Data)
      }

      reader.onerror = reject
    })
  }

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest',
      })
    }
  }

  const messagesWithAnimation = useMemo(() => {
    const currentCount = messagesRaw.length
    const isNewMessage = currentCount > previousMessageCount

    return messagesRaw.map((message, index) => ({
      ...message,
      isNew: isNewMessage && index >= previousMessageCount,
    }))
  }, [messagesRaw, previousMessageCount])

  useEffect(() => {
    setPreviousMessageCount(messagesRaw.length)
  }, [messagesRaw.length])

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollToBottom()
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    })
  }, [messagesRaw])

  return (
    <>
      <SidebarContent>
        <div className="flex h-full flex-col gap-2 overflow-y-auto px-3">
          {messagesWithAnimation.map((message) => (
            <div
              key={message.id}
              className={`transition-all duration-300 ease-out ${
                message.isNew ? 'animate-in slide-in-from-bottom-2 fade-in' : 'opacity-100'
              }`}
            >
              <UserMessages message={message} />
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </SidebarContent>
      <Separator />
      <SidebarFooter className="flex-row gap-0">
        <Button variant="none" size="icon">
          <label htmlFor="file-upload" className="cursor-pointer">
            <PaperclipIcon className="text-blue-600" />
          </label>
        </Button>
        <input
          id="file-upload"
          type="file"
          accept="image/*, .pdf, .txt, .docx"
          className="hidden"
          onChange={handleFileChange}
        />
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handlePublishMessage()
          }}
          className="flex flex-1 flex-row"
        >
          <div className="flex flex-1 flex-col">
            <Input
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
              }}
              placeholder="Envoyer un message dans le Chat...."
              className="flex-1 border-none pr-3 shadow-none focus-visible:ring-0"
            />
            <div
              className={`mt-1 overflow-hidden transition-all duration-300 ease-in-out ${file ? 'max-h-8 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <PaperclipIcon className="h-3 w-3 flex-shrink-0" />
                <span className="max-w-[120px] truncate" title={file?.name}>
                  {file?.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null)
                    const fileInput = document.getElementById('file-upload') as HTMLInputElement
                    if (fileInput) fileInput.value = ''
                  }}
                  className="text-red-500 transition-colors duration-200 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
          <input type="submit" className="hidden w-0" />
          <Button
            disabled={isPending}
            type="submit"
            variant="none"
            className="font-semibold text-blue-600"
          >
            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Envoyer'}
          </Button>
        </form>
      </SidebarFooter>
    </>
  )
}
