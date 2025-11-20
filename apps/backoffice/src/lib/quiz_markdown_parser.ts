export interface ParsedAnswer {
  content: string
  isRightAnswer: boolean
}

export interface ParsedQuestion {
  title: string
  detailedAnswer: string
  isMultipleChoice: boolean
  answers: ParsedAnswer[]
}

function normalizeNewlines(input: string): string {
  return input.replace(/\r\n?/g, '\n')
}

function trimMarkdownFormatting(input: string): string {
  return input.replace(/^\*\*|\*\*$/g, '').trim()
}

export function parseQuizMarkdown(markdown: string): ParsedQuestion[] {
  const md = normalizeNewlines(markdown)
  const sections: string[] = []

  const headingRegex = /^##\s*Question\s+\d+\s*$/gim
  const indices: number[] = []
  let match: RegExpExecArray | null
  while ((match = headingRegex.exec(md)) !== null) {
    indices.push(match.index)
  }
  if (indices.length === 0) return []
  indices.push(md.length)

  for (let i = 0; i < indices.length - 1; i++) {
    const start = indices[i]
    const end = indices[i + 1]
    sections.push(md.slice(start, end).trim())
  }

  const parsed: ParsedQuestion[] = []

  for (const section of sections) {
    // Remove the heading line
    const raw = section.split('\n')
    if (raw.length === 0) continue
    const contentLines = /^##\s*Question\s+\d+\s*$/i.exec(raw[0]) ? raw.slice(1) : raw
    const lines = contentLines.map((l) => l.trim()).filter((l) => l.length > 0)

    // Determine title strictly before first option occurrence
    const optionRegex = /^([A-D])\.\s*(.+)$/i
    const firstOptionIdx = lines.findIndex((l) => optionRegex.test(l))
    if (firstOptionIdx === -1) continue
    const title = trimMarkdownFormatting(lines.slice(0, firstOptionIdx).join('\n'))

    // Extract options anywhere in the section - clean up LaTeX formatting
    const options: Record<string, string> = {}
    for (const line of lines) {
      const opt = optionRegex.exec(line)
      if (opt) {
        const letter = opt[1].toUpperCase()
        const text = opt[2].trim().replace(/\s+$/, '') // Remove trailing spaces
        options[letter] = text
      }
    }

    // Answer letter from entire section - improved regex to handle LaTeX formatting
    const sectionText = lines.join('\n')
    const answerMatch = /Réponse\s*:?\s*\**\s*\$?([A-D])\$?\b/i.exec(sectionText)
    const answerLetter = answerMatch ? answerMatch[1].toUpperCase() : undefined

    // Explanation: take text after Explication: if present
    let detailedAnswer = ''
    const explMatch = /\*\*?\s*Explication\s*:\s*\*\*?\s*([\s\S]*)/i.exec(sectionText)
    if (explMatch) {
      detailedAnswer = explMatch[1].trim()
    }

    const answers: ParsedAnswer[] = Object.entries(options).map(([letter, text]) => ({
      content: text,
      isRightAnswer: !!answerLetter && letter === answerLetter,
    }))

    parsed.push({
      title,
      detailedAnswer,
      isMultipleChoice: true,
      answers,
    })
  }

  return parsed
}
