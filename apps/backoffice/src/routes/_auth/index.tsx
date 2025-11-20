import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@viastud/ui/button'
import { useState } from 'react'

import { BusinessLogs } from '@/components/admin/business-logs'
import { MonitoringDashboard } from '@/components/admin/monitoring-dashboard'

export const Route = createFileRoute('/_auth/')({
  component: Dashboard,
})

function Dashboard() {
  const [activeTab, setActiveTab] = useState<'monitoring' | 'logs'>('monitoring')

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Administrateur</h1>
      </div>

      <div className="flex space-x-2 border-b">
        <Button
          variant={activeTab === 'monitoring' ? 'default' : 'outline'}
          onClick={() => {
            setActiveTab('monitoring')
          }}
        >
          Monitoring
        </Button>
        <Button
          variant={activeTab === 'logs' ? 'default' : 'outline'}
          onClick={() => {
            setActiveTab('logs')
          }}
        >
          Logs Métier
        </Button>
      </div>

      <div className="mt-6">
        {activeTab === 'monitoring' && <MonitoringDashboard />}
        {activeTab === 'logs' && <BusinessLogs />}
      </div>
    </div>
  )
}
