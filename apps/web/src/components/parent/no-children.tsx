import { Button } from '@viastud/ui/button'
import { CheckCircle } from 'lucide-react'
import type React from 'react'

interface NoChildrenProps {
  onGoToProfile?: () => void
}

const infoBlocks = [
  { icon: <CheckCircle className="h-5 w-5 text-yellow-700" />, text: 'Objectifs personnalisés' },
  { icon: <CheckCircle className="h-5 w-5 text-yellow-700" />, text: 'Dernières activités' },
  { icon: <CheckCircle className="h-5 w-5 text-yellow-700" />, text: 'Suivi hebdomadaire' },
]

const NoChildren: React.FC<NoChildrenProps> = ({ onGoToProfile }) => (
  <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-8">
    <img
      src="/photos/dashboard_no_lessons.svg"
      alt="Aucune donnée enfant pour l'instant"
      className="mx-auto mb-10 h-64 w-64"
    />
    <h1 className="mb-4 text-center text-2xl font-extrabold text-gray-900 md:text-3xl">
      Bienvenue sur Viastud{' '}
      <span aria-label="salut" role="img">
        👋
      </span>
    </h1>
    <h2 className="mb-8 max-w-2xl text-center text-base font-medium text-gray-700 md:text-lg">
      Ici, vous pourrez suivre les progrès de vos enfants en un clin d&apos;œil.
    </h2>
    <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-6">
      {infoBlocks.map((block, idx) => (
        <div key={idx} className="flex w-full sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-1.5rem)]">
          <div className="flex w-full items-center gap-3 rounded-xl bg-yellow-200 px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
              {block.icon}
            </span>
            <span className="text-base font-semibold text-yellow-800">{block.text}</span>
          </div>
        </div>
      ))}
    </div>
    <p className="mb-8 mt-8 max-w-xl text-center text-lg text-gray-600">
      Pour commencer, reliez un compte enfant à votre profil.
    </p>
    <Button
      onClick={onGoToProfile}
      variant="default"
      size="lg"
      className="w-full max-w-sm rounded-full py-4 text-lg shadow"
    >
      Accéder à mon profil
    </Button>
  </div>
)

export default NoChildren
