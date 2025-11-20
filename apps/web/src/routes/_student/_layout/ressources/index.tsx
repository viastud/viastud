import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@viastud/ui/button'
import { grade, GradeEnum } from '@viastud/utils'

export const Route = createFileRoute('/_student/_layout/ressources/')({
  component: Ressources,
})

function RessourcesComponent() {
  return (
    <div className="flex w-4/5 flex-col items-stretch gap-4 pt-4">
      <p className="text-2xl font-extrabold text-gray-950">Toutes les ressources</p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        {grade.map((grade) => (
          <Link
            to="/ressources/$grade"
            params={{ grade: grade.toLowerCase() }}
            className="flex"
            key={grade}
          >
            <Button
              variant="none"
              className="flex h-56 w-full grow items-center justify-center whitespace-normal rounded-2xl border border-blue-100 bg-blue-50 text-center text-xl font-bold text-gray-950 hover:border-blue-300 hover:bg-blue-100"
            >
              {GradeEnum[grade]}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  )
}

function Ressources() {
  return <RessourcesComponent />
}
