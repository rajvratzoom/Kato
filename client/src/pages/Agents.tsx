import { useApi, apiPatch } from '../hooks/useApi'
import { useAppContext } from '../App'
import { useState } from 'react'

interface Agent {
  id: string
  name: string
  type: string
  description: string
  avatar: string
  status: string
  capabilities: string[]
  taskCount: number
  recentTasks: any[]
}

export default function Agents() {
  const { data: agents, loading, refetch } = useApi<Agent[]>('/agents')
  const { role } = useAppContext()
  const [toggling, setToggling] = useState<string | null>(null)

  const toggleAgent = async (agentId: string, currentStatus: string) => {
    setToggling(agentId)
    try {
      await apiPatch(`/agents/${agentId}/status`, {
        status: currentStatus === 'active' ? 'inactive' : 'active',
      })
      refetch()
    } finally {
      setToggling(null)
    }
  }

  if (loading) return <div className="animate-pulse"><div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-8" /><div className="grid grid-cols-2 gap-6">{[1,2].map(i => <div key={i} className="h-80 bg-gray-200 dark:bg-gray-800 rounded-xl" />)}</div></div>

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Interns</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Meet your AI team members</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {agents?.map(agent => (
          <div key={agent.id} className={`card p-6 ${agent.status === 'inactive' ? 'opacity-60' : ''}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
                  agent.type === 'research'
                    ? 'bg-blue-100 dark:bg-blue-900/30'
                    : 'bg-purple-100 dark:bg-purple-900/30'
                }`}>
                  {agent.avatar}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{agent.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">{agent.status}</span>
                  </div>
                </div>
              </div>
              {role === 'admin' && (
                <button
                  onClick={() => toggleAgent(agent.id, agent.status)}
                  disabled={toggling === agent.id}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    agent.status === 'active' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-sm ${
                    agent.status === 'active' ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              )}
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{agent.description}</p>

            {/* Capabilities */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Capabilities</p>
              <div className="flex flex-wrap gap-2">
                {agent.capabilities.map(cap => (
                  <span key={cap} className="badge badge-gray text-xs">{cap.replace(/_/g, ' ')}</span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mb-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{agent.taskCount}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tasks handled</p>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {agent.recentTasks.filter((t: any) => t.status === 'completed').length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
              </div>
            </div>

            {/* Recent tasks */}
            {agent.recentTasks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Recent Tasks</p>
                <div className="space-y-2">
                  {agent.recentTasks.slice(0, 3).map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300 truncate flex-1">{t.task}</span>
                      <span className={`badge ml-2 ${t.status === 'completed' ? 'badge-green' : t.status === 'failed' ? 'badge-red' : 'badge-yellow'}`}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
