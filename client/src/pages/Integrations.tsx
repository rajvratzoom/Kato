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

const FEATURES: Record<string, string[]> = {
  jira: ['Bidirectional sync', 'Issue creation', 'Status updates', 'Sprint tracking'],
  notion: ['Context layer', 'Research storage', 'Knowledge base', 'Shared memory'],
  slack: ['Channel messages', 'DM support', 'Thread replies', 'Notifications'],
  gmail: ['Send emails', 'Read inbox', 'Draft creation', 'Template support'],
  gong: ['Call transcripts', 'Action items', 'Meeting insights', 'Follow-up tasks'],
  twitter: ['Profile search', 'Tweet analysis', 'Sentiment tracking', 'Activity monitoring'],
}

export default function Integrations() {
  const { data: integrations, loading, refetch } = useApi<Integration[]>('/integrations')
  const { role } = useAppContext()

  const toggleStatus = async (id: string, status: string) => {
    await apiPatch(`/integrations/${id}/status`, { status: status === 'connected' ? 'disconnected' : 'connected' })
    refetch()
  }

  if (loading) return <div style={{ padding: '20px 28px' }}><div style={{ height: 20, width: 100, background: 'var(--surface)', borderRadius: 4 }} /></div>

  return (
    <div style={{ padding: '20px 28px', maxWidth: 1100 }}>
      <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Integrations</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {integrations?.map(intg => {
          const features = FEATURES[intg.id] || []
          return (
            <div key={intg.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{intg.name}</div>
                  <span style={{
                    fontSize: 11, color: intg.status === 'connected' ? '#34d399' : 'var(--text-muted)',
                  }}>{intg.status}</span>
                </div>
                {role === 'admin' && (
                  <button
                    onClick={() => toggleStatus(intg.id, intg.status)}
                    style={{
                      fontSize: 11, padding: '3px 8px', borderRadius: 4, border: 'none', cursor: 'pointer', fontWeight: 500,
                      background: intg.status === 'connected' ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.1)',
                      color: intg.status === 'connected' ? '#ef4444' : '#34d399',
                    }}
                  >
                    {intg.status === 'connected' ? 'Disconnect' : 'Connect'}
                  </button>
                )}
              </div>

              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.4 }}>{intg.description}</p>

              {features.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  {features.map(f => (
                    <div key={f} style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ color: '#34d399' }}>✓</span> {f}
                    </div>
                  ))}
                </div>
              )}

              {intg.agents?.length > 0 && (
                <div style={{ paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Used by</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {intg.agents.map(a => (
                      <span key={a.id} style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: 'var(--hover-bg)', color: 'var(--text-secondary)' }}>
                        {a.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
