import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPost, useApi } from '../hooks/useApi'

interface ChatMessage {
  id: string
  type: 'user' | 'kato' | 'task-card'
  text: string
  timestamp: Date
  taskData?: {
    workflowId: string
    status: string
    agent: string | null
    agentName?: string
    task: string
    result?: any
    execution_plan?: any[]
  }
}

interface TaskDetail {
  id: string
  task: string
  status: string
  agent_id: string | null
  agent_name: string | null
  agent_avatar: string | null
  result: any
  execution_plan: any[]
  messages: any[]
  started_at: string
  completed_at: string | null
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  completed: { label: 'Completed', color: '#34d399' },
  running: { label: 'Running', color: '#5c7cfa' },
  processing: { label: 'Processing', color: '#5c7cfa' },
  needs_approval: { label: 'Needs approval', color: '#f59e0b' },
  needs_input: { label: 'Needs input', color: '#f59e0b' },
  failed: { label: 'Failed', color: '#ef4444' },
  pending: { label: 'Queued', color: 'var(--text-muted)' },
}

export default function Chat() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: activeTask, refetch: refetchActiveTask } = useApi<TaskDetail>(
    activeTaskId ? `/tasks/${activeTaskId}` : '',
    [activeTaskId]
  )

  useEffect(() => {
    if (!activeTaskId) return
    const interval = setInterval(() => refetchActiveTask(), 3000)
    return () => clearInterval(interval)
  }, [activeTaskId, refetchActiveTask])

  useEffect(() => {
    if (!activeTask) return
    setMessages(prev => prev.map(m => {
      if (m.type === 'task-card' && m.taskData?.workflowId === activeTask.id) {
        return {
          ...m,
          taskData: {
            ...m.taskData!,
            status: activeTask.status,
            result: activeTask.result,
            execution_plan: activeTask.execution_plan,
            agentName: activeTask.agent_name || m.taskData!.agentName,
          }
        }
      }
      return m
    }))
    if (['completed', 'failed'].includes(activeTask.status)) {
      setTimeout(() => setActiveTaskId(null), 5000)
    }
  }, [activeTask])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const submitTask = useCallback(async (taskText?: string) => {
    const t = taskText || input
    if (!t.trim() || loading) return

    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`, type: 'user', text: t, timestamp: new Date(),
    }])
    setInput('')
    setLoading(true)

    setMessages(prev => [...prev, { id: 'typing', type: 'kato', text: '', timestamp: new Date() }])

    try {
      const result = await apiPost<any>('/tasks', { task: t })
      setMessages(prev => prev.filter(m => m.id !== 'typing'))

      const agentName = result.agent || 'Kato'
      setMessages(prev => [...prev, {
        id: `kato-${Date.now()}`, type: 'kato',
        text: result.agent
          ? `Assigned to **${agentName}**. Working on it now.`
          : `Handling this directly.`,
        timestamp: new Date(),
      }])

      setMessages(prev => [...prev, {
        id: `task-${Date.now()}`, type: 'task-card', text: t, timestamp: new Date(),
        taskData: {
          workflowId: result.workflowId, status: result.status,
          agent: result.agent, agentName, task: t,
          result: result.result, execution_plan: result.execution_plan,
        }
      }])
      setActiveTaskId(result.workflowId)
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== 'typing'))
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`, type: 'kato',
        text: `Error: ${err.message}`,
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }, [input, loading])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitTask()
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', transition: 'margin-right 0.2s', marginRight: activeTaskId && activeTask ? 380 : 0 }}>
        {isEmpty ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 520, padding: '0 24px' }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 20 }}>
                Ask Kato anything
              </p>
              <div style={{ position: 'relative' }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe what you need done..."
                  style={{
                    width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '12px 44px 12px 14px', fontSize: 13,
                    color: 'var(--text-primary)', outline: 'none',
                  }}
                  disabled={loading}
                />
                <button
                  onClick={() => submitTask()}
                  disabled={loading || !input.trim()}
                  style={{
                    position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                    width: 32, height: 32, borderRadius: 6, background: '#5c7cfa',
                    color: '#fff', border: 'none', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    opacity: loading || !input.trim() ? 0.3 : 1,
                  }}
                >
                  {loading ? (
                    <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 24px' }}>
                {messages.map(msg => {
                  if (msg.id === 'typing') {
                    return (
                      <div key="typing" style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-start' }}>
                        <KatoAvatar />
                        <div style={{ background: 'var(--surface)', borderRadius: '8px 8px 8px 2px', padding: '10px 14px', display: 'flex', gap: 4 }}>
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse 1.2s ease-in-out infinite' }} />
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse 1.2s ease-in-out 0.2s infinite' }} />
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse 1.2s ease-in-out 0.4s infinite' }} />
                        </div>
                      </div>
                    )
                  }

                  if (msg.type === 'user') {
                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                        <div style={{
                          maxWidth: '75%', background: 'rgba(92,124,250,0.15)',
                          color: 'var(--text-primary)', borderRadius: '8px 8px 2px 8px',
                          padding: '10px 14px',
                        }}>
                          <p style={{ fontSize: 13, lineHeight: 1.5 }}>{msg.text}</p>
                          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  }

                  if (msg.type === 'kato') {
                    return (
                      <div key={msg.id} style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-start' }}>
                        <KatoAvatar />
                        <div style={{
                          maxWidth: '75%', background: 'var(--surface)',
                          borderRadius: '8px 8px 8px 2px', padding: '10px 14px',
                          border: '1px solid var(--border)',
                        }}>
                          <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-primary)' }}>{renderBold(msg.text)}</p>
                          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  }

                  if (msg.type === 'task-card' && msg.taskData) {
                    const td = msg.taskData
                    const st = STATUS_MAP[td.status] || STATUS_MAP.pending
                    const isRunning = ['running', 'processing', 'pending'].includes(td.status)
                    const isDone = td.status === 'completed'

                    return (
                      <div key={msg.id} style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-start' }}>
                        <div style={{ width: 24, flexShrink: 0 }} />
                        <div style={{
                          flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
                          borderRadius: 8, overflow: 'hidden',
                        }}>
                          {/* Header */}
                          <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{td.agentName || 'Kato'}</span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{td.task}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color }} />
                              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{st.label}</span>
                            </div>
                          </div>

                          {/* Steps compact */}
                          {td.execution_plan && td.execution_plan.length > 0 && (
                            <div style={{ padding: '0 14px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {td.execution_plan.slice(0, 3).map((step: any, i: number) => {
                                const sts = STATUS_MAP[step.status] || STATUS_MAP.pending
                                return (
                                  <div key={step.id || i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: sts.color, flexShrink: 0 }} />
                                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{step.description || step.action}</span>
                                  </div>
                                )
                              })}
                              {td.execution_plan.length > 3 && (
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 10 }}>+{td.execution_plan.length - 3} more</span>
                              )}
                            </div>
                          )}

                          {/* Result */}
                          {isDone && td.result?.summary && (
                            <div style={{ padding: '0 14px 10px' }}>
                              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{td.result.summary}</p>
                            </div>
                          )}

                          {/* Footer */}
                          <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                            <button onClick={() => setActiveTaskId(td.workflowId)} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                              Details
                            </button>
                            <button onClick={() => navigate(`/task/${td.workflowId}`)} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                              Full view →
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return null
                })}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Bottom input */}
            <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
              <div style={{ maxWidth: 640, margin: '0 auto', padding: '12px 24px' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tell Kato what you need..."
                    style={{
                      width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '10px 44px 10px 14px', fontSize: 13,
                      color: 'var(--text-primary)', outline: 'none',
                    }}
                    disabled={loading}
                  />
                  <button
                    onClick={() => submitTask()}
                    disabled={loading || !input.trim()}
                    style={{
                      position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                      width: 28, height: 28, borderRadius: 6, background: '#5c7cfa',
                      color: '#fff', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: loading || !input.trim() ? 0.3 : 1,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Execution Panel */}
      {activeTaskId && activeTask && (
        <ExecutionPanel
          task={activeTask}
          onClose={() => setActiveTaskId(null)}
          onNavigate={() => navigate(`/task/${activeTaskId}`)}
        />
      )}
    </div>
  )
}

function KatoAvatar() {
  return (
    <div style={{
      width: 24, height: 24, borderRadius: 6, background: '#5c7cfa',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0,
    }}>K</div>
  )
}

function ExecutionPanel({ task, onClose, onNavigate }: { task: TaskDetail; onClose: () => void; onNavigate: () => void }) {
  const plan = task.execution_plan || []
  const completedSteps = plan.filter((s: any) => s.status === 'completed').length

  return (
    <aside style={{
      width: 380, background: 'var(--surface)', borderLeft: '1px solid var(--border)',
      position: 'fixed', right: 0, top: 0, height: '100vh', zIndex: 20,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{task.agent_name || 'Kato'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {task.status === 'completed' ? 'Completed' : task.status === 'failed' ? 'Failed' : 'Working...'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={onNavigate} style={{ width: 24, height: 24, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>↗</button>
          <button onClick={onClose} style={{ width: 24, height: 24, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>✕</button>
        </div>
      </div>

      {/* Task */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {task.task}
      </div>

      {/* Progress */}
      <div style={{ padding: '10px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{completedSteps}/{plan.length}</span>
        </div>
        <div style={{ width: '100%', height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#5c7cfa', borderRadius: 2, width: plan.length > 0 ? `${(completedSteps / plan.length) * 100}%` : '0%', transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Steps */}
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 16px' }}>
        {plan.map((step: any, i: number) => {
          const st = STATUS_MAP[step.status] || STATUS_MAP.pending
          const isLast = i === plan.length - 1
          return (
            <div key={step.id || i} style={{ display: 'flex', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: st.color, marginTop: 4, flexShrink: 0 }} />
                {!isLast && <div style={{ width: 1, flex: 1, background: 'var(--border)', margin: '4px 0' }} />}
              </div>
              <div style={{ paddingBottom: 14, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{step.action}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{step.description}</div>
                {step.tools?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    {step.tools.map((t: string) => (
                      <span key={t} style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: 'var(--hover-bg)', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Result */}
      {task.result && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', maxHeight: 180, overflow: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Result</div>
          {task.result.summary && <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{task.result.summary}</p>}
          {task.result.keyFindings && (
            <ul style={{ marginTop: 6, listStyle: 'none', padding: 0 }}>
              {task.result.keyFindings.slice(0, 4).map((f: string, i: number) => (
                <li key={i} style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2, paddingLeft: 10, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: 'var(--accent)' }}>·</span>{f}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)' }}>
        <button onClick={onNavigate} style={{ width: '100%', fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: '6px 0' }}>
          Open full task view →
        </button>
      </div>
    </aside>
  )
}

function renderBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/)
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ fontWeight: 600 }}>{part}</strong>
      : <span key={i}>{part}</span>
  )
}
