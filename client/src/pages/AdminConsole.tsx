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
      <div style={{ textAlign: 'center', padding: 80 }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Access Denied</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Admin or Manager role required</p>
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
    { id: 'agents' as const, label: 'Agents' },
    { id: 'integrations' as const, label: 'Integrations' },
    { id: 'roles' as const, label: 'Users & Roles' },
  ]

  return (
    <div style={{ padding: '20px 28px', maxWidth: 1100 }}>
      <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Admin</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, background: 'var(--hover-bg)', borderRadius: 6, padding: 2, width: 'fit-content' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '5px 14px', borderRadius: 4, fontSize: 13, fontWeight: 500,
              border: 'none', cursor: 'pointer',
              background: tab === t.id ? 'var(--surface)' : 'transparent',
              color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Agents */}
      {tab === 'agents' && (
        <div className="card">
          {agents?.map((agent: any, i: number) => (
            <div key={agent.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px',
              borderBottom: i < (agents?.length || 0) - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{agent.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{agent.taskCount} tasks</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{agent.status}</span>
                {role === 'admin' && (
                  <button
                    onClick={() => toggleAgent(agent.id, agent.status)}
                    style={{
                      width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: agent.status === 'active' ? '#34d399' : 'var(--border)',
                      position: 'relative',
                    }}
                  >
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: agent.status === 'active' ? 18 : 2, transition: 'left 0.2s' }} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Integrations */}
      {tab === 'integrations' && (
        <div className="card">
          {integrations?.map((intg: any, i: number) => (
            <div key={intg.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px',
              borderBottom: i < (integrations?.length || 0) - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{intg.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{intg.description}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{intg.status}</span>
                {role === 'admin' && (
                  <button
                    onClick={() => toggleIntegration(intg.id, intg.status)}
                    style={{
                      width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: intg.status === 'connected' ? '#34d399' : 'var(--border)',
                      position: 'relative',
                    }}
                  >
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: intg.status === 'connected' ? 18 : 2, transition: 'left 0.2s' }} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Roles */}
      {tab === 'roles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            {users?.map((user: any, i: number) => (
              <div key={user.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px',
                borderBottom: i < (users?.length || 0) - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</div>
                </div>
                {role === 'admin' ? (
                  <select
                    value={user.role_id}
                    onChange={e => changeRole(user.id, e.target.value)}
                    style={{
                      background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6,
                      padding: '4px 8px', fontSize: 12, color: 'var(--text-primary)',
                    }}
                  >
                    {roles?.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.role_name}</span>
                )}
              </div>
            ))}
          </div>

          {/* Role permissions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {roles?.map((r: any) => (
              <div key={r.id} className="card" style={{ padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, textTransform: 'capitalize' }}>{r.name}</div>
                {r.permissions.map((p: string) => (
                  <div key={p} style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                    · {p === '*' ? 'Full access' : p}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
