import { createFileRoute } from '@tanstack/react-router'

import DashboardComponent from '@/components/student-dashboard/student-dashboard'

export const Route = createFileRoute('/_student/_layout/')({
  component: () => <Dashboard />,
})

function Dashboard() {
  return <DashboardComponent />
}
