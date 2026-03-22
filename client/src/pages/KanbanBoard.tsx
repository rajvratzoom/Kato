import { useApi, apiPatch } from '../hooks/useApi'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface KanbanData { queue: any[]; inProgress: any[]; needsYou: any[]; done: any[] }
interface Stats { totalWorkflows: number; successRate: number; activeAgents: number; totalAgents: number }

function timeAgo(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr + 'Z')
  const mins = Math.floor((now.getTime() - date.getTime()) / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export default function KanbanBoard() {
  const { data: kanban, loading, refetch } = useApi<KanbanData>('/tasks/kanban')
  const { data: stats } = useApi<Stats>('/admin/stats')

  if (loading) return <BoardSkeleton />

  return (
    <div style={{ padding: '20px 28px', maxWidth: 1400 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Board</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13 }}>
          <StatPill label="Tasks" value={stats?.totalWorkflows || 0} />
          <StatPill label="Success" value={`${stats?.successRate || 0}%`} />
          <StatPill label="Active" value={`${stats?.activeAgents || 0}/${stats?.totalAgents || 0}`} />
          <button onClick={() => refetch()} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>↻</button>
        </div>
      </div>

      {/* Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, height: 'calc(100vh - 100px)' }}>
        <Column title="Queue" count={kanban?.queue?.length || 0}>
          {kanban?.queue?.map(t => <TaskCard key={t.id} task={t} />)}
        </Column>
        <Column title="In Progress" count={kanban?.inProgress?.length || 0}>
          {kanban?.inProgress?.map(t => <TaskCard key={t.id} task={t} />)}
        </Column>
        <Column title="Needs You" count={kanban?.needsYou?.length || 0}>
          {kanban?.needsYou?.map(t => <ActionCard key={t.id} task={t} onAction={refetch} />)}
        </Column>
        <Column title="Done" count={kanban?.done?.length || 0}>
          {kanban?.done?.map(t => <TaskCard key={t.id} task={t} />)}
        </Column>
      </div>
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

function Column({ title, count, children }: { title: string; count: number; children?: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{title}</span>
        {count > 0 && (
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--hover-bg)', padding: '1px 6px', borderRadius: 4 }}>{count}</span>
        )}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {!children || (Array.isArray(children) && children.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 11, color: 'var(--text-muted)' }}>No tasks</div>
        ) : children}
      </div>
    </div>
  )
}

function TaskCard({ task }: { task: any }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={() => navigate(`/task/${task.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg)', borderRadius: 6,
        padding: '10px 12px', cursor: 'pointer',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.12)' : 'var(--border)'}`,
        transition: 'border-color 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{task.agent_name || 'Unrouted'}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(task.started_at)}</span>
      </div>
      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4, margin: 0 }} className="line-clamp-2">{task.task}</p>
    </div>
  )
}

function ActionCard({ task, onAction }: { task: any; onAction: () => void }) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const isApproval = task.status === 'needs_approval'

  const handle = async (action: string, body?: any) => {
    setSubmitting(true)
    try { await apiPatch(`/tasks/${task.id}/${action}`, body || {}); onAction() }
    finally { setSubmitting(false) }
  }

  return (
    <div style={{ background: 'var(--bg)', borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{task.agent_name}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)', background: 'rgba(92,124,250,0.1)', padding: '1px 5px', borderRadius: 3 }}>
            {isApproval ? 'Approve' : 'Input'}
          </span>
        </div>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4, margin: 0 }} className="line-clamp-2">{task.task}</p>
      </div>

      {expanded && (
        <div style={{ padding: '8px 12px 12px', borderTop: '1px solid var(--border)' }}>
          {isApproval && task.result && (
            <>
              {task.result.draft && (
                <div style={{ background: 'var(--hover-bg)', borderRadius: 6, padding: 10, fontSize: 12, marginBottom: 8, maxHeight: 120, overflow: 'auto' }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>To: {task.result.draft.to}</div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Re: {task.result.draft.subject}</div>
                  <div style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{task.result.draft.body}</div>
                </div>
              )}
              {task.result.message && (
                <div style={{ background: 'var(--hover-bg)', borderRadius: 6, padding: 10, fontSize: 12, marginBottom: 8 }}>
                  <div style={{ color: 'var(--text-muted)' }}>Channel: {task.result.message.channel}</div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{task.result.message.message}</div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => handle('approve')} disabled={submitting} className="btn-primary" style={{ flex: 1, padding: '6px 0' }}>Approve</button>
                <button onClick={() => handle('reject')} disabled={submitting} className="btn-secondary" style={{ flex: 1, padding: '6px 0', color: '#ef4444' }}>Reject</button>
              </div>
            </>
          )}
          {!isApproval && task.required_fields && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {task.required_fields.map((field: any) => (
                <div key={field.id}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>{field.label}</label>
                  <input
                    type="text"
                    value={formData[field.id] || ''}
                    onChange={e => setFormData(p => ({ ...p, [field.id]: e.target.value }))}
                    placeholder={field.placeholder}
                    style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: 'var(--text-primary)' }}
                  />
                </div>
              ))}
              <button onClick={() => handle('input', { input: formData })} disabled={submitting} className="btn-primary" style={{ padding: '6px 0' }}>Submit</button>
            </div>
          )}
          <button onClick={() => navigate(`/task/${task.id}`)} style={{ width: '100%', fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, marginTop: 6, padding: '4px 0' }}>
            Full view →
          </button>
        </div>
      )}
    </div>
  )
}

function BoardSkeleton() {
  return (
    <div style={{ padding: '20px 28px' }}>
      <div style={{ height: 20, width: 60, background: 'var(--surface)', borderRadius: 4, marginBottom: 16 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, height: 'calc(100vh - 100px)' }}>
        {[1,2,3,4].map(i => <div key={i} style={{ background: 'var(--surface)', borderRadius: 8 }} />)}
      </div>
    </div>
  )
}
