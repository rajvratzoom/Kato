import { Link, useLocation } from 'react-router-dom'
import { useAppContext } from '../App'
import { ReactNode } from 'react'
import { useApi } from '../hooks/useApi'

const NAV_ITEMS = [
  { path: '/agents', label: 'Agents', icon: '🤖' },
  { path: '/integrations', label: 'Integrations', icon: '🔗' },
  { path: '/logs', label: 'Logs', icon: '📜' },
  { path: '/admin', label: 'Admin', icon: '⚙️' },
]

interface AgentStatus {
  id: string
  name: string
  avatar: string
  status: string
  current_task: string | null
  current_task_summary: string | null
}

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { role, setRole, darkMode, toggleDarkMode, sidebarCollapsed, setSidebarCollapsed } = useAppContext()
  const { data: agentStatuses } = useApi<AgentStatus[]>('/agents/status', [])

  const isChat = location.pathname === '/'
  const isBoard = location.pathname === '/board'

  return (
    <div className="min-h-screen bg-gray-50/80 dark:bg-gray-950 flex">
      {/* Left Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-60'} bg-white dark:bg-gray-900/95 border-r border-gray-100 dark:border-gray-800/60 flex flex-col fixed h-full z-20 transition-all duration-300`}>
        {/* Logo */}
        <div className={`${sidebarCollapsed ? 'px-3' : 'px-5'} py-5 border-b border-gray-100 dark:border-gray-800/60`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-kato-500 to-kato-700 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm flex-shrink-0">K</div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h1 className="font-semibold text-base text-gray-900 dark:text-white tracking-tight">Kato</h1>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Agent Orchestrator</p>
              </div>
            )}
          </div>
        </div>

        {/* Mode Switcher */}
        <div className={`${sidebarCollapsed ? 'px-2' : 'px-4'} pt-4 pb-2`}>
          {sidebarCollapsed ? (
            <div className="flex flex-col gap-1">
              <Link
                to="/"
                className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm transition-all ${
                  isChat ? 'bg-kato-50 dark:bg-kato-900/20 text-kato-600' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                }`}
                title="Chat"
              >💬</Link>
              <Link
                to="/board"
                className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm transition-all ${
                  isBoard ? 'bg-kato-50 dark:bg-kato-900/20 text-kato-600' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                }`}
                title="Board"
              >📋</Link>
            </div>
          ) : (
            <div className="flex bg-gray-100 dark:bg-gray-800/60 rounded-xl p-1">
              <Link
                to="/"
                className={`flex-1 text-center text-[12px] font-medium py-2 rounded-lg transition-all ${
                  isChat
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
                }`}
              >
                💬 Chat
              </Link>
              <Link
                to="/board"
                className={`flex-1 text-center text-[12px] font-medium py-2 rounded-lg transition-all ${
                  isBoard
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
                }`}
              >
                📋 Board
              </Link>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {!sidebarCollapsed && (
            <p className="text-[10px] text-gray-400 dark:text-gray-600 mb-2 font-semibold uppercase tracking-widest px-3 pt-2">Navigation</p>
          )}
          {NAV_ITEMS.map(item => {
            if (item.path === '/admin' && role === 'viewer') return null
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''} gap-2.5 ${sidebarCollapsed ? 'px-0 py-2.5' : 'px-3 py-2'} rounded-xl text-[13px] font-medium transition-all ${
                  active
                    ? 'bg-kato-50 dark:bg-kato-900/15 text-kato-700 dark:text-kato-400'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className="text-base">{item.icon}</span>
                {!sidebarCollapsed && item.label}
              </Link>
            )
          })}

          {/* Interns */}
          <div className="pt-4 mt-3 border-t border-gray-100 dark:border-gray-800/60">
            {!sidebarCollapsed && (
              <p className="text-[10px] text-gray-400 dark:text-gray-600 mb-2.5 font-semibold uppercase tracking-widest px-3">Interns</p>
            )}
            <div className="space-y-1">
              {agentStatuses?.map(agent => {
                const isWorking = !!agent.current_task
                const isActive = agent.status === 'active'
                return (
                  <Link
                    key={agent.id}
                    to="/agents"
                    className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''} gap-2.5 ${sidebarCollapsed ? 'px-0 py-2' : 'px-3 py-2'} rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all group`}
                    title={sidebarCollapsed ? `${agent.name} - ${isWorking ? 'Working' : isActive ? 'Ready' : 'Offline'}` : undefined}
                  >
                    <div className="relative flex-shrink-0">
                      <span className="text-lg">{agent.avatar}</span>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-[1.5px] border-white dark:border-gray-900 ${
                        !isActive ? 'bg-gray-300 dark:bg-gray-600' :
                        isWorking ? 'bg-blue-500 animate-pulse' :
                        'bg-emerald-500'
                      }`} />
                    </div>
                    {!sidebarCollapsed && (
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-gray-600 dark:text-gray-300 truncate">{agent.name}</p>
                        <p className={`text-[11px] truncate ${
                          isWorking ? 'text-blue-500 dark:text-blue-400' : 'text-gray-300 dark:text-gray-600'
                        }`}>
                          {isWorking ? agent.current_task_summary : isActive ? 'Ready' : 'Offline'}
                        </p>
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

        {/* Bottom */}
        <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800/60 space-y-2.5">
          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center px-2 py-1.5 rounded-lg text-xs text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all"
          >
            {sidebarCollapsed ? '→' : '← Collapse'}
          </button>

          {/* Role - only when expanded */}
          {!sidebarCollapsed && (
            <div className="px-2">
              <p className="text-[10px] text-gray-400 dark:text-gray-600 mb-1.5 font-semibold uppercase tracking-widest">Role</p>
              <div className="flex gap-0.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg p-0.5">
                {(['admin', 'manager', 'viewer'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`flex-1 text-[11px] py-1.5 rounded-md font-medium transition-all capitalize ${
                      role === r
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dark mode */}
          <button
            onClick={toggleDarkMode}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-1.5 rounded-lg text-xs text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all`}
          >
            <span>{darkMode ? '🌙' : '☀️'}{!sidebarCollapsed && (darkMode ? ' Dark' : ' Light')}</span>
            {!sidebarCollapsed && (
              <div className={`w-7 h-4 rounded-full transition-colors ${darkMode ? 'bg-kato-500' : 'bg-gray-200'} relative`}>
                <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform shadow-sm ${darkMode ? 'translate-x-3' : 'translate-x-0.5'}`} />
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={`flex-1 ${sidebarCollapsed ? 'ml-16' : 'ml-60'} transition-all duration-300`}>
        {children}
      </main>
    </div>
  )
}
