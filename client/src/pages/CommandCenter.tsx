import { useState } from 'react'
import { apiPost } from '../hooks/useApi'

interface WorkflowResult {
  workflowId: string
  status: string
  agent: string | null
  result: any
}

const EXAMPLE_TASKS = [
  'Research Acme Corp',
  'Send follow-up email to John about the Acme meeting',
  'Find info about Tesla stock performance',
  'Draft a Slack message to the team about project updates',
  'Investigate competitor pricing for SaaS tools',
]

export default function CommandCenter() {
  const [task, setTask] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<WorkflowResult[]>([])
  const [currentStep, setCurrentStep] = useState<string | null>(null)

  const submitTask = async (taskText?: string) => {
    const t = taskText || task
    if (!t.trim()) return
    setLoading(true)
    setCurrentStep('🧠 Analyzing intent...')

    try {
      // Simulate step-by-step progress
      await new Promise(r => setTimeout(r, 400))
      setCurrentStep('🔀 Routing to agent...')

      const result = await apiPost<WorkflowResult>('/tasks', { task: t })
      setResults(prev => [result, ...prev])
      setTask('')
    } catch (err: any) {
      setResults(prev => [{
        workflowId: 'error',
        status: 'failed',
        agent: null,
        result: { error: err.message },
      }, ...prev])
    } finally {
      setLoading(false)
      setCurrentStep(null)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Command Center</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Tell Kato what you need — it'll route to the right intern</p>
      </div>

      {/* Input */}
      <div className="card p-6 mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={task}
            onChange={e => setTask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && submitTask()}
            placeholder="What do you need done? e.g., 'Research Acme Corp' or 'Send follow-up email to John'"
            className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-kato-500 focus:border-transparent"
            disabled={loading}
          />
          <button onClick={() => submitTask()} disabled={loading || !task.trim()} className="btn-primary px-6">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing
              </span>
            ) : 'Send'}
          </button>
        </div>

        {/* Quick actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 py-1">Try:</span>
          {EXAMPLE_TASKS.map(ex => (
            <button
              key={ex}
              onClick={() => { setTask(ex); submitTask(ex) }}
              disabled={loading}
              className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-full hover:bg-kato-100 dark:hover:bg-kato-900/20 hover:text-kato-700 dark:hover:text-kato-400 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Processing indicator */}
      {currentStep && (
        <div className="card p-4 mb-6 border-kato-200 dark:border-kato-800 bg-kato-50 dark:bg-kato-900/10">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-kato-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-kato-700 dark:text-kato-400">{currentStep}</span>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        {results.map((r, i) => (
          <ResultCard key={`${r.workflowId}-${i}`} result={r} />
        ))}
      </div>
    </div>
  )
}

function ResultCard({ result }: { result: WorkflowResult }) {
  const [expanded, setExpanded] = useState(false)
  const isError = result.status === 'failed'
  const agentNames: Record<string, string> = {
    'research-intern': '🔍 Research Intern',
    'secretary-intern': '📧 Secretary Intern',
  }

  return (
    <div className={`card p-6 ${isError ? 'border-red-200 dark:border-red-900' : 'border-green-200 dark:border-green-900'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`badge ${isError ? 'badge-red' : 'badge-green'}`}>
            {result.status}
          </span>
          {result.agent && (
            <span className="badge badge-blue">{agentNames[result.agent] || result.agent}</span>
          )}
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Summary */}
      {result.result?.error ? (
        <p className="text-red-600 dark:text-red-400 text-sm">{result.result.error}</p>
      ) : result.result?.summary ? (
        <p className="text-gray-700 dark:text-gray-300 text-sm">{result.result.summary}</p>
      ) : null}

      {/* Expanded details */}
      {expanded && result.result && !result.result.error && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          {result.result.keyFindings && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Key Findings</p>
              <ul className="space-y-1">
                {result.result.keyFindings.map((f: string, i: number) => (
                  <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="text-kato-500 mt-0.5">•</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.result.draft && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Email Draft</p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm">
                <p className="text-gray-500 dark:text-gray-400"><strong>To:</strong> {result.result.draft.to}</p>
                <p className="text-gray-500 dark:text-gray-400"><strong>Subject:</strong> {result.result.draft.subject}</p>
                <div className="mt-2 whitespace-pre-wrap text-gray-700 dark:text-gray-300">{result.result.draft.body}</div>
              </div>
            </div>
          )}
          {result.result.storedIn && (
            <p className="text-xs text-gray-500 dark:text-gray-400">📁 Stored in: {result.result.storedIn}</p>
          )}
          {result.result.recommendation && (
            <div className="mt-2 bg-kato-50 dark:bg-kato-900/10 rounded-lg p-3">
              <p className="text-xs font-semibold text-kato-700 dark:text-kato-400 mb-1">💡 Recommendation</p>
              <p className="text-sm text-kato-600 dark:text-kato-300">{result.result.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
