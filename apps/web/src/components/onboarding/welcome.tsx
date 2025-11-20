import { Button } from '@viastud/ui/button'

export function Welcome({ continueOnboarding }: { continueOnboarding: () => void }) {
  return (
    <>
      <h1 className="text-2xl font-semibold text-gray-950 sm:text-3xl">
        Bienvenue sur Via&apos;Stud
      </h1>
      <p className="text-gray-700">
        Pour personnaliser votre expérience, nous allons vous poser quelques questions.
      </p>
      <Button className="flex w-full rounded-full" onClick={continueOnboarding}>
        Commencer
      </Button>
    </>
  )
}
