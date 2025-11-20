import { Link } from '@tanstack/react-router'
import { Button } from '@viastud/ui/button'
import { UserIcon } from '@viastud/ui/shared/user-icon'
import { Check, Copy, Edit3, Gift, Mail } from 'lucide-react'

import type { ProfilePresenter } from '@/presenters/profile.presenter'
import type { ProfilePromotionalCodePresenter } from '@/presenters/profile-promotional-code.presenter'

interface ProfileCardProps {
  presenter: ProfilePresenter
  promotionalCodePresenter: ProfilePromotionalCodePresenter
}

export function ProfileCard({ presenter, promotionalCodePresenter }: ProfileCardProps) {
  // const quizStats = presenter.getQuizStats()
  // const sheetStats = presenter.getSheetStats()

  if (!presenter.student) {
    return null
  }

  return (
    <div className="col-span-1 flex min-w-[260px] flex-col justify-between rounded-2xl bg-white p-6 shadow-lg">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <UserIcon
              firstName={presenter.student.firstName}
              lastName={presenter.student.lastName}
            />
            <div>
              <div className="text-lg font-semibold">
                {presenter.student.firstName} {presenter.student.lastName}
              </div>
              <div className="text-gray-600">{presenter.onBoardingData?.grade}</div>
            </div>
          </div>
          <Link to="/settings">
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            >
              <Edit3 className="mr-1 size-4" />
              Éditer
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="h-4 w-4" /> {presenter.student.email}
        </div>
        {/* <div className="flex items-center gap-2 text-sm text-gray-600">
          <Check className="h-4 w-4 text-green-600" /> Quiz terminés : {quizStats.completed} /{' '}
          {quizStats.total}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Book className="h-4 w-4 text-blue-600" /> Fiches lues : {sheetStats.read} /{' '}
          {sheetStats.total}
        </div> */}
      </div>
      <div />
      {promotionalCodePresenter.promotionalCodeData && (
        <div className="mt-6 flex flex-col gap-2 rounded-xl border border-purple-100 bg-purple-50 p-4">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-600" />
            <span className="font-semibold text-purple-800">Mon code de parrainage</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-purple-200 bg-white px-4 py-2">
            <span className="font-mono text-lg font-bold tracking-wider text-purple-900">
              {promotionalCodePresenter.promotionalCodeData.code}
            </span>
            <button
              onClick={promotionalCodePresenter.handleCopyCode}
              className="rounded p-1 hover:bg-purple-100"
              title="Copier le code"
            >
              {promotionalCodePresenter.copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 text-purple-600" />
              )}
            </button>
          </div>
          <span className="text-center text-xs text-purple-700">
            {promotionalCodePresenter.copied
              ? 'Code copié !'
              : 'Cliquez pour copier le code et le partager avec vos amis'}
          </span>
        </div>
      )}
    </div>
  )
}
