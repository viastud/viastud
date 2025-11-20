import { createFileRoute, Link, linkOptions, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/courses/_tabs')({
  component: Courses,
})

const tabs = [
  linkOptions({
    to: '/courses/chapters',
    label: 'Chapitres',
  }),
  linkOptions({
    to: '/courses/modules',
    label: 'Modules',
  }),
  linkOptions({
    to: '/courses/sheets',
    label: 'Fiches de cours',
  }),
  linkOptions({
    to: '/courses/summarized-sheets',
    label: 'Fiches résumées',
  }),
  linkOptions({
    to: '/courses/quizzes',
    label: 'Quiz',
  }),
  linkOptions({
    to: '/courses/exercices',
    label: 'Exercices',
  }),
  linkOptions({
    to: '/courses/past-papers',
    label: 'Anciens sujets',
  }),
  linkOptions({
    to: '/courses/sessions',
    label: 'Séances',
  }),
]

function Courses() {
  return (
    <div className="flex w-full flex-col items-center">
      <div className="mb-4 mt-8 flex w-4/5 items-center rounded-full bg-blue-100 p-0.5">
        {tabs.map((option) => (
          <Link
            className="flex grow items-center justify-center gap-[10px] rounded-full px-3 py-1.5"
            activeProps={{
              className: 'bg-white hover:bg-white text-blue-600 hover:text-blue-600',
            }}
            key={option.to}
            to={option.to}
          >
            {option.label}
          </Link>
        ))}
      </div>
      <Outlet />
    </div>
  )
}
