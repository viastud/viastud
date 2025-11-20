import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'
import { useRef, useTransition } from 'react'

import { useToast } from '#hooks/use-toast'
import { useUploadFile } from '#hooks/use-upload-file'
import { fileToFileDto } from '#lib/file-utils'

const A4_PAGE_WIDTH = 210 // mm
const A4_PAGE_HEIGHT = 297 // mm

export const useRenderPdf = ({ fileName, margin }: { fileName: string; margin: number }) => {
  const pdfRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const { handleError } = useToast()
  const { uploadFile } = useUploadFile()

  const toPDF = async (): Promise<ReturnType<typeof uploadFile>> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          const element = pdfRef.current
          if (!element) {
            return
          }

          const canvas = await html2canvas(element as HTMLElement, { useCORS: true })
          const pxToMM = A4_PAGE_WIDTH / element.clientWidth
          const pdf = new jsPDF('p', 'mm', [A4_PAGE_WIDTH, A4_PAGE_HEIGHT])

          let currentPageHeight = 0
          let totalCanvasAdded = 0

          function processElement(currentElement: Element) {
            const children = Array.from(currentElement.children)
            children.map((child, index) => {
              const childMargin = getMargin(child, children[index + 1] ?? child)
              const childHeight = child.clientHeight * pxToMM
              if (childHeight > A4_PAGE_HEIGHT - margin * 2) {
                processElement(child)
                currentPageHeight += childMargin
              } else {
                if (currentPageHeight + childHeight >= A4_PAGE_HEIGHT) {
                  const canvasHeight = currentPageHeight * (canvas.width / A4_PAGE_WIDTH)
                  addImage(pdf, canvas, totalCanvasAdded, canvasHeight, margin)
                  pdf.addPage()
                  totalCanvasAdded += canvasHeight
                  currentPageHeight = 0
                }
                currentPageHeight += childHeight + childMargin * pxToMM
              }
            })
          }

          processElement(element)
          const canvasHeight = canvas.height - totalCanvasAdded
          addImage(pdf, canvas, totalCanvasAdded, canvasHeight, margin)

          const pdfBlob = pdf.output('blob')
          const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' })
          const fileDto = fileToFileDto(pdfFile)
          const uploadedFile = await uploadFile(fileDto)
          resolve(uploadedFile)
        } catch (error) {
          handleError(error)
        }
      })
    })
  }

  return { pdfRef, toPDF, isPending }
}

function addImage(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  canvasOffYset: number,
  canvasHeight: number,
  margin: number
) {
  const pageWidth = A4_PAGE_WIDTH - margin * 2
  const canvasPage = document.createElement('canvas')

  canvasPage.setAttribute('width', String(canvas.width))
  canvasPage.setAttribute('height', String(canvasHeight))

  const ctx = canvasPage.getContext('2d')
  ctx?.drawImage(
    canvas,
    0,
    canvasOffYset,
    canvas.width,
    canvasHeight,
    0,
    0,
    canvas.width,
    canvasHeight
  )

  const imgData = canvasPage.toDataURL('image/jpeg', 1.0)

  pdf.addImage(
    imgData,
    'jpeg',
    margin,
    margin,
    pageWidth,
    canvasHeight * (pageWidth / canvas.width),
    undefined,
    'FAST'
  )
}

function getMargin(topElement: Element, bottomElement: Element) {
  const stylesTopElement = window.getComputedStyle(topElement)
  const stylesBottomElement = window.getComputedStyle(bottomElement)

  const styleBottomElementFirstChild = bottomElement.children[0]
    ? window.getComputedStyle(bottomElement.children[0])
    : { marginBottom: '0px' }

  const marginBottom = Number.parseFloat(stylesTopElement.marginBottom.replace('px', ''))
  const marginTop = Number.parseFloat(stylesBottomElement.marginTop.replace('px', ''))
  const marginBottomFirstChild = Number.parseFloat(
    styleBottomElementFirstChild.marginBottom.replace('px', '')
  )

  const border = Number.parseFloat(stylesTopElement.borderBottomWidth.replace('px', '')) * 2

  return Math.max(marginTop, marginBottom, marginBottomFirstChild) + border
}
