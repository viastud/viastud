import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@viastud/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@viastud/ui/card'
import { BookOpen, CheckCircle, Rocket, Users } from 'lucide-react'

export const Route = createFileRoute('/_student/_layout/waiting-message')({
  component: WaitingMessage,
})

export default function WaitingMessage() {
  return (
    <div className="flex h-full w-4/5 flex-col items-center justify-center gap-6 pt-4">
      {/* Message de remerciement */}
      <Card className="fade-in mx-auto mb-6 w-full max-w-4xl border-blue-300 bg-blue-50">
        <CardHeader className="text-center">
          <CardTitle className="text-lg font-bold text-blue-600 md:text-xl">
            Merci pour ton inscription <span className="align-middle">🙌</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm text-gray-600 md:text-base">
          À partir du 4 septembre, tu pourras tester la plateforme en illimité !
        </CardContent>
      </Card>

      {/* Cartes des fonctionnalités */}
      <div className="fade-in flex w-full flex-col items-center">
        <div className="mt-4 flex w-full max-w-4xl flex-col justify-center gap-6 md:flex-row">
          {/* Carte 1 - Contenus exclusifs */}
          <Card className="flex flex-1 flex-col items-center border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 shadow-md">
                <BookOpen size={28} color="white" />
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-lg font-semibold text-gray-900">
                Accède à tous nos contenus exclusifs
                <br />
                (cours, exercices, fiches de révision)
              </p>
            </CardContent>
          </Card>

          {/* Carte 2 - Accompagnement professeurs */}
          <Card className="flex flex-1 flex-col items-center border-blue-200 bg-blue-50">
            <CardHeader className="text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 shadow-md">
                <Users size={28} color="white" />
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-lg font-semibold text-gray-900">
                Bénéficie de l&apos;accompagnement de nos professeurs pour t&apos;aider à progresser
              </p>
            </CardContent>
          </Card>

          {/* Carte 3 - Suivi personnalisé */}
          <Card className="flex flex-1 flex-col items-center border-purple-200 bg-purple-50">
            <CardHeader className="text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-purple-500 shadow-md">
                <Rocket size={28} color="white" />
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-lg font-semibold text-gray-900">
                Commence l&apos;année sur de solides bases et sois suivi(e) tout au long de
                l&apos;année scolaire
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section finale avec gradient */}
      <Card className="fade-in mb-2 w-full max-w-4xl border-0 bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex w-full flex-col items-center">
            <div className="mb-2 flex items-center gap-2">
              <CheckCircle size={28} color="#4ADE80" strokeWidth={2} />
              <span className="text-lg font-extrabold text-white md:text-xl">
                Nous sommes ravis de t&apos;accompagner dans ta réussite.
              </span>
            </div>
            <div className="mb-3 text-center text-base font-medium text-white md:text-lg">
              Prépare-toi à vivre une expérience scolaire différente, plus simple, plus efficace, et
              surtout, à ton rythme.
            </div>
            <div className="mt-6 flex w-full justify-center">
              <Button
                variant="outline"
                className="flex items-center gap-2 rounded-full border-2 border-blue-200 bg-white/90 px-6 py-2 text-lg font-bold tracking-wide text-blue-700 shadow-lg ring-2 ring-blue-100/60 backdrop-blur transition"
                style={{
                  boxShadow: '0 4px 24px 0 rgba(51, 71, 255, 0.10), 0 1.5px 8px 0 rgba(0,0,0,0.06)',
                }}
              >
                <span className="text-2xl">🎯</span>
                Objectif&nbsp;: Ta réussite scolaire
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  )
}
