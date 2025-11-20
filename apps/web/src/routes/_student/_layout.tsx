import { createFileRoute, Outlet } from '@tanstack/react-router'

import StudentHeader from '@/components/student-header'

export const Route = createFileRoute('/_student/_layout')({
  component: () => (
    <>
      <StudentHeader />
      <Outlet />
    </>
  ),
})
