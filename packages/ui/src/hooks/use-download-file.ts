import { useTransition } from 'react'

export const useDownloadFile = ({ url, name }: { url: string | undefined; name: string }) => {
  const [isDownloading, startDownloading] = useTransition()

  const downloadFile = async () => {
    startDownloading(async () => {
      if (!url) {
        throw new Error('URL is required')
      }

      const response = await fetch(url)
      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    })
  }

  return { downloadFile, isDownloading }
}
