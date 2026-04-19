import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Ticket, ScrollText, Zap } from 'lucide-react'

const NAV = [
  { to: '/',        label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tickets', label: 'Tickets',   icon: Ticket          },
  { to: '/logs',    label: 'Logs',      icon: ScrollText      },
]

export default function Layout() {
  return (
    <div className="min-h-screen flex bg-gray-950">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600
                            flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">SupportAgent</p>
              <p className="text-xs text-gray-500 mt-0.5">Autonomous AI</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                 ${isActive
                   ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                   : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-800">
          <p className="text-xs text-gray-600">ReAct Agent v2.0</p>
          <p className="text-xs text-gray-700">Think → Act → Observe</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
