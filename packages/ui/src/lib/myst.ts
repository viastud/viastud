import type { FileDto } from '@viastud/server/services/file_service'
import axios from 'axios'
import type { References } from 'myst-common'
import { DEFAULT_RENDERERS } from 'myst-to-react'
import { VFile } from 'vfile'

import { AdmonitionRenderer, AdmonitionTitle } from '#components/myst/admonitions'
import { ProofRenderer } from '#components/myst/proof'

export const latexToMyst = async (text: string): Promise<string> => {
  const { unified } = await import('unified')
  const { default: mystToMd } = await import('myst-to-md')
  const { TexParser } = await import('tex-to-myst')

  const vfile = new VFile()
  const parser = new TexParser(text, vfile)
  unified().use(mystToMd).stringify(parser.ast, vfile)

  return vfile.result as string
}

export async function replaceImages(content: string, images: FileDto[]) {
  let newContent = content
  for (const image of images) {
    const imageData = await axios.get<Blob>(image.url, {
      responseType: 'blob',
    })

    const fileUrl = URL.createObjectURL(imageData.data)

    newContent = newContent.replace(new RegExp(`(?:imgs/)?${image.name}`, 'i'), fileUrl)
  }
  return newContent
}

export const RENDERERS = {
  ...DEFAULT_RENDERERS,
  admonition: AdmonitionRenderer,
  admonitionTitle: AdmonitionTitle,
  proof: ProofRenderer,
}

export async function parse(text: Promise<string>) {
  const { unified } = await import('unified')
  const {
    basicTransformationsPlugin,
    enumerateTargetsPlugin,
    getFrontmatter,
    keysPlugin,
    mathPlugin,
    reconstructHtmlPlugin,
    ReferenceState,
    resolveReferencesPlugin,
  } = await import('myst-transforms')
  const { proofDirective } = await import('myst-ext-proof')
  const { mystParse } = await import('myst-parser')

  const vfile = new VFile()
  const parseMyst = (content: string) =>
    mystParse(content, {
      markdownit: { linkify: true },
      directives: [proofDirective],
      vfile,
    })
  const mdast = parseMyst(await text)
  const references = {
    cite: { order: [], data: {} },
    footnotes: {},
  }
  const frontmatter = getFrontmatter(vfile, mdast, {
    keepTitleNode: true,
  }).frontmatter

  const state = new ReferenceState('', {
    previousCounts: frontmatter.previousCounts,
    vfile,
  })

  unified()
    .use(reconstructHtmlPlugin)
    .use(basicTransformationsPlugin, { parser: parseMyst })
    .use(mathPlugin, { macros: frontmatter.math })
    .use(enumerateTargetsPlugin, { state })
    .use(resolveReferencesPlugin, { state })
    .use(keysPlugin)
    .runSync(mdast, vfile)

  return {
    frontmatter,
    references: { ...references, article: mdast } as References,
    warnings: vfile.messages,
  }
}

// Type minimal pour un heading dans l'AST Myst
export interface MystHeading {
  depth: number
  value: string
  id?: string
}

// Type pour un heading avec AST complet pour le rendu
export interface MystHeadingWithAst {
  depth: number
  value: string
  id?: string
  ast?: MystNode
}

interface MystNode {
  type: string
  children?: MystNode[]
  depth?: number
  identifier?: string
  value?: string
}

// Fonction utilitaire pour extraire les headings de l'AST Myst (version texte)
export function extractHeadingsFromMdast(mdast: MystNode): MystHeading[] {
  const headings: MystHeading[] = []

  // Fonction pour convertir les éléments LaTeX en texte lisible
  function convertLatexToReadable(node: MystNode): string {
    if (node.type === 'text' && node.value) {
      return node.value
    }

    if (node.type === 'emphasis' && node.children) {
      // Les éléments en italique (emphasis) sont rendus normalement
      return node.children.map(convertLatexToReadable).join('')
    }

    if (node.type === 'strong' && node.children) {
      // Les éléments en gras (strong) sont rendus normalement
      return node.children.map(convertLatexToReadable).join('')
    }

    if (node.type === 'inlineMath' && node.value) {
      // Les mathématiques inline sont converties en texte simple
      return node.value.replace(/\\[a-zA-Z]+/g, '').replace(/[{}]/g, '')
    }

    if (node.type === 'math' && node.value) {
      // Les blocs de mathématiques sont convertis en texte simple
      return node.value.replace(/\\[a-zA-Z]+/g, '').replace(/[{}]/g, '')
    }

    if (node.children) {
      return node.children.map(convertLatexToReadable).join('')
    }

    return ''
  }

  function visit(node: MystNode) {
    if (node.type === 'heading' && node.children && node.children.length > 0) {
      const headingText = convertLatexToReadable(node)
      // Filtrer les headings vides ou qui ne contiennent que des espaces
      if (headingText.trim()) {
        headings.push({
          depth: node.depth ?? 1,
          value: headingText.trim(),
          id: node.identifier ?? headingText.trim().replace(/\s+/g, '-').toLowerCase(),
        })
      }
    }
    if (node.children) {
      node.children.forEach(visit)
    }
  }

  visit(mdast)
  return headings
}

// Fonction utilitaire pour extraire les headings avec AST complet pour le rendu
export function extractHeadingsWithAstFromMdast(mdast: MystNode): MystHeadingWithAst[] {
  const headings: MystHeadingWithAst[] = []

  function visit(node: MystNode) {
    if (node.type === 'heading' && node.children && node.children.length > 0) {
      const headingText = extractTextFromNode(node)
      // Filtrer les headings vides ou qui ne contiennent que des espaces
      if (headingText.trim()) {
        headings.push({
          depth: node.depth ?? 1,
          value: headingText.trim(),
          id: node.identifier ?? headingText.trim().replace(/\s+/g, '-').toLowerCase(),
          ast: node,
        })
      }
    }
    if (node.children) {
      node.children.forEach(visit)
    }
  }

  function extractTextFromNode(node: MystNode): string {
    if (node.type === 'text' && node.value) {
      return node.value
    }

    if (node.children) {
      return node.children.map(extractTextFromNode).join('')
    }

    return ''
  }

  visit(mdast)
  return headings
}
