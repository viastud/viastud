export function Benefits() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 md:items-start">
      <div className="flex flex-col items-center gap-4 self-stretch md:items-start">
        <img
          src="/logos/viastud-text-logo.png"
          alt="viastud logo"
          className="hidden h-auto w-40 md:flex"
        />
        <div className="relative h-60 w-full">
          <img
            src="photos/profile-screenshot.png"
            alt="screenshot"
            className="absolute left-0 top-0 h-auto w-3/4 rounded-xl"
          />
          <img
            src="photos/dashboard_no_lessons.svg"
            alt="screenshot"
            className="absolute bottom-0 right-0 h-auto w-3/4 rounded-xl"
          />
        </div>
        <div className="hidden flex-col items-start gap-4 self-stretch md:flex">
          <p className="text-3xl font-semibold text-gray-950">Rejoignez Viastud !</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-5 self-stretch">
        <div className="flex flex-col items-start gap-6 self-stretch">
          <div className="flex flex-col gap-2 rounded-2xl bg-yellow-200 p-6">
            <p className="font-semibold text-gray-950">Cours illimités</p>
            <p className="text-gray-700">
              Nos professeurs sont là pour t&apos;accompagner en visio !
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl bg-yellow-400 p-6">
            <p className="font-semibold text-gray-950">Contenu d&apos;élite</p>
            <p className="text-gray-700">
              Fiches, annales et sujets inédits conçus par des alumnis de Polytechnique et
              l&apos;École Normale Supérieure.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
