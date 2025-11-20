import type { ProfilePresenter } from '@/presenters/profile.presenter'

interface ProgressSectionProps {
  presenter: ProfilePresenter
}

export function ProgressSection({ presenter }: ProgressSectionProps) {
  const progressData = presenter.getProgressData()

  return (
    <div className="w-full px-4 md:px-12">
      <div className="w-full rounded-2xl bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-lg font-semibold">Progression par matière</h2>
        <div className="flex flex-col gap-4">
          {progressData.map((subject) => (
            <div
              key={subject.subject}
              className="flex items-center justify-between rounded-xl bg-gray-50 px-6 py-4"
            >
              <div>
                <div className="flex items-center gap-2 text-base font-semibold">
                  <span className={`inline-block h-3 w-3 rounded-full ${subject.color}`} />{' '}
                  {subject.subject}
                </div>
                <div className="text-xs text-gray-500">{subject.status}</div>
              </div>
              <div className="flex min-w-[180px] items-center gap-4">
                <div className="w-32">
                  <div className="h-2 rounded bg-gray-200">
                    <div
                      className={`h-2 rounded ${subject.color}`}
                      style={{ width: `${subject.progress}%` }}
                    />
                  </div>
                </div>
                <span className="font-semibold text-gray-700">{subject.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
