import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@viastud/ui/accordion'
import type React from 'react'

interface Heading {
  value: string
  id: string
  depth: number
}

interface SectionMenuProps {
  headings: Heading[]
  handleMenuClick: (id: string) => void
}

const SectionMenu: React.FC<SectionMenuProps> = ({ headings, handleMenuClick }) => {
  // On filtre les headings de niveau 1 comme sections principales et on filtre les headings vides
  const level1Headings = headings.filter((h) => h.depth === 1 && h.value.trim())

  // Associer les depth 2 et 3 à leur parent level 1
  const groupedHeadings: Record<string, Heading[]> = {}
  let currentLevel1Id: string | null = null

  for (const heading of headings) {
    if (heading.depth === 1 && heading.value.trim()) {
      currentLevel1Id = heading.id
      groupedHeadings[currentLevel1Id] = []
    } else if (
      (heading.depth === 2 || heading.depth === 3) &&
      currentLevel1Id &&
      heading.value.trim()
    ) {
      groupedHeadings[currentLevel1Id].push(heading)
    }
  }

  return (
    <nav className="mb-6 rounded-xl border border-gray-200 bg-white/90 p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-lg font-bold text-gray-950">Sommaire du cours</h3>
      </div>
      <Accordion type="multiple" className="flex flex-col gap-2">
        {level1Headings.map((heading) => {
          const hasSubsections = groupedHeadings[heading.id]?.length > 0

          return (
            <AccordionItem key={heading.id} value={heading.id}>
              <div className="overflow-hidden rounded-xl bg-gray-100">
                {hasSubsections ? (
                  // Titre de section avec sous-sections (niveau 1)
                  <AccordionTrigger className="w-full bg-blue-100 px-4 py-3 text-left text-sm font-bold text-blue-600 transition hover:bg-blue-200">
                    {heading.value}
                  </AccordionTrigger>
                ) : (
                  // Titre de section sans sous-sections (niveau 1)
                  <button
                    onClick={() => {
                      handleMenuClick(heading.id)
                    }}
                    className="w-full bg-blue-100 px-4 py-3 text-left text-sm font-bold text-blue-600 transition hover:bg-blue-200"
                  >
                    {heading.value}
                  </button>
                )}

                {/* Sous-sections (niveau 2 et 3) */}
                {hasSubsections && (
                  <AccordionContent className="p-0">
                    <div className="flex flex-col gap-1">
                      {groupedHeadings[heading.id].map((child) => (
                        <button
                          key={child.id}
                          onClick={() => {
                            handleMenuClick(child.id)
                          }}
                          className="w-full bg-gray-100 py-2 pl-4 text-left font-semibold text-gray-800 transition hover:bg-gray-200"
                        >
                          {child.value}
                        </button>
                      ))}
                    </div>
                  </AccordionContent>
                )}
              </div>
            </AccordionItem>
          )
        })}
      </Accordion>
    </nav>
  )
}

export default SectionMenu
