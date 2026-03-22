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
    agentAvatar?: string
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

const SUGGESTIONS = [
  { text: 'Research Acme Corp', icon: '🔍' },
  { text: 'Email John about the proposal', icon: '📧' },
  { text: 'Slack the team about updates', icon: '💬' },
  { text: 'Look up competitor pricing', icon: '📊' },
]

const AGENT_LABELS: Record<string, { name: string; avatar: string }> = {
  'research-intern': { name: 'Research Intern', avatar: '🔍' },
  'secretary-intern': { name: 'Secretary Intern', avatar: '📧' },
}

const STATUS_LABELS: Record<string, { color: string; label: string; dot: string }> = {
  completed: { color: 'text-emerald-600 dark:text-emerald-400', label: 'Completed', dot: 'bg-emerald-500' },
  running: { color: 'text-blue-600 dark:text-blue-400', label: 'Running...', dot: 'bg-blue-500 animate-pulse' },
  processing: { color: 'text-blue-600 dark:text-blue-400', label: 'Processing...', dot: 'bg-blue-500 animate-pulse' },
  needs_approval: { color: 'text-amber-600 dark:text-amber-400', label: 'Needs Approval', dot: 'bg-amber-500' },
  needs_input: { color: 'text-amber-600 dark:text-amber-400', label: 'Needs Input', dot: 'bg-amber-500' },
  failed: { color: 'text-red-500', label: 'Failed', dot: 'bg-red-400' },
  pending: { color: 'text-gray-400', label: 'Queued', dot: 'bg-gray-300' },
}

export default function Chat() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Fetch active task details for the execution panel
  const { data: activeTask, refetch: refetchActiveTask } = useApi<TaskDetail>(
    activeTaskId ? `/tasks/${activeTaskId}` : '',
    [activeTaskId]
  )

  // Poll for active task updates
  useEffect(() => {
    if (!activeTaskId) return
    const interval = setInterval(() => refetchActiveTask(), 3000)
    return () => clearInterval(interval)
  }, [activeTaskId, refetchActiveTask])

  // Update task card status when activeTask changes
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
            agentAvatar: activeTask.agent_avatar || m.taskData!.agentAvatar,
          }
        }
      }
      return m
    }))
    // Close panel when done
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

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      text: t,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Show typing indicator
    const typingMsg: ChatMessage = {
      id: 'typing',
      type: 'kato',
      text: '',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, typingMsg])

    try {
      const result = await apiPost<any>('/tasks', { task: t })
      
      // Remove typing indicator
      setMessages(prev => prev.filter(m => m.id !== 'typing'))

      const agentInfo = AGENT_LABELS[result.agent] || { name: result.agent || 'Kato', avatar: '🧠' }

      // Add Kato response
      const katoMsg: ChatMessage = {
        id: `kato-${Date.now()}`,
        type: 'kato',
        text: result.agent
          ? `I've assigned this to **${agentInfo.name}**. They're on it now.`
          : `I'm handling this directly. Let me work on it.`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, katoMsg])

      // Add task execution card
      const taskCard: ChatMessage = {
        id: `task-${Date.now()}`,
        type: 'task-card',
        text: t,
        timestamp: new Date(),
        taskData: {
          workflowId: result.workflowId,
          status: result.status,
          agent: result.agent,
          agentName: agentInfo.name,
          agentAvatar: agentInfo.avatar,
          task: t,
          result: result.result,
          execution_plan: result.execution_plan,
        }
      }
      setMessages(prev => [...prev, taskCard])
      setActiveTaskId(result.workflowId)

    } catch (err: any) {
      // Remove typing indicator
      setMessages(prev => prev.filter(m => m.id !== 'typing'))
      
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'kato',
        text: `Something went wrong: ${err.message}. Want me to try again?`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMsg])
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
    <div className="flex h-screen">
      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${activeTaskId && activeTask ? 'mr-96' : ''}`}>
        {isEmpty ? (
          /* Empty State - Claude-like welcome */
          <div className="flex-1 flex items-center justify-center">
            <div className="max-w-2xl w-full px-6">
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-gradient-to-br from-kato-500 to-kato-700 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg mx-auto mb-5">K</div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight mb-2">What can I help you with?</h1>
                <p className="text-[14px] text-gray-400 dark:text-gray-500">I'll delegate tasks to your interns and keep everything on track.</p>
              </div>

              {/* Suggestions */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s.text}
                    onClick={() => { setInput(s.text); submitTask(s.text) }}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900/80 text-left hover:border-kato-200 dark:hover:border-kato-800 hover:shadow-sm transition-all group"
                  >
                    <span className="text-lg">{s.icon}</span>
                    <span className="text-[13px] text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">{s.text}</span>
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe what you need done..."
                  rows={1}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-4 pr-14 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:border-kato-400 dark:focus:border-kato-500 transition-all shadow-sm resize-none"
                  disabled={loading}
                  style={{ minHeight: '56px', maxHeight: '200px' }}
                />
                <button
                  onClick={() => submitTask()}
                  disabled={loading || !input.trim()}
                  className="absolute right-3 bottom-3 w-10 h-10 flex items-center justify-center rounded-xl bg-kato-600 hover:bg-kato-700 text-white transition-all disabled:opacity-30 disabled:hover:bg-kato-600 shadow-sm"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">
                {messages.map(msg => {
                  if (msg.id === 'typing') {
                    return (
                      <div key="typing" className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-kato-500 to-kato-700 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">K</div>
                        <div className="bg-gray-100 dark:bg-gray-800/80 rounded-2xl rounded-tl-md px-4 py-3">
                          <div className="flex gap-1.5">
                            <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )
                  }

                  if (msg.type === 'user') {
                    return (
                      <div key={msg.id} className="flex justify-end">
                        <div className="max-w-[75%] bg-kato-600 text-white rounded-2xl rounded-tr-md px-4 py-3">
                          <p className="text-[14px] leading-relaxed">{msg.text}</p>
                          <p className="text-[10px] text-kato-200 mt-1.5">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  }

                  if (msg.type === 'kato') {
                    return (
                      <div key={msg.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-kato-500 to-kato-700 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">K</div>
                        <div className="max-w-[75%] bg-gray-100 dark:bg-gray-800/80 rounded-2xl rounded-tl-md px-4 py-3 border border-gray-100 dark:border-gray-700/40">
                          <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed">{renderMarkdownLight(msg.text)}</p>
                          <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1.5">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  }

                  if (msg.type === 'task-card' && msg.taskData) {
                    const td = msg.taskData
                    const statusInfo = STATUS_LABELS[td.status] || STATUS_LABELS.pending
                    const isRunning = ['running', 'processing', 'pending'].includes(td.status)
                    const isDone = td.status === 'completed'
                    const needsAction = ['needs_approval', 'needs_input'].includes(td.status)

                    return (
                      <div key={msg.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 flex-shrink-0" /> {/* spacer for alignment */}
                        <div className="max-w-[85%] w-full">
                          <div className={`rounded-2xl border overflow-hidden transition-all ${
                            needsAction 
                              ? 'border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/10' 
                              : isDone
                                ? 'border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-950/10'
                                : 'border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900/80'
                          }`}>
                            {/* Card Header */}
                            <div className="px-4 py-3 flex items-center gap-3">
                              <span className="text-lg">{td.agentAvatar || '🧠'}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200">
                                  {td.agentName || 'Kato'} {isRunning ? 'is working on this...' : isDone ? 'finished' : needsAction ? 'needs your attention' : ''}
                                </p>
                                <p className="text-[12px] text-gray-400 dark:text-gray-500 truncate">{td.task}</p>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                                <span className={`text-[11px] font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                              </div>
                            </div>

                            {/* Progress bar for running tasks */}
                            {isRunning && (
                              <div className="px-4 pb-3">
                                <div className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-kato-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                                </div>
                              </div>
                            )}

                            {/* Execution Plan Steps (compact) */}
                            {td.execution_plan && td.execution_plan.length > 0 && (
                              <div className="px-4 pb-3 space-y-1.5">
                                {td.execution_plan.slice(0, 4).map((step: any, i: number) => {
                                  const stepStyle = STATUS_LABELS[step.status] || STATUS_LABELS.pending
                                  return (
                                    <div key={step.id || i} className="flex items-center gap-2">
                                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${stepStyle.dot}`} />
                                      <span className="text-[12px] text-gray-500 dark:text-gray-400">{step.description || step.action}</span>
                                    </div>
                                  )
                                })}
                                {td.execution_plan.length > 4 && (
                                  <p className="text-[11px] text-gray-300 dark:text-gray-600 pl-3.5">+{td.execution_plan.length - 4} more steps</p>
                                )}
                              </div>
                            )}

                            {/* Result Summary */}
                            {isDone && td.result && (
                              <div className="px-4 pb-3">
                                {td.result.summary && (
                                  <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed">{td.result.summary}</p>
                                )}
                                {td.result.keyFindings && (
                                  <ul className="mt-2 space-y-1">
                                    {td.result.keyFindings.slice(0, 3).map((f: string, i: number) => (
                                      <li key={i} className="text-[12px] text-gray-500 dark:text-gray-400 flex items-start gap-2">
                                        <span className="text-kato-500 mt-0.5 flex-shrink-0">•</span>{f}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}

                            {/* Footer */}
                            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between">
                              <button
                                onClick={() => setActiveTaskId(td.workflowId)}
                                className="text-[12px] text-gray-400 dark:text-gray-500 hover:text-kato-500 dark:hover:text-kato-400 transition-colors"
                              >
                                Show details →
                              </button>
                              <button
                                onClick={() => navigate(`/task/${td.workflowId}`)}
                                className="text-[12px] text-kato-500 hover:text-kato-600 font-medium transition-colors"
                              >
                                Full view →
                              </button>
                            </div>
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

            {/* Bottom Input */}
            <div className="border-t border-gray-100 dark:border-gray-800/60 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
              <div className="max-w-3xl mx-auto px-6 py-4">
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tell Kato what you need..."
                    rows={1}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-3.5 pr-14 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:border-kato-400 dark:focus:border-kato-500 transition-all resize-none"
                    disabled={loading}
                    style={{ minHeight: '48px', maxHeight: '200px' }}
                  />
                  <button
                    onClick={() => submitTask()}
                    disabled={loading || !input.trim()}
                    className="absolute right-2.5 bottom-2.5 w-9 h-9 flex items-center justify-center rounded-xl bg-kato-600 hover:bg-kato-700 text-white transition-all disabled:opacity-30 disabled:hover:bg-kato-600"
                  >
                    {loading ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Execution Panel - slides in from right */}
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

function ExecutionPanel({ task, onClose, onNavigate }: { task: TaskDetail; onClose: () => void; onNavigate: () => void }) {
  const plan = task.execution_plan || []
  const completedSteps = plan.filter((s: any) => s.status === 'completed').length
  const progress = plan.length > 0 ? Math.round((completedSteps / plan.length) * 100) : 0

  return (
    <aside className="w-96 bg-white dark:bg-gray-900/95 border-l border-gray-100 dark:border-gray-800/60 fixed right-0 top-0 h-full z-20 flex flex-col animate-slide-in">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-lg">{task.agent_avatar || '🧠'}</span>
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{task.agent_name || 'Kato'}</h2>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              {task.status === 'completed' ? 'Completed' : task.status === 'failed' ? 'Failed' : 'Working...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onNavigate}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-xs"
            title="Full view"
          >↗</button>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-xs"
          >✕</button>
        </div>
      </div>

      {/* Task */}
      <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800/60">
        <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed">{task.task}</p>
      </div>

      {/* Progress */}
      <div className="px-5 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Progress</span>
          <span className="text-[11px] text-gray-400">{completedSteps}/{plan.length}</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-kato-500 to-kato-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto px-5 py-2 space-y-0">
        {plan.map((step: any, i: number) => {
          const isLast = i === plan.length - 1
          const stepStatus = STATUS_LABELS[step.status] || STATUS_LABELS.pending
          return (
            <div key={step.id || i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${stepStatus.dot}`} />
                {!isLast && <div className="w-px flex-1 bg-gray-100 dark:bg-gray-800 my-1" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm">{step.agentAvatar || '🤖'}</span>
                  <span className="text-[12px] font-semibold text-gray-800 dark:text-gray-200">{step.action}</span>
                </div>
                <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed">{step.description}</p>
                {step.tools && step.tools.length > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    {step.tools.map((t: string) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-mono">{t}</span>
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
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800/60 max-h-48 overflow-y-auto">
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Result</p>
          {task.result.summary && (
            <p className="text-[12px] text-gray-600 dark:text-gray-400 leading-relaxed">{task.result.summary}</p>
          )}
          {task.result.keyFindings && (
            <ul className="mt-2 space-y-1">
              {task.result.keyFindings.slice(0, 5).map((f: string, i: number) => (
                <li key={i} className="text-[11px] text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                  <span className="text-kato-500 mt-0.5 flex-shrink-0">•</span>{f}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800/60">
        <button
          onClick={onNavigate}
          className="w-full text-[12px] text-kato-500 hover:text-kato-600 font-medium transition-colors text-center py-1.5"
        >
          Open full task view →
        </button>
      </div>
    </aside>
  )
}

function renderMarkdownLight(text: string) {
  // Very simple bold text rendering
  const parts = text.split(/\*\*(.*?)\*\*/)
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-semibold">{part}</strong>
      : <span key={i}>{part}</span>
  )
}
