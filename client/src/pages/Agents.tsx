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
      await apiPatch(`/agents/${agentId}/status`, { status: currentStatus === 'active' ? 'inactive' : 'active' })
      refetch()
    } finally { setToggling(null) }
  }

  if (loading) return <div style={{ padding: '20px 28px' }}><div style={{ height: 20, width: 80, background: 'var(--surface)', borderRadius: 4 }} /></div>

  return (
    <div style={{ padding: '20px 28px', maxWidth: 1100 }}>
      <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Agents</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {agents?.map(agent => (
          <div key={agent.id} className="card" style={{ padding: 16, opacity: agent.status === 'inactive' ? 0.5 : 1 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: agent.status === 'active' ? '#34d399' : 'var(--text-muted)' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{agent.name}</span>
                </div>
              </div>
              {role === 'admin' && (
                <button
                  onClick={() => toggleAgent(agent.id, agent.status)}
                  disabled={toggling === agent.id}
                  style={{
                    width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: agent.status === 'active' ? '#34d399' : 'var(--border)',
                    position: 'relative', transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 2, transition: 'left 0.2s',
                    left: agent.status === 'active' ? 18 : 2,
                  }} />
                </button>
              )}
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.4 }}>{agent.description}</p>

            {/* Capabilities */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
              {agent.capabilities.map(cap => (
                <span key={cap} style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: 'var(--hover-bg)', color: 'var(--text-muted)' }}>
                  {cap.replace(/_/g, ' ')}
                </span>
              ))}
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 16, paddingTop: 10, borderTop: '1px solid var(--border)', marginBottom: agent.recentTasks.length > 0 ? 10 : 0 }}>
              <div>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{agent.taskCount}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>tasks</span>
              </div>
              <div>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {agent.recentTasks.filter((t: any) => t.status === 'completed').length}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>completed</span>
              </div>
            </div>

            {/* Recent tasks */}
            {agent.recentTasks.length > 0 && (
              <div style={{ paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Recent</div>
                {agent.recentTasks.slice(0, 3).map((t: any) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>{t.task}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{t.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
