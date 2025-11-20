import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

export function ResetLinkSent() {
  return (
    <div className="shadow-custom my-auto flex w-[400px] flex-col items-stretch justify-center gap-8 rounded-2xl bg-white p-6">
      <div className="flex flex-col items-center">
        <img src="/logos/viastud-logo.svg" alt="viastud logo" className="size-12" />
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-[32px] text-gray-950">Merci !</h2>
        </div>
      </div>
      <div className="flex items-center self-stretch rounded-lg p-4">
        <p className="flex text-sm font-medium text-gray-600">
          Un e-mail contenant un lien de réinitialisation de mot de passe vient de vous être envoyé.
          Pensez à vérifier vos spams.
        </p>
      </div>
      <Link to="/login" className="flex cursor-pointer items-center gap-2 self-center">
        <ArrowLeft className="h-5 w-5 text-violet-400" />
        <p className="text-sm font-semibold text-blue-800">Retour à la page de connexion</p>
      </Link>
    </div>
  )
}
