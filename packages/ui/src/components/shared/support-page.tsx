import type { FaqItemDto } from '@viastud/server/routers/faq_router'
import {
  type FaqQuestionCategory,
  faqQuestionCategory,
  faqQuestionCategoryEnum,
} from '@viastud/utils'
import { MinusCircle, PlusCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Input } from '#components/ui/input'
import { cn } from '#lib/utils'

import type { ContactModalProps } from './contact-modal'
import { ContactModal } from './contact-modal'

interface FaqItemExtendedDto extends FaqItemDto {
  isUnrolled: boolean
}

export function SupportPage({
  faqContent,
  user,
}: {
  faqContent: FaqItemDto[]
  user: ContactModalProps
}) {
  const [searchValue, setSearchValue] = useState<string>('')
  const [selectedTab, setSelectedTab] = useState<FaqQuestionCategory>('GENERAL')
  const [faqContentForDisplay, setFaqContentForDisplay] = useState<FaqItemExtendedDto[]>(
    faqContent.map((faqItem) => ({ ...faqItem, isUnrolled: false }))
  )
  const [isContactItemOpen, setIsContactItemOpen] = useState<boolean>(false)

  useEffect(() => {
    setFaqContentForDisplay(faqContent.map((faqItem) => ({ ...faqItem, isUnrolled: false })))
  }, [faqContent])

  const handleClick = (id: number) => {
    setFaqContentForDisplay(
      faqContentForDisplay.map((faqItem) =>
        faqItem.id === id ? { ...faqItem, isUnrolled: !faqItem.isUnrolled } : faqItem
      )
    )
  }

  return (
    <div className="mb-8 mt-8 flex w-4/5 flex-col items-center gap-8 md:w-3/5">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-extrabold text-gray-950">Support / Aide</h1>
        <p className="text-gray-700">
          Vous avez une question sur l’application, un programme ou vous rencontrez un problème ?
          Notre équipe vous propose une sélection de réponses à vos questions, trouvez toutes les
          informations dont vous avez besoin.
        </p>
      </div>
      <Input
        className="w-full"
        placeholder="Rechercher par mot-clé"
        value={searchValue}
        onChange={(event) => {
          setSearchValue(event.target.value)
        }}
      />
      <div className="flex w-full flex-col gap-4">
        <div className="flex self-stretch rounded-full bg-blue-100 p-0.5">
          {faqQuestionCategory.map((faqItem) => (
            <div
              key={`faqQuestionCategory_${faqItem}`}
              className={cn(
                'flex flex-1 cursor-pointer items-center justify-center rounded-full px-3 py-1.5 text-sm text-gray-700',
                {
                  'bg-white text-blue-600': faqItem === selectedTab,
                }
              )}
              onClick={() => {
                setSelectedTab(faqItem)
                setIsContactItemOpen(false)
              }}
            >
              {faqQuestionCategoryEnum[faqItem]}
            </div>
          ))}
        </div>
        {faqContentForDisplay
          .filter(
            (item) =>
              item.category === selectedTab &&
              (item.question.toLowerCase().includes(searchValue.toLowerCase()) ||
                item.answer.toLowerCase().includes(searchValue.toLowerCase()))
          )
          .map((faqItem) => (
            <div
              key={`faqItem_${faqItem.id}`}
              className={cn(
                'flex cursor-pointer items-stretch gap-6 whitespace-pre-wrap rounded-2xl bg-blue-100 p-4',
                { 'bg-blue-50 transition-colors hover:bg-blue-100': !faqItem.isUnrolled }
              )}
              onClick={() => {
                handleClick(faqItem.id)
              }}
            >
              {faqItem.isUnrolled ? (
                <>
                  <MinusCircle className="h-6 w-6 flex-shrink-0 text-blue-600" />
                  <div className="flex grow flex-col gap-2">
                    <div className="flex grow font-semibold text-gray-950">{faqItem.question}</div>
                    <div className="text-sm text-gray-700">{faqItem.answer}</div>
                  </div>
                </>
              ) : (
                <>
                  <PlusCircle className="h-6 w-6 flex-shrink-0 text-blue-600" />
                  <div className="flex grow font-semibold text-gray-950">{faqItem.question}</div>
                </>
              )}
            </div>
          ))}
        <div
          className={cn(
            'flex cursor-pointer items-stretch gap-6 whitespace-pre-wrap rounded-2xl bg-blue-100 p-4',
            { 'bg-blue-50 transition-colors hover:bg-blue-100': !isContactItemOpen }
          )}
          onClick={() => {
            setIsContactItemOpen(!isContactItemOpen)
          }}
        >
          {isContactItemOpen ? (
            <>
              <MinusCircle className="h-6 w-6 flex-shrink-0 text-blue-600" />
              <div className="flex grow flex-col gap-2">
                <div className="flex grow font-semibold text-gray-950">
                  Vous ne trouvez pas votre réponse ?
                </div>
                <div className="text-sm text-gray-700">
                  Notre page Support / Aide a été conçue pour traiter toutes les questions et
                  problématiques récurrentes sur l’application. Nous vous invitons à n’utiliser ce
                  formulaire que si vous ne trouvez pas de réponse dans les diverses rubriques
                  (Général, Abonnement et Autres sujets)
                </div>
                <ContactModal {...user} />
              </div>
            </>
          ) : (
            <>
              <PlusCircle className="h-6 w-6 flex-shrink-0 text-blue-600" />
              <div className="flex grow font-semibold text-gray-950">
                Vous ne trouvez pas votre réponse ?
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
