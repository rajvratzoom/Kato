import { useApi } from '../hooks/useApi'
import { useState } from 'react'

interface LogEntry {
  id: string
  workflow_id: string
  agent_id: string | null
  event_type: string
  message: string
  data: string | null
  timestamp: string
  workflow_task: string
  agent_name: string | null
  agent_avatar: string | null
}

export default function ExecutionLog() {
  const { data, loading, refetch } = useApi<{ logs: LogEntry[]; total: number }>('/logs?limit=200')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  const logs = data?.logs || []
  const filtered = filter
    ? logs.filter(l => l.event_type.includes(filter) || l.message.toLowerCase().includes(filter.toLowerCase()) || l.workflow_task?.toLowerCase().includes(filter.toLowerCase()))
    : logs

  if (loading) return <div style={{ padding: '20px 28px' }}><div style={{ height: 20, width: 100, background: 'var(--surface)', borderRadius: 4 }} /></div>

  return (
    <div style={{ padding: '20px 28px', maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Logs</h1>
        <button onClick={() => refetch()} className="btn-secondary">Refresh</button>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 14 }}>
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter by event type, message, or task..."
          style={{
            width: '100%', maxWidth: 360, background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', outline: 'none',
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 13 }}>No logs</div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {filtered.map((log, i) => (
            <div
              key={log.id}
              onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
              style={{
                padding: '8px 14px', cursor: 'pointer',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 10, fontWeight: 500, padding: '1px 5px', borderRadius: 3, background: 'var(--hover-bg)', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{log.event_type}</span>
                    {log.agent_name && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{log.agent_name}</span>}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{log.message}</p>
                  {log.workflow_task && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>{log.workflow_task}</p>}
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: 12 }}>
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>

              {expandedLog === log.id && log.data && (
                <div style={{ marginTop: 8, background: 'var(--bg)', borderRadius: 6, padding: 10 }}>
                  <pre style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', overflowX: 'auto', maxHeight: 180, margin: 0, fontFamily: 'monospace' }}>
                    {JSON.stringify(JSON.parse(log.data), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
