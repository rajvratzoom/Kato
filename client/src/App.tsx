import { Routes, Route } from 'react-router-dom'
import { useState, createContext, useContext } from 'react'
import Layout from './components/Layout'
import Chat from './pages/Chat'
import KanbanBoard from './pages/KanbanBoard'
import TaskDetail from './pages/TaskDetail'
import Agents from './pages/Agents'
import AdminConsole from './pages/AdminConsole'
import ExecutionLog from './pages/ExecutionLog'
import Integrations from './pages/Integrations'

type Role = 'admin' | 'manager' | 'viewer'

interface AppContextType {
  role: Role
  setRole: (r: Role) => void
  darkMode: boolean
  toggleDarkMode: () => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
}

export const AppContext = createContext<AppContextType>({
  role: 'admin',
  setRole: () => {},
  darkMode: false,
  toggleDarkMode: () => {},
  sidebarCollapsed: false,
  setSidebarCollapsed: () => {},
})

export const useAppContext = () => useContext(AppContext)

export default function App() {
  const [role, setRole] = useState<Role>('admin')
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const toggleDarkMode = () => setDarkMode(d => !d)

  return (
    <AppContext.Provider value={{ role, setRole, darkMode, toggleDarkMode, sidebarCollapsed, setSidebarCollapsed }}>
      <div className={darkMode ? 'dark' : ''}>
        <Layout>
          <Routes>
            <Route path="/" element={<Chat />} />
            <Route path="/board" element={<KanbanBoard />} />
            <Route path="/task/:id" element={<TaskDetail />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/admin" element={<AdminConsole />} />
            <Route path="/logs" element={<ExecutionLog />} />
            <Route path="/integrations" element={<Integrations />} />
          </Routes>
        </Layout>
      </div>
    </AppContext.Provider>
  )
}
