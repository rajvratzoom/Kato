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

  if (loading) return <KanbanSkeleton />

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">Board</h1>
        <div className="flex items-center gap-5 text-[13px]">
          <Stat label="Tasks" value={stats?.totalWorkflows || 0} />
          <Stat label="Success" value={`${stats?.successRate || 0}%`} color="text-emerald-600 dark:text-emerald-400" />
          <Stat label="Agents" value={`${stats?.activeAgents || 0}/${stats?.totalAgents || 0}`} color="text-blue-600 dark:text-blue-400" />
          <button onClick={() => refetch()} className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors text-base">↻</button>
        </div>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-4 gap-4 h-[calc(100vh-120px)]">
        <Column title="Queue" count={kanban?.queue?.length || 0} color="gray">
          {kanban?.queue?.map(t => <Card key={t.id} task={t} />)}
        </Column>
        <Column title="In Progress" count={kanban?.inProgress?.length || 0} color="blue">
          {kanban?.inProgress?.map(t => <Card key={t.id} task={t} />)}
        </Column>
        <Column title="Needs You" count={kanban?.needsYou?.length || 0} color="amber" attention>
          {kanban?.needsYou?.map(t => <ActionCard key={t.id} task={t} onAction={refetch} />)}
        </Column>
        <Column title="Done" count={kanban?.done?.length || 0} color="emerald">
          {kanban?.done?.map(t => <Card key={t.id} task={t} />)}
        </Column>
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-gray-300 dark:text-gray-600">{label}</span>
      <span className={`font-semibold ${color || 'text-gray-800 dark:text-gray-200'}`}>{value}</span>
    </div>
  )
}

const COL_COLORS: Record<string, { bg: string; badge: string; dot: string }> = {
  gray:    { bg: 'bg-gray-50/50 dark:bg-gray-900/30',    badge: 'bg-gray-100 dark:bg-gray-800 text-gray-400',              dot: 'bg-gray-300' },
  blue:    { bg: 'bg-blue-50/30 dark:bg-blue-950/10',    badge: 'bg-blue-50 dark:bg-blue-900/20 text-blue-500',            dot: 'bg-blue-400' },
  amber:   { bg: 'bg-amber-50/30 dark:bg-amber-950/10',  badge: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',         dot: 'bg-amber-400' },
  emerald: { bg: 'bg-emerald-50/30 dark:bg-emerald-950/10', badge: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600', dot: 'bg-emerald-400' },
}

function Column({ title, count, color, attention, children }: {
  title: string; count: number; color: string; attention?: boolean; children?: React.ReactNode
}) {
  const c = COL_COLORS[color] || COL_COLORS.gray
  return (
    <div className={`rounded-2xl ${c.bg} flex flex-col overflow-hidden border border-gray-100/60 dark:border-gray-800/40`}>
      <div className={`px-4 py-3 flex items-center justify-between ${attention && count > 0 ? 'kanban-attention' : ''}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${c.dot}`} />
          <h3 className="font-medium text-[13px] text-gray-700 dark:text-gray-300">{title}</h3>
        </div>
        {count > 0 && <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${c.badge}`}>{count}</span>}
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {!children || (Array.isArray(children) && children.length === 0) ? (
          <div className="text-center py-10 text-gray-200 dark:text-gray-700 text-[11px]">No tasks</div>
        ) : children}
      </div>
    </div>
  )
}

function Card({ task }: { task: any }) {
  const navigate = useNavigate()
  return (
    <div onClick={() => navigate(`/task/${task.id}`)} className="bg-white dark:bg-gray-800/80 rounded-xl p-3 border border-gray-100 dark:border-gray-700/40 hover:border-gray-200 dark:hover:border-gray-600/40 transition-all cursor-pointer group hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-sm">{task.agent_avatar || '🤖'}</span>
        <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">{task.agent_name || 'Unrouted'}</span>
        <span className="text-[11px] text-gray-200 dark:text-gray-700 ml-auto">{timeAgo(task.started_at)}</span>
      </div>
      <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug">{task.task}</p>
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

  const label = isApproval
    ? (task.result?.draft ? `Email → ${task.result.draft.to}` : task.result?.message ? `Slack → ${task.result.message.channel}` : 'Review')
    : 'Input needed'

  return (
    <div className="bg-white dark:bg-gray-800/80 rounded-xl border border-amber-200/60 dark:border-amber-800/30 transition-all hover:border-amber-300/80 dark:hover:border-amber-700/40">
      {/* Header */}
      <div className="p-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{task.agent_avatar}</span>
            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">{task.agent_name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
              isApproval ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-500' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'
            }`}>{isApproval ? 'Approve' : 'Input'}</span>
            <span className={`text-[10px] text-gray-300 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>▾</span>
          </div>
        </div>
        <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug">{task.task}</p>
        {!expanded && (
          <div className="flex items-center justify-between mt-1">
            <p className="text-[11px] text-gray-300 dark:text-gray-600 truncate">{label}</p>
            <button onClick={(e) => { e.stopPropagation(); navigate(`/task/${task.id}`) }} className="text-[10px] text-kato-500 hover:text-kato-600 font-medium flex-shrink-0 ml-2">View →</button>
          </div>
        )}
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-100/80 dark:border-gray-700/30">
          {isApproval && task.result && (
            <>
              {task.result.draft && (
                <div className="bg-gray-50/80 dark:bg-gray-800/60 rounded-lg p-3 text-[12px] space-y-1 max-h-36 overflow-y-auto mb-2.5 border border-gray-100/60 dark:border-gray-700/30">
                  <div className="text-gray-400 dark:text-gray-500"><span className="font-medium">To:</span> {task.result.draft.to}</div>
                  <div className="text-gray-400 dark:text-gray-500"><span className="font-medium">Re:</span> {task.result.draft.subject}</div>
                  <div className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap mt-1.5 leading-relaxed">{task.result.draft.body}</div>
                </div>
              )}
              {task.result.message && (
                <div className="bg-gray-50/80 dark:bg-gray-800/60 rounded-lg p-3 text-[12px] mb-2.5 border border-gray-100/60 dark:border-gray-700/30">
                  <div className="text-gray-400 dark:text-gray-500"><span className="font-medium">Channel:</span> {task.result.message.channel}</div>
                  <div className="text-gray-600 dark:text-gray-400 mt-1">{task.result.message.message}</div>
                </div>
              )}
              <div className="flex gap-1.5">
                <button onClick={() => handle('approve')} disabled={submitting} className="flex-1 text-[12px] bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium transition-all disabled:opacity-50">Approve</button>
                <button disabled={submitting} className="flex-1 text-[12px] bg-gray-50 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 py-2 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-150 dark:border-gray-600/40 disabled:opacity-50">Edit</button>
                <button onClick={() => handle('reject')} disabled={submitting} className="flex-1 text-[12px] bg-gray-50 dark:bg-gray-700/60 text-red-500 dark:text-red-400 py-2 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-gray-150 dark:border-gray-600/40 disabled:opacity-50">Reject</button>
              </div>
              <button onClick={(e) => { e.stopPropagation(); navigate(`/task/${task.id}`) }} className="w-full text-[11px] text-kato-500 hover:text-kato-600 font-medium mt-2 transition-colors">View full plan & chat with Kato →</button>
            </>
          )}

          {!isApproval && task.required_fields && (
            <div className="space-y-2.5">
              {task.required_fields.map((field: any) => (
                <div key={field.id}>
                  <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1 block">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      value={formData[field.id] || ''}
                      onChange={e => setFormData(p => ({ ...p, [field.id]: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-150 dark:border-gray-700/60 rounded-lg px-3 py-2 text-[12px] text-gray-800 dark:text-gray-200 focus:border-kato-400 transition-all"
                    >
                      <option value="">Select...</option>
                      {field.options?.map((o: string) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.id] || ''}
                      onChange={e => setFormData(p => ({ ...p, [field.id]: e.target.value }))}
                      placeholder={field.placeholder}
                      rows={2}
                      className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-150 dark:border-gray-700/60 rounded-lg px-3 py-2 text-[12px] text-gray-800 dark:text-gray-200 focus:border-kato-400 transition-all resize-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData[field.id] || ''}
                      onChange={e => setFormData(p => ({ ...p, [field.id]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-150 dark:border-gray-700/60 rounded-lg px-3 py-2 text-[12px] text-gray-800 dark:text-gray-200 focus:border-kato-400 transition-all"
                    />
                  )}
                </div>
              ))}
              <button onClick={() => handle('input', { input: formData })} disabled={submitting} className="w-full text-[12px] bg-kato-600 hover:bg-kato-700 text-white py-2 rounded-lg font-medium transition-all disabled:opacity-50">Submit</button>
              <button onClick={(e) => { e.stopPropagation(); navigate(`/task/${task.id}`) }} className="w-full text-[11px] text-kato-500 hover:text-kato-600 font-medium mt-2 transition-colors">View full plan & chat with Kato →</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function KanbanSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-5">
        <div className="h-7 w-20 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        <div className="h-5 w-48 bg-gray-100 dark:bg-gray-800 rounded-lg" />
      </div>
      <div className="grid grid-cols-4 gap-4 h-[calc(100vh-120px)]">
        {[1,2,3,4].map(i => <div key={i} className="bg-gray-50 dark:bg-gray-800/30 rounded-2xl" />)}
      </div>
    </div>
  )
}
