import { useState } from 'react'
import { useAppContext } from '../App'
import { apiPost, useApi } from '../hooks/useApi'

interface WorkflowResult {
  workflowId: string
  status: string
  agent: string | null
  result: any
}

const SUGGESTIONS = [
  'Research Acme Corp',
  'Email John about the proposal',
  'Slack the team about updates',
  'Look up competitor pricing',
]

const AGENT_LABELS: Record<string, string> = {
  'research-intern': '🔍 Research',
  'secretary-intern': '📧 Secretary',
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-500',
  running: 'bg-blue-500 animate-pulse',
  processing: 'bg-blue-500 animate-pulse',
  needs_approval: 'bg-amber-500',
  needs_input: 'bg-amber-500',
  failed: 'bg-red-400',
  pending: 'bg-gray-300',
}

export default function CommandPanel() {
  const { commandPanelOpen, setCommandPanelOpen } = useAppContext()
  const [task, setTask] = useState('')
  const [loading, setLoading] = useState(false)
  const [submissions, setSubmissions] = useState<WorkflowResult[]>([])
  const { data: recentTasks } = useApi<any[]>('/tasks', [])

  const submitTask = async (taskText?: string) => {
    const t = taskText || task
    if (!t.trim()) return
    setLoading(true)
    try {
      const result = await apiPost<WorkflowResult>('/tasks', { task: t })
      setSubmissions(prev => [result, ...prev].slice(0, 20))
      setTask('')
    } catch (err: any) {
      setSubmissions(prev => [{
        workflowId: 'error-' + Date.now(),
        status: 'failed',
        agent: null,
        result: { error: err.message },
      }, ...prev].slice(0, 20))
    } finally {
      setLoading(false)
    }
  }

  if (!commandPanelOpen) return null

  const feed = submissions.length > 0 ? submissions : (recentTasks || []).slice(0, 10).map((t: any) => ({
    workflowId: t.id,
    status: t.status,
    agent: t.agent_id,
    result: { summary: t.task },
  }))

  return (
    <aside className="w-80 bg-white dark:bg-gray-900/95 border-l border-gray-100 dark:border-gray-800/60 fixed right-0 top-0 h-full z-20 flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800/60 flex items-center justify-between">
        <h2 className="font-semibold text-sm text-gray-900 dark:text-white tracking-tight">Command</h2>
        <button
          onClick={() => setCommandPanelOpen(false)}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-xs"
        >
          ✕
        </button>
      </div>

      {/* Input */}
      <div className="px-4 py-4">
        <div className="relative">
          <input
            type="text"
            value={task}
            onChange={e => setTask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && submitTask()}
            placeholder="What do you need done?"
            className="w-full bg-gray-50 dark:bg-gray-800/80 border border-gray-150 dark:border-gray-700/60 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-900 dark:text-white placeholder-gray-350 dark:placeholder-gray-500 focus:border-kato-400 dark:focus:border-kato-500 transition-all"
            disabled={loading}
          />
          <button
            onClick={() => submitTask()}
            disabled={loading || !task.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg bg-kato-600 hover:bg-kato-700 text-white text-xs font-bold transition-all disabled:opacity-30 disabled:hover:bg-kato-600"
          >
            {loading ? (
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
            ) : '↑'}
          </button>
        </div>

        {/* Suggestions */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => { setTask(s); submitTask(s) }}
              disabled={loading}
              className="text-[11px] bg-gray-50 dark:bg-gray-800/60 text-gray-400 dark:text-gray-500 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-gray-700/40 hover:border-kato-200 dark:hover:border-kato-800 hover:text-kato-600 dark:hover:text-kato-400 transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="px-5">
        <div className="border-t border-gray-100 dark:border-gray-800/60" />
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {feed.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-200 dark:text-gray-700 text-3xl mb-2">↑</p>
            <p className="text-[11px] text-gray-300 dark:text-gray-600">Type a task above</p>
          </div>
        ) : feed.map((s: any) => (
          <div key={s.workflowId} className="rounded-xl bg-gray-50/80 dark:bg-gray-800/40 px-3.5 py-2.5 transition-all hover:bg-gray-100/80 dark:hover:bg-gray-800/60">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_COLORS[s.status] || 'bg-gray-300'}`} />
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 capitalize">{s.status.replace(/_/g, ' ')}</span>
              {s.agent && <span className="text-[11px] text-gray-300 dark:text-gray-600 ml-auto">{AGENT_LABELS[s.agent] || s.agent}</span>}
            </div>
            <p className="text-[12px] text-gray-600 dark:text-gray-400 line-clamp-1">
              {s.result?.summary || s.result?.error || s.result?.task || 'Processing...'}
            </p>
          </div>
        ))}
      </div>
    </aside>
  )
}
