import { AccordionContent, AccordionItem, AccordionTrigger } from '@viastud/ui/accordion'
import type React from 'react'

import type { OrganizedSection } from '../../types/heading'
import { NavigationButton } from './navigation-button'

interface SectionAccordionItemProps {
  section: OrganizedSection
  onHeadingClick: (id: string) => void
}

export const SectionAccordionItem: React.FC<SectionAccordionItemProps> = ({
  section,
  onHeadingClick,
}) => {
  return (
    <AccordionItem value={section.main.id} className="rounded-lg border border-blue-200">
      <AccordionTrigger className="bg-blue-50 px-4 py-2 text-base font-bold text-blue-700 hover:bg-blue-100">
        {section.main.value}
      </AccordionTrigger>
      <AccordionContent className="px-2 pb-2">
        <div className="flex flex-col gap-1">
          {section.children.map((child) => (
            <NavigationButton
              key={child.id}
              heading={child}
              onClick={() => {
                onHeadingClick(child.id)
              }}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
