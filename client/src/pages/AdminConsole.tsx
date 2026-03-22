import { useApi, apiPatch } from '../hooks/useApi'
import { useAppContext } from '../App'
import { useState } from 'react'

export default function AdminConsole() {
  const { role } = useAppContext()
  const { data: agents, refetch: refetchAgents } = useApi<any[]>('/agents')
  const { data: integrations, refetch: refetchIntegrations } = useApi<any[]>('/integrations')
  const { data: users, refetch: refetchUsers } = useApi<any[]>('/admin/users')
  const { data: roles } = useApi<any[]>('/admin/roles')
  const [tab, setTab] = useState<'agents' | 'integrations' | 'roles'>('agents')

  if (role !== 'admin' && role !== 'manager') {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">🔒</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-gray-500 dark:text-gray-400">You need Admin or Manager role to access the Admin Console</p>
      </div>
    )
  }

  const toggleAgent = async (id: string, status: string) => {
    await apiPatch(`/agents/${id}/status`, { status: status === 'active' ? 'inactive' : 'active' })
    refetchAgents()
  }

  const toggleIntegration = async (id: string, status: string) => {
    await apiPatch(`/integrations/${id}/status`, { status: status === 'connected' ? 'disconnected' : 'connected' })
    refetchIntegrations()
  }

  const changeRole = async (userId: string, roleId: string) => {
    await apiPatch(`/admin/users/${userId}/role`, { roleId })
    refetchUsers()
  }

  const TABS = [
    { id: 'agents' as const, label: 'Agents', icon: '🤖' },
    { id: 'integrations' as const, label: 'Integrations', icon: '🔗' },
    { id: 'roles' as const, label: 'Users & Roles', icon: '👥' },
  ]

  return (
    <div className="px-8 py-6 max-w-[1400px]">
      <div className="mb-8">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">Admin Console</h1>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">Manage agents, integrations, and access control</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Agents tab */}
      {tab === 'agents' && (
        <div className="card">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white">Agent Management</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Activate or deactivate agents</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {agents?.map((agent: any) => (
              <div key={agent.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{agent.avatar}</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{agent.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{agent.taskCount} tasks handled</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${agent.status === 'active' ? 'badge-green' : 'badge-red'}`}>{agent.status}</span>
                  {role === 'admin' && (
                    <button
                      onClick={() => toggleAgent(agent.id, agent.status)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${agent.status === 'active' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-sm ${agent.status === 'active' ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Integrations tab */}
      {tab === 'integrations' && (
        <div className="card">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white">Integration Management</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Connect or disconnect integrations</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {integrations?.map((integration: any) => (
              <div key={integration.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{integration.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{integration.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{integration.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${integration.status === 'connected' ? 'badge-green' : 'badge-gray'}`}>
                      {integration.status}
                    </span>
                    {role === 'admin' && (
                      <button
                        onClick={() => toggleIntegration(integration.id, integration.status)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${integration.status === 'connected' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-sm ${integration.status === 'connected' ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    )}
                  </div>
                </div>
                {/* Agent assignments */}
                {integration.agents?.length > 0 && (
                  <div className="mt-2 ml-11 flex gap-2">
                    <span className="text-xs text-gray-400">Used by:</span>
                    {integration.agents.map((a: any) => (
                      <span key={a.id} className="badge badge-blue text-xs">{a.avatar} {a.name}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Roles tab */}
      {tab === 'roles' && (
        <div className="space-y-6">
          <div className="card">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">Users</h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {users?.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {role === 'admin' ? (
                      <select
                        value={user.role_id}
                        onChange={e => changeRole(user.id, e.target.value)}
                        className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-kato-500"
                      >
                        {roles?.map((r: any) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="badge badge-blue">{user.role_name}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Role Permissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {roles?.map((r: any) => (
                <div key={r.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="font-medium text-gray-900 dark:text-white mb-2 capitalize">{r.name}</p>
                  <div className="space-y-1">
                    {r.permissions.map((p: string) => (
                      <p key={p} className="text-xs text-gray-500 dark:text-gray-400">• {p === '*' ? 'Full access' : p}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
