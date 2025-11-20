import { createFileRoute } from '@tanstack/react-router'
import type { Grade } from '@viastud/utils'

import { BookCourse } from '@/components/student-dashboard/book-course'
import { useStudentDashboardPresenter } from '@/presenters/student-dashboard.presenter'

export const Route = createFileRoute('/_student/_layout/book-courses')({
  component: BookCoursesPage,
})

function BookCoursesPage() {
  const presenter = useStudentDashboardPresenter()

  return (
    <BookCourse
      selectedGrade={presenter.selectedGrade}
      setSelectedGrade={(grade) => {
        presenter.setSelectedGrade(grade as Grade)
      }}
      selectedSubjects={presenter.selectedSubjects}
      setSelectedSubjects={presenter.setSelectedSubjects}
      searchValue={presenter.searchValue}
      setSearchValue={presenter.setSearchValue}
      selectedModuleId={presenter.selectedModuleId}
      setSelectedModuleId={presenter.setSelectedModuleId}
      filteredModules={presenter.filteredModules}
      navigate={presenter.navigate}
      setCurrentPage={(page) => {
        if (page === 'LESSONS') {
          void presenter.navigate({ to: '/' })
        }
      }}
    />
  )
}
