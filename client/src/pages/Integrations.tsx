import { useApi, apiPatch } from '../hooks/useApi'
import { useAppContext } from '../App'

interface Integration {
  id: string
  name: string
  icon: string
  description: string
  status: string
  config: string
  agents: { id: string; name: string; avatar: string; enabled: number }[]
}

const INTEGRATION_DETAILS: Record<string, { color: string; features: string[] }> = {
  jira: {
    color: 'from-blue-500 to-blue-600',
    features: ['Bidirectional sync', 'Issue creation', 'Status updates', 'Sprint tracking'],
  },
  notion: {
    color: 'from-gray-800 to-gray-900 dark:from-gray-200 dark:to-gray-300',
    features: ['Context layer', 'Research storage', 'Knowledge base', 'Shared memory'],
  },
  slack: {
    color: 'from-purple-500 to-pink-500',
    features: ['Channel messages', 'DM support', 'Thread replies', 'Notifications'],
  },
  gmail: {
    color: 'from-red-500 to-orange-500',
    features: ['Send emails', 'Read inbox', 'Draft creation', 'Template support'],
  },
  gong: {
    color: 'from-green-500 to-emerald-600',
    features: ['Call transcripts', 'Action items', 'Meeting insights', 'Follow-up tasks'],
  },
  twitter: {
    color: 'from-sky-400 to-blue-500',
    features: ['Profile search', 'Tweet analysis', 'Sentiment tracking', 'Activity monitoring'],
  },
}

export default function Integrations() {
  const { data: integrations, loading, refetch } = useApi<Integration[]>('/integrations')
  const { role } = useAppContext()

  const toggleStatus = async (id: string, status: string) => {
    await apiPatch(`/integrations/${id}/status`, {
      status: status === 'connected' ? 'disconnected' : 'connected',
    })
    refetch()
  }

  if (loading) return <div className="animate-pulse"><div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-8" /><div className="grid grid-cols-3 gap-6">{[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />)}</div></div>

  return (
    <div className="px-8 py-6 max-w-[1400px]">
      <div className="mb-8">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">Integrations</h1>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">Manage your tool connections</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations?.map(integration => {
          const details = INTEGRATION_DETAILS[integration.id] || { color: 'from-gray-400 to-gray-500', features: [] }
          return (
            <div key={integration.id} className="card overflow-hidden">
              {/* Color header */}
              <div className={`h-2 bg-gradient-to-r ${details.color}`} />

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{integration.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{integration.name}</h3>
                      <span className={`badge ${integration.status === 'connected' ? 'badge-green' : 'badge-gray'}`}>
                        {integration.status}
                      </span>
                    </div>
                  </div>
                  {role === 'admin' && (
                    <button
                      onClick={() => toggleStatus(integration.id, integration.status)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        integration.status === 'connected'
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                          : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                      }`}
                    >
                      {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
                    </button>
                  )}
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{integration.description}</p>

                {/* Features */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Features</p>
                  <div className="grid grid-cols-2 gap-1">
                    {details.features.map(f => (
                      <p key={f} className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <span className="text-green-500">✓</span> {f}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Used by agents */}
                {integration.agents?.length > 0 && (
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Used by</p>
                    <div className="flex gap-2">
                      {integration.agents.map(a => (
                        <span key={a.id} className="badge badge-blue text-xs">{a.avatar} {a.name}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
