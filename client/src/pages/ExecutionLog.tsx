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

const EVENT_ICONS: Record<string, string> = {
  task_received: '📥',
  intent_classified: '🧠',
  routing: '🔀',
  attempt: '🔄',
  tool_call: '🔧',
  completed: '✅',
  retry_error: '⚠️',
  backoff: '⏳',
  escalation: '🚨',
  routing_failed: '❌',
  agent_inactive: '🚫',
}

const EVENT_COLORS: Record<string, string> = {
  task_received: 'border-blue-400',
  intent_classified: 'border-purple-400',
  routing: 'border-kato-400',
  attempt: 'border-yellow-400',
  tool_call: 'border-cyan-400',
  completed: 'border-green-400',
  retry_error: 'border-orange-400',
  backoff: 'border-yellow-400',
  escalation: 'border-red-400',
  routing_failed: 'border-red-400',
  agent_inactive: 'border-gray-400',
}

export default function ExecutionLog() {
  const { data, loading, refetch } = useApi<{ logs: LogEntry[]; total: number }>('/logs?limit=200')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  const logs = data?.logs || []
  const filtered = filter
    ? logs.filter(l => l.event_type.includes(filter) || l.message.toLowerCase().includes(filter.toLowerCase()) || l.workflow_task?.toLowerCase().includes(filter.toLowerCase()))
    : logs

  if (loading) return <div className="animate-pulse"><div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-8" /><div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-xl" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Execution Log</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{data?.total || 0} total log entries</p>
        </div>
        <button onClick={() => refetch()} className="btn-secondary text-sm">🔄 Refresh</button>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter logs by event type, message, or task..."
          className="w-full max-w-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-kato-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium text-gray-900 dark:text-white">No logs yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Run some tasks from Command Center to see execution logs</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map(log => (
              <div
                key={log.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors border-l-4 ${EVENT_COLORS[log.event_type] || 'border-gray-300'}`}
                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">{EVENT_ICONS[log.event_type] || '📌'}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge badge-gray text-xs font-mono">{log.event_type}</span>
                        {log.agent_name && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {log.agent_avatar} {log.agent_name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{log.message}</p>
                      {log.workflow_task && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Task: {log.workflow_task}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap ml-4">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                {expandedLog === log.id && log.data && (
                  <div className="mt-3 ml-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Data</p>
                    <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap overflow-auto max-h-48">
                      {JSON.stringify(JSON.parse(log.data), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
