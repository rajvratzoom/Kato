import { useApi } from '../hooks/useApi'

interface Stats {
  totalWorkflows: number
  completedWorkflows: number
  failedWorkflows: number
  activeAgents: number
  totalAgents: number
  connectedIntegrations: number
  totalIntegrations: number
  successRate: number
  recentWorkflows: any[]
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: 'badge-green',
    running: 'badge-blue',
    processing: 'badge-blue',
    failed: 'badge-red',
    pending: 'badge-yellow',
    needs_approval: 'badge-yellow',
    needs_input: 'badge-yellow',
  }
  return <span className={`badge ${styles[status] || 'badge-gray'}`}>{status}</span>
}

export default function Dashboard() {
  const { data: stats, loading } = useApi<Stats>('/admin/stats')

  if (loading) return <LoadingSkeleton />

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Your AI intern team at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Workflows" value={stats?.totalWorkflows || 0} icon="🔄" subtitle="all time" />
        <StatCard title="Success Rate" value={`${stats?.successRate || 0}%`} icon="✅" subtitle={`${stats?.completedWorkflows || 0} completed`} color="green" />
        <StatCard title="Active Agents" value={`${stats?.activeAgents || 0}/${stats?.totalAgents || 0}`} icon="🤖" subtitle="online" color="blue" />
        <StatCard title="Integrations" value={`${stats?.connectedIntegrations || 0}/${stats?.totalIntegrations || 0}`} icon="🔗" subtitle="connected" color="purple" />
      </div>

      {/* Recent workflows */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Workflows</h2>
        {!stats?.recentWorkflows?.length ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-4xl mb-3">🎯</p>
            <p className="font-medium">No workflows yet</p>
            <p className="text-sm">Head to Command Center to submit your first task</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentWorkflows.map((w: any) => (
              <div key={w.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{w.agent_avatar || '🤖'}</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{w.task}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {w.agent_name || 'Unrouted'} • {new Date(w.started_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <StatusBadge status={w.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, subtitle, color }: { title: string; value: string | number; icon: string; subtitle: string; color?: string }) {
  const colorMap: Record<string, string> = {
    green: 'from-green-500 to-emerald-600',
    blue: 'from-blue-500 to-indigo-600',
    purple: 'from-purple-500 to-violet-600',
  }
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{icon}</span>
        {color && <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${colorMap[color]}`} />}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-8" />
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />)}
      </div>
      <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
    </div>
  )
}
