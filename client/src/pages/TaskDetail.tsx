import { useParams, useNavigate } from 'react-router-dom'
import { useApi, apiPost, apiPatch } from '../hooks/useApi'
import { useState, useRef, useEffect } from 'react'

interface PlanStep {
  id: string; agent: string; agentAvatar: string; action: string;
  description: string; status: string; tools: string[]; output?: any;
}
interface Message { id: string; role: string; message: string; timestamp: string }

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  completed: { label: 'Done', color: '#34d399' },
  running: { label: 'Running', color: '#5c7cfa' },
  pending: { label: 'Pending', color: 'var(--text-muted)' },
  waiting: { label: 'Waiting', color: '#f59e0b' },
  failed: { label: 'Failed', color: '#ef4444' },
}

export default function TaskDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: task, loading, refetch } = useApi<any>(`/tasks/${id}`)
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (task?.messages) setMessages(task.messages) }, [task?.messages])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async () => {
    if (!msg.trim() || sending) return
    setSending(true)
    try {
      const res = await apiPost(`/tasks/${id}/message`, { message: msg })
      setMessages(res.messages)
      setMsg('')
      refetch()
    } finally { setSending(false) }
  }

  if (loading) return <div style={{ padding: '20px 28px' }}><div style={{ height: 20, width: 120, background: 'var(--surface)', borderRadius: 4 }} /></div>
  if (!task) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>Task not found</div>

  const plan: PlanStep[] = task.execution_plan || []
  const completedSteps = plan.filter(s => s.status === 'completed').length
  const progress = plan.length > 0 ? Math.round((completedSteps / plan.length) * 100) : 0

  return (
    <div style={{ maxWidth: 1100, padding: '20px 28px' }}>
      {/* Back */}
      <button onClick={() => navigate(-1)} style={{ fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16, padding: 0 }}>
        ← Back
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{task.task}</h1>
            <span style={{
              fontSize: 11, fontWeight: 500, padding: '2px 6px', borderRadius: 4,
              background: 'var(--hover-bg)', color: 'var(--text-secondary)',
            }}>{task.status.replace(/_/g, ' ')}</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            {task.agent_name || 'Kato'} · Started {new Date(task.started_at + 'Z').toLocaleString()}
          </p>
        </div>
        {task.status === 'needs_approval' && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={async () => { await apiPatch(`/tasks/${id}/approve`, {}); refetch() }} className="btn-primary">Approve</button>
            <button onClick={async () => { await apiPatch(`/tasks/${id}/reject`, {}); refetch() }} className="btn-secondary" style={{ color: '#ef4444' }}>Reject</button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}>
        {/* Left: Plan + Result */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Plan */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Execution Plan</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{completedSteps}/{plan.length}</span>
            </div>
            <div style={{ width: '100%', height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ height: '100%', background: '#5c7cfa', borderRadius: 2, width: `${progress}%`, transition: 'width 0.3s' }} />
            </div>

            <div>
              {plan.map((step, i) => {
                const st = STATUS_MAP[step.status] || STATUS_MAP.pending
                const isLast = i === plan.length - 1
                return (
                  <div key={step.id} style={{ display: 'flex', gap: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: st.color, marginTop: 4, flexShrink: 0 }} />
                      {!isLast && <div style={{ width: 1, flex: 1, background: 'var(--border)', margin: '4px 0' }} />}
                    </div>
                    <div style={{ flex: 1, paddingBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{step.action}</span>
                        <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', background: 'var(--hover-bg)', padding: '1px 5px', borderRadius: 3 }}>{st.label}</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>{step.description}</p>
                      {step.tools.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                          {step.tools.map(t => (
                            <span key={t} style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: 'var(--hover-bg)', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Result */}
          {task.result && (
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Output</div>
              {task.result.summary && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 8px' }}>{task.result.summary}</p>}
              {task.result.keyFindings && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {task.result.keyFindings.map((f: string, i: number) => (
                    <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', paddingLeft: 10, position: 'relative', marginBottom: 3 }}>
                      <span style={{ position: 'absolute', left: 0, color: 'var(--accent)' }}>·</span>{f}
                    </li>
                  ))}
                </ul>
              )}
              {task.result.draft && (
                <div style={{ background: 'var(--hover-bg)', borderRadius: 6, padding: 12, marginTop: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>To: {task.result.draft.to}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Subject: {task.result.draft.subject}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{task.result.draft.body}</div>
                </div>
              )}
            </div>
          )}

          {/* Input form */}
          {task.status === 'needs_input' && task.required_fields && (
            <InputForm taskId={task.id} fields={task.required_fields} onSubmit={refetch} />
          )}
        </div>

        {/* Right: Chat */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)', position: 'sticky', top: 20 }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 5, background: '#5c7cfa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700 }}>K</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Kato</div>
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', borderRadius: m.role === 'user' ? '8px 8px 2px 8px' : '8px 8px 8px 2px',
                  padding: '8px 12px',
                  background: m.role === 'user' ? 'rgba(92,124,250,0.15)' : 'var(--hover-bg)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                }}>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-primary)', margin: 0 }}>{m.message}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, margin: 0 }}>
                    {new Date(m.timestamp + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={msg}
                onChange={e => setMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Talk to Kato about this task..."
                style={{
                  width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: 6, padding: '8px 36px 8px 12px', fontSize: 13,
                  color: 'var(--text-primary)', outline: 'none',
                }}
                disabled={sending}
              />
              <button
                onClick={sendMessage}
                disabled={!msg.trim() || sending}
                style={{
                  position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                  width: 24, height: 24, borderRadius: 5, background: '#5c7cfa',
                  color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: !msg.trim() || sending ? 0.3 : 1,
                }}
              >↑</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InputForm({ taskId, fields, onSubmit }: { taskId: string; fields: any[]; onSubmit: () => void }) {
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const handle = async () => {
    setSubmitting(true)
    try { await apiPatch(`/tasks/${taskId}/input`, { input: formData }); onSubmit() }
    finally { setSubmitting(false) }
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>Input Needed</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {fields.map((field: any) => (
          <div key={field.id}>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea
                value={formData[field.id] || ''}
                onChange={e => setFormData(p => ({ ...p, [field.id]: e.target.value }))}
                placeholder={field.placeholder}
                rows={2}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', resize: 'none' }}
              />
            ) : field.type === 'select' ? (
              <select
                value={formData[field.id] || ''}
                onChange={e => setFormData(p => ({ ...p, [field.id]: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)' }}
              >
                <option value="">Select...</option>
                {field.options?.map((o: string) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                type="text"
                value={formData[field.id] || ''}
                onChange={e => setFormData(p => ({ ...p, [field.id]: e.target.value }))}
                placeholder={field.placeholder}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)' }}
              />
            )}
          </div>
        ))}
        <button onClick={handle} disabled={submitting} className="btn-primary" style={{ padding: '8px 0' }}>Submit</button>
      </div>
    </div>
  )
}
