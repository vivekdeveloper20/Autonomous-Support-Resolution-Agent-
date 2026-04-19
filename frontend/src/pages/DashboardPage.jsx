import { useEffect, useState } from 'react'
import { getStats, getTickets } from '../api'
import StatCard from '../components/StatCard'
import TicketCard from '../components/TicketCard'
import {
  CheckCircle, AlertTriangle, XCircle, Ticket, TrendingUp,
  RefreshCw, Activity, ArrowRight, Sparkles, Bot, Zap
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/* ─── Mini Donut Chart ──────────────────────────────────────────── */
function DonutChart({ stats }) {
  const total = stats.total || 1
  const segments = [
    { label: 'Resolved',  value: stats.resolved,  color: '#22c55e' },
    { label: 'Escalated', value: stats.escalated,  color: '#f97316' },
    { label: 'Failed',    value: stats.failed,     color: '#ef4444' },
    { label: 'Pending',   value: stats.pending + (stats.in_progress || 0), color: '#eab308' },
  ]

  let cumulative = 0
  const radius = 60
  const circumference = 2 * Math.PI * radius

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-36 h-36 flex-shrink-0">
        <svg viewBox="0 0 160 160" className="transform -rotate-90 w-full h-full">
          {/* Background ring */}
          <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
          {segments.map((seg, i) => {
            const pct = (seg.value / total) * 100
            const dashLength = (pct / 100) * circumference
            const dashOffset = -((cumulative / 100) * circumference)
            cumulative += pct
            return (
              <circle
                key={i}
                cx="80" cy="80" r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="16"
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{ opacity: 0.85 }}
              />
            )
          })}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-white">{stats.total}</span>
          <span className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-gray-400 w-16">{seg.label}</span>
            <span className="text-xs font-bold text-white">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Activity Item ─────────────────────────────────────────────── */
function ActivityItem({ ticket, index }) {
  const nav = useNavigate()
  const statusColors = {
    resolved:    'text-emerald-400 bg-emerald-500/10',
    escalated:   'text-orange-400 bg-orange-500/10',
    failed:      'text-red-400 bg-red-500/10',
    in_progress: 'text-blue-400 bg-blue-500/10',
    pending:     'text-amber-400 bg-amber-500/10',
  }
  const sc = statusColors[ticket.status] ?? statusColors.pending
  const time = ticket.created_at
    ? new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <div
      onClick={() => nav(`/tickets/${ticket.ticket_id}`)}
      className="flex items-center gap-3 py-2.5 px-3 rounded-xl cursor-pointer
                 hover:bg-white/[0.03] transition-all duration-200 group animate-fadeInUp"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sc} flex-shrink-0`}>
        <Zap size={12} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-200 font-medium truncate group-hover:text-white transition-colors">
          {ticket.subject}
        </p>
        <p className="text-[10px] text-gray-500 mt-0.5">{ticket.ticket_id}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[10px] text-gray-500">{time}</p>
        <p className={`text-[9px] font-semibold uppercase tracking-wider mt-0.5 ${sc.split(' ')[0]}`}>
          {ticket.status?.replace('_', ' ')}
        </p>
      </div>
    </div>
  )
}

/* ─── Dashboard Page ────────────────────────────────────────────── */
export default function DashboardPage() {
  const [stats, setStats]     = useState(null)
  const [recent, setRecent]   = useState([])
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  const load = async () => {
    setLoading(true)
    try {
      const [s, t] = await Promise.all([getStats(), getTickets({ limit: 9 })])
      setStats(s.data)
      setRecent(t.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Dashboard</h1>
            <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full
                             border border-indigo-500/20 flex items-center gap-1">
              <Sparkles size={10} />
              AI-Powered
            </span>
          </div>
          <p className="text-gray-500 text-sm">Autonomous Support Resolution Agent — real-time overview</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-sm text-gray-300
                     hover:bg-white/[0.06] transition-all duration-300 group"
        >
          <RefreshCw size={14} className={`group-hover:text-indigo-400 transition-colors ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tickets"
          value={stats?.total}
          icon={Ticket}
          gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
          glowClass="glow-indigo"
          sub={`${stats?.in_progress ?? 0} in progress`}
          delay={0.05}
        />
        <StatCard
          label="Resolved"
          value={stats?.resolved}
          icon={CheckCircle}
          gradient="bg-gradient-to-br from-emerald-500 to-green-600"
          glowClass="glow-green"
          sub={`${stats?.resolution_rate ?? 0}% rate`}
          delay={0.10}
        />
        <StatCard
          label="Escalated"
          value={stats?.escalated}
          icon={AlertTriangle}
          gradient="bg-gradient-to-br from-orange-500 to-amber-600"
          glowClass="glow-orange"
          sub="Needs human review"
          delay={0.15}
        />
        <StatCard
          label="Failed"
          value={stats?.failed}
          icon={XCircle}
          gradient="bg-gradient-to-br from-red-500 to-rose-600"
          glowClass="glow-red"
          sub="Agent errors"
          delay={0.20}
        />
      </div>

      {/* Middle row: Donut chart + Resolution rate + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Donut Chart */}
        {stats && (
          <div className="glass rounded-2xl p-6 animate-fadeInUp stagger-4">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Activity size={14} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Distribution</h3>
                <p className="text-[10px] text-gray-500">Ticket breakdown</p>
              </div>
            </div>
            <DonutChart stats={stats} />
          </div>
        )}

        {/* Resolution Rate */}
        {stats && (
          <div className="glass rounded-2xl p-6 flex flex-col animate-fadeInUp stagger-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <TrendingUp size={14} className="text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Resolution Rate</h3>
                <p className="text-[10px] text-gray-500">Overall performance</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="text-center mb-6">
                <span className="text-5xl font-extrabold gradient-text">{stats.resolution_rate}%</span>
                <p className="text-xs text-gray-500 mt-2">of tickets resolved autonomously</p>
              </div>

              <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
                             rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${stats.resolution_rate}%` }}
                />
                {/* Glow overlay */}
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-pink-500/50
                             rounded-full blur-sm transition-all duration-1000 ease-out"
                  style={{ width: `${stats.resolution_rate}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-600 mt-2 px-0.5">
                <span>0%</span><span>50%</span><span>100%</span>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity Feed */}
        <div className="glass rounded-2xl p-6 animate-fadeInUp stagger-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Activity size={14} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Activity</h3>
                <p className="text-[10px] text-gray-500">Latest updates</p>
              </div>
            </div>
            <button
              onClick={() => nav('/tickets')}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1
                         transition-colors"
            >
              View All <ArrowRight size={10} />
            </button>
          </div>

          <div className="space-y-0.5 max-h-[240px] overflow-y-auto">
            {recent.slice(0, 6).map((t, i) => (
              <ActivityItem key={t.ticket_id} ticket={t} index={i} />
            ))}
            {recent.length === 0 && !loading && (
              <div className="text-center py-8">
                <Bot size={24} className="mx-auto mb-2 text-gray-700" />
                <p className="text-[11px] text-gray-600">No activity yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent tickets grid */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">Recent Tickets</h2>
            <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-md font-mono">
              {recent.length} shown
            </span>
          </div>
          <button
            onClick={() => nav('/tickets')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5
                       transition-colors group"
          >
            See all tickets
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-44 glass rounded-2xl animate-pulse">
                <div className="h-0.5 bg-white/5 rounded-t-2xl" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-white/5 rounded w-24" />
                  <div className="h-4 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                  <div className="h-3 bg-white/5 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="glass rounded-2xl py-20 text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Ticket size={28} className="text-gray-600" />
              </div>
            </div>
            <p className="text-gray-400 text-sm font-medium mb-1">No tickets yet</p>
            <p className="text-gray-600 text-xs">Submit your first ticket to see the AI agent in action</p>
            <button
              onClick={() => nav('/tickets')}
              className="mt-4 px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-sm
                         font-medium text-white hover:from-indigo-500 hover:to-purple-500 transition-all
                         shadow-lg shadow-indigo-500/20"
            >
              Create Ticket
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recent.map((t, i) => (
              <div key={t.ticket_id} className="animate-fadeInUp" style={{ animationDelay: `${i * 0.05}s` }}>
                <TicketCard ticket={t} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
