import { createFileRoute } from '@tanstack/react-router'

import { AllStudentComments } from '@/components/student-dashboard/all-student-comments'

export const Route = createFileRoute('/_student/comments')({
  component: CommentsPage,
})

function CommentsPage() {
  return (
    <div className="py-8">
      <AllStudentComments />
    </div>
  )
}
