import { Link, useLocation } from 'react-router-dom'
import { useAppContext } from '../App'
import { ReactNode } from 'react'
import { useApi } from '../hooks/useApi'

const NAV_ITEMS = [
  { path: '/', label: 'Chat' },
  { path: '/board', label: 'Board' },
  { path: '/agents', label: 'Agents' },
  { path: '/integrations', label: 'Integrations' },
  { path: '/logs', label: 'Logs' },
  { path: '/admin', label: 'Admin' },
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

  const sidebarW = sidebarCollapsed ? 48 : 220

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarW,
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border)',
          position: 'fixed',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.2s ease',
          zIndex: 20,
        }}
      >
        {/* Logo */}
        <div style={{ padding: sidebarCollapsed ? '16px 8px' : '16px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: '#5c7cfa', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0,
            }}>K</div>
            {!sidebarCollapsed && (
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Kato</span>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 8px', overflow: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {NAV_ITEMS.map(item => {
              if (item.path === '/admin' && role === 'viewer') return null
              const active = item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    padding: sidebarCollapsed ? '8px 0' : '6px 12px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                    background: active ? 'var(--hover-bg)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'background 0.1s, color 0.1s',
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)'
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  {sidebarCollapsed ? item.label[0] : item.label}
                </Link>
              )
            })}
          </div>

          {/* Agents section */}
          {agentStatuses && agentStatuses.length > 0 && (
            <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              {!sidebarCollapsed && (
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 12px', marginBottom: 8 }}>
                  Agents
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {agentStatuses.map(agent => {
                  const isWorking = !!agent.current_task
                  const isActive = agent.status === 'active'
                  return (
                    <Link
                      key={agent.id}
                      to="/agents"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: sidebarCollapsed ? '6px 0' : '5px 12px',
                        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                        borderRadius: 6,
                        textDecoration: 'none',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: !isActive ? 'var(--text-muted)' : isWorking ? '#5c7cfa' : '#34d399',
                        }} />
                      </div>
                      {!sidebarCollapsed && (
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {agent.name}
                          </div>
                          {isWorking && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {agent.current_task_summary}
                            </div>
                          )}
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '8px', borderTop: '1px solid var(--border)' }}>
          {/* Collapse */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              width: '100%', padding: '5px 0', fontSize: 11,
              color: 'var(--text-muted)', background: 'transparent', border: 'none',
              cursor: 'pointer', borderRadius: 4,
            }}
          >
            {sidebarCollapsed ? '→' : '← Collapse'}
          </button>

          {/* Role switcher - small, only when expanded */}
          {!sidebarCollapsed && (
            <div style={{ padding: '6px 4px', marginTop: 4 }}>
              <div style={{ display: 'flex', gap: 2, background: 'var(--hover-bg)', borderRadius: 4, padding: 2 }}>
                {(['admin', 'manager', 'viewer'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    style={{
                      flex: 1, fontSize: 10, padding: '3px 0', borderRadius: 3,
                      fontWeight: 500, textTransform: 'capitalize', border: 'none', cursor: 'pointer',
                      background: role === r ? 'var(--surface)' : 'transparent',
                      color: role === r ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleDarkMode}
            style={{
              width: '100%', padding: '5px 12px', fontSize: 11,
              color: 'var(--text-muted)', background: 'transparent', border: 'none',
              cursor: 'pointer', textAlign: 'left', borderRadius: 4,
            }}
          >
            {darkMode ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, marginLeft: sidebarW, transition: 'margin-left 0.2s ease' }}>
        {children}
      </main>
    </div>
  )
}
