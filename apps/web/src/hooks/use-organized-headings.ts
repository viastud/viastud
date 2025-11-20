import { useMemo } from 'react'

import type { Heading, OrganizedSection } from '../types/heading'

export const useOrganizedHeadings = (headings: Heading[]) => {
  return useMemo(() => {
    const organizedHeadings: OrganizedSection[] = []
    let currentMain = null as Heading | null
    let currentChildren: Heading[] = []

    // Organiser les headings par niveau
    headings.forEach((heading) => {
      if (heading.depth === 1) {
        // Si on a déjà une section principale, on la sauvegarde avant d'en commencer une nouvelle
        if (currentMain) {
          organizedHeadings.push({ main: currentMain, children: [...currentChildren] })
        }
        // Commencer une nouvelle section principale
        currentMain = heading
        currentChildren = []
      } else {
        // Si on n'a pas encore de section principale, on en crée une factice
        currentMain ??= {
          id: 'root',
          value: 'Section principale',
          depth: 1,
        }
        // Ajouter aux enfants de la section courante
        currentChildren.push(heading)
      }
    })

    // Ajouter la dernière section si elle existe
    if (currentMain && (currentChildren.length > 0 || currentMain.id !== 'root')) {
      organizedHeadings.push({ main: currentMain, children: [...currentChildren] })
    }

    // Identifier les headings orphelins (ceux qui n'ont pas de parent de niveau 1)
    const allChildrenIds = new Set(
      organizedHeadings.flatMap((section) => section.children.map((child) => child.id))
    )

    const orphanHeadings = headings.filter(
      (heading) => heading.depth > 1 && !allChildrenIds.has(heading.id)
    )

    return {
      organizedHeadings,
      orphanHeadings,
    }
  }, [headings])
}
