import { useParams, useNavigate } from 'react-router-dom'
import { useApi, apiPost, apiPatch } from '../hooks/useApi'
import { useState, useRef, useEffect } from 'react'

interface PlanStep {
  id: string; agent: string; agentAvatar: string; action: string;
  description: string; status: string; tools: string[]; output?: any;
}
interface Message { id: string; role: string; message: string; timestamp: string }

const STATUS_STYLES: Record<string, { dot: string; bg: string; label: string }> = {
  completed: { dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10', label: 'Done' },
  running:   { dot: 'bg-blue-500 animate-pulse', bg: 'bg-blue-50 dark:bg-blue-900/10', label: 'Running' },
  pending:   { dot: 'bg-gray-300 dark:bg-gray-600', bg: '', label: 'Pending' },
  waiting:   { dot: 'bg-amber-500 animate-pulse', bg: 'bg-amber-50 dark:bg-amber-900/10', label: 'Waiting on you' },
  failed:    { dot: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-900/10', label: 'Failed' },
}

export default function TaskDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: task, loading, refetch } = useApi<any>(`/tasks/${id}`)
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (task?.messages) setMessages(task.messages)
  }, [task?.messages])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  const handleApprove = async () => {
    await apiPatch(`/tasks/${id}/approve`, {})
    refetch()
  }
  const handleReject = async () => {
    await apiPatch(`/tasks/${id}/reject`, {})
    refetch()
  }

  if (loading) return <DetailSkeleton />
  if (!task) return <div className="text-center py-20 text-gray-400">Task not found</div>

  const plan: PlanStep[] = task.execution_plan || []
  const completedSteps = plan.filter(s => s.status === 'completed').length
  const progress = plan.length > 0 ? Math.round((completedSteps / plan.length) * 100) : 0

  return (
    <div className="max-w-6xl">
      {/* Back */}
      <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-5 transition-colors">
        ← Back to Board
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-xl">{task.agent_avatar || '🧠'}</span>
            <span className={`badge ${
              task.status === 'completed' ? 'badge-green' :
              task.status === 'failed' ? 'badge-red' :
              task.status === 'needs_approval' || task.status === 'needs_input' ? 'badge-yellow' :
              'badge-blue'
            }`}>{task.status.replace(/_/g, ' ')}</span>
            {task.priority === 'high' && <span className="badge badge-red">urgent</span>}
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">{task.task}</h1>
          <p className="text-[13px] text-gray-400 dark:text-gray-500 mt-1">
            {task.agent_name || 'Kato'} • Started {new Date(task.started_at + 'Z').toLocaleString()}
          </p>
        </div>

        {/* Actions */}
        {task.status === 'needs_approval' && (
          <div className="flex gap-2">
            <button onClick={handleApprove} className="text-[13px] bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium transition-all">Approve</button>
            <button onClick={handleReject} className="text-[13px] bg-gray-100 dark:bg-gray-800 text-red-500 px-4 py-2 rounded-xl font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-gray-200 dark:border-gray-700">Reject</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Left: Plan + Result */}
        <div className="col-span-3 space-y-5">
          {/* Progress bar */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Execution Plan</h2>
              <span className="text-[12px] text-gray-400">{completedSteps}/{plan.length} steps</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-5">
              <div className="h-full bg-gradient-to-r from-kato-500 to-kato-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>

            {/* Steps */}
            <div className="space-y-0">
              {plan.map((step, i) => {
                const style = STATUS_STYLES[step.status] || STATUS_STYLES.pending
                const isLast = i === plan.length - 1
                return (
                  <div key={step.id} className="flex gap-3">
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${style.dot}`} />
                      {!isLast && <div className="w-px flex-1 bg-gray-100 dark:bg-gray-800 my-1" />}
                    </div>
                    {/* Content */}
                    <div className={`flex-1 pb-4 ${isLast ? '' : ''}`}>
                      <div className={`rounded-xl p-3 ${style.bg} transition-all`}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm">{step.agentAvatar}</span>
                          <span className="text-[12px] font-semibold text-gray-800 dark:text-gray-200">{step.action}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ml-auto ${
                            step.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600' :
                            step.status === 'waiting' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600' :
                            step.status === 'running' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600' :
                            'bg-gray-100 dark:bg-gray-800 text-gray-400'
                          }`}>{style.label}</span>
                        </div>
                        <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed">{step.description}</p>
                        {step.tools.length > 0 && (
                          <div className="flex gap-1 mt-1.5">
                            {step.tools.map(t => (
                              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-mono">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Result */}
          {task.result && (
            <div className="card p-5">
              <h2 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">Output</h2>

              {task.result.summary && (
                <p className="text-[13px] text-gray-600 dark:text-gray-400 mb-3">{task.result.summary}</p>
              )}

              {task.result.keyFindings && (
                <div className="mb-3">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Key Findings</p>
                  <ul className="space-y-1">
                    {task.result.keyFindings.map((f: string, i: number) => (
                      <li key={i} className="text-[12px] text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <span className="text-kato-500 mt-0.5 flex-shrink-0">•</span>{f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {task.result.draft && (
                <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-100 dark:border-gray-700/40">
                  <div className="text-[12px] text-gray-400 mb-1"><span className="font-medium">To:</span> {task.result.draft.to}</div>
                  <div className="text-[12px] text-gray-400 mb-2"><span className="font-medium">Subject:</span> {task.result.draft.subject}</div>
                  <div className="text-[13px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{task.result.draft.body}</div>
                </div>
              )}

              {task.result.storedIn && (
                <p className="text-[11px] text-gray-400 mt-3">📁 {task.result.storedIn}</p>
              )}
            </div>
          )}

          {/* Input fields if needed */}
          {task.status === 'needs_input' && task.required_fields && (
            <InputForm taskId={task.id} fields={task.required_fields} onSubmit={refetch} />
          )}
        </div>

        {/* Right: Chat with Kato */}
        <div className="col-span-2">
          <div className="card flex flex-col h-[calc(100vh-180px)] sticky top-6">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800/60">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-br from-kato-500 to-kato-700 rounded-lg flex items-center justify-center text-white text-xs font-bold">K</div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">Kato</p>
                  <p className="text-[10px] text-emerald-500">Online</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                    m.role === 'user'
                      ? 'bg-kato-600 text-white'
                      : 'bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700/40'
                  }`}>
                    <p className="text-[13px] leading-relaxed">{m.message}</p>
                    <p className={`text-[10px] mt-1 ${m.role === 'user' ? 'text-kato-200' : 'text-gray-300 dark:text-gray-600'}`}>
                      {new Date(m.timestamp + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800/60">
              <div className="relative">
                <input
                  type="text"
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Talk to Kato about this task..."
                  className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-150 dark:border-gray-700/60 rounded-xl px-4 py-2.5 pr-10 text-[13px] text-gray-900 dark:text-white placeholder-gray-350 focus:border-kato-400 transition-all"
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!msg.trim() || sending}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg bg-kato-600 hover:bg-kato-700 text-white text-xs transition-all disabled:opacity-30"
                >↑</button>
              </div>
              <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1.5 px-1">
                Ask Kato to change the plan, adjust priority, or cancel
              </p>
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
    <div className="card p-5">
      <h2 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">Your Input Needed</h2>
      <div className="space-y-3">
        {fields.map((field: any) => (
          <div key={field.id}>
            <label className="text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1 block">{field.label}</label>
            {field.type === 'select' ? (
              <select value={formData[field.id] || ''} onChange={e => setFormData(p => ({ ...p, [field.id]: e.target.value }))}
                className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-150 dark:border-gray-700/60 rounded-xl px-3 py-2.5 text-[13px] text-gray-800 dark:text-gray-200 focus:border-kato-400 transition-all">
                <option value="">Select...</option>
                {field.options?.map((o: string) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea value={formData[field.id] || ''} onChange={e => setFormData(p => ({ ...p, [field.id]: e.target.value }))}
                placeholder={field.placeholder} rows={2}
                className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-150 dark:border-gray-700/60 rounded-xl px-3 py-2.5 text-[13px] text-gray-800 dark:text-gray-200 focus:border-kato-400 transition-all resize-none" />
            ) : (
              <input type="text" value={formData[field.id] || ''} onChange={e => setFormData(p => ({ ...p, [field.id]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-150 dark:border-gray-700/60 rounded-xl px-3 py-2.5 text-[13px] text-gray-800 dark:text-gray-200 focus:border-kato-400 transition-all" />
            )}
          </div>
        ))}
        <button onClick={handle} disabled={submitting} className="btn-primary w-full text-[13px]">Submit</button>
      </div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse max-w-6xl">
      <div className="h-5 w-32 bg-gray-100 dark:bg-gray-800 rounded-lg mb-5" />
      <div className="h-8 w-96 bg-gray-100 dark:bg-gray-800 rounded-lg mb-6" />
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 space-y-5">
          <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
        </div>
        <div className="col-span-2"><div className="h-[500px] bg-gray-100 dark:bg-gray-800 rounded-2xl" /></div>
      </div>
    </div>
  )
}
