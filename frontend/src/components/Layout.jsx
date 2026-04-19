import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Ticket, ScrollText, Zap,
  Bot, ChevronRight, Sparkles
} from 'lucide-react'
import { useEffect, useState } from 'react'

const NAV = [
  { to: '/',        label: 'Dashboard', icon: LayoutDashboard, desc: 'Overview & stats' },
  { to: '/tickets', label: 'Tickets',   icon: Ticket,          desc: 'Manage & create' },
  { to: '/logs',    label: 'Audit Logs', icon: ScrollText,     desc: 'Real-time activity' },
]

function OrbitalDot() {
  return (
    <div className="absolute w-2 h-2 rounded-full bg-indigo-400/60 animate-orbit" />
  )
}

export default function Layout() {
  const location = useLocation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="min-h-screen flex bg-[#0a0a0f] bg-grid">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/8 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute top-1/2 -right-48 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[150px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Sidebar */}
      <aside className={`w-64 flex-shrink-0 sidebar-border flex flex-col relative z-10
                         ${mounted ? 'animate-slideInLeft' : 'opacity-0'}`}>
        {/* Sidebar background */}
        <div className="absolute inset-0 bg-[#0d0d14]/90 backdrop-blur-xl" />

        <div className="relative flex flex-col h-full">
          {/* Logo */}
          <div className="px-5 py-6">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500
                              flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-gradient">
                <Bot size={20} className="text-white" />
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0d0d14]" />
              </div>
              <div>
                <p className="text-sm font-bold text-white tracking-tight">SupportAgent</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Sparkles size={10} className="text-indigo-400" />
                  <p className="text-[11px] text-indigo-400/80 font-medium">AI-Powered</p>
                </div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-2 space-y-1">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em] px-3 mb-3">Navigation</p>
            {NAV.map(({ to, label, icon: Icon, desc }, idx) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-300 relative
                   ${isActive
                     ? 'bg-indigo-500/15 text-white glow-indigo'
                     : 'text-gray-400 hover:text-white hover:bg-white/5'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300
                      ${isActive
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/30'
                        : 'bg-white/5 group-hover:bg-white/10'}`}>
                      <Icon size={16} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-[13px] ${isActive ? 'text-white' : ''}`}>{label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 truncate">{desc}</p>
                    </div>
                    {isActive && (
                      <ChevronRight size={14} className="text-indigo-400 animate-fadeIn" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-5 py-5">
            <div className="glass rounded-xl p-4 relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wider">System Online</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">ReAct Agent v2.0</p>
                <p className="text-[10px] text-gray-600 mt-0.5">Think → Act → Observe</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto relative z-10">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div key={location.pathname} className="animate-fadeInUp">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
