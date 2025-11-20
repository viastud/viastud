import type { NodeRenderer } from '@myst-theme/providers'
import { skipToken } from '@tanstack/react-query'
import type { Image as ImageNodeSpec } from 'myst-spec'
import { useEffect, useState } from 'react'
import z from 'zod'

import { trpc } from '#lib/trpc'

type ImageNode = ImageNodeSpec & { height?: string }

const uuidSchema = z.string().uuid()

function getStyleValue(width?: number | string): string | number | undefined {
  if (typeof width === 'number' && Number.isNaN(width)) {
    // If it is nan, return undefined.
    return undefined
  }
  if (typeof width === 'string') {
    if (width.endsWith('%')) {
      return width
    }
    if (width.endsWith('px')) {
      return Number(width.replace('px', ''))
    }
    if (!Number.isNaN(Number(width))) {
      return Number(width)
    }
    return undefined
  }
  return width
}

function alignToMargin(align: string) {
  switch (align) {
    case 'left':
      return { marginRight: 'auto' }
    case 'right':
      return { marginLeft: 'auto' }
    case 'center':
      return { margin: '0 auto' }
    default:
      return {}
  }
}

export const Image: NodeRenderer<ImageNode> = ({ node }) => {
  const [formattedSrc, setFormattedSrc] = useState(node.url)

  const fileData = trpc.file.get.useQuery(
    uuidSchema.safeParse(node.url).success ? { fileId: node.url } : skipToken
  )

  useEffect(() => {
    if (fileData.data) {
      setFormattedSrc(fileData.data.url)
    }
  }, [fileData.data])

  if (node.url.endsWith('.mp4')) {
    return
  }

  return (
    <img
      id={node.id}
      style={{
        width: getStyleValue(node.width),
        height: getStyleValue(node.height),
        ...alignToMargin(node.align ?? 'center'),
      }}
      src={formattedSrc}
      alt={node.alt}
    />
  )
}
