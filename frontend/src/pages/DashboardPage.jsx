import { useEffect, useState } from 'react'
import { getStats, getTickets } from '../api'
import StatCard from '../components/StatCard'
import TicketCard from '../components/TicketCard'
import { CheckCircle, AlertTriangle, XCircle, Ticket, TrendingUp, RefreshCw } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats]     = useState(null)
  const [recent, setRecent]   = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [s, t] = await Promise.all([getStats(), getTickets({ limit: 6 })])
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
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Autonomous Support Resolution Agent — overview</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700
                     text-sm text-gray-300 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tickets"
          value={stats?.total}
          icon={Ticket}
          gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
          sub={`${stats?.in_progress ?? 0} in progress`}
        />
        <StatCard
          label="Resolved"
          value={stats?.resolved}
          icon={CheckCircle}
          gradient="bg-gradient-to-br from-green-500 to-emerald-600"
          sub={`${stats?.resolution_rate ?? 0}% rate`}
        />
        <StatCard
          label="Escalated"
          value={stats?.escalated}
          icon={AlertTriangle}
          gradient="bg-gradient-to-br from-orange-500 to-amber-600"
          sub="Needs human review"
        />
        <StatCard
          label="Failed"
          value={stats?.failed}
          icon={XCircle}
          gradient="bg-gradient-to-br from-red-500 to-rose-600"
          sub="Agent errors"
        />
      </div>

      {/* Resolution rate bar */}
      {stats && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-400" />
              <span className="text-sm font-medium text-gray-300">Resolution Rate</span>
            </div>
            <span className="text-lg font-bold text-white">{stats.resolution_rate}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
              style={{ width: `${stats.resolution_rate}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-2">
            <span>0%</span><span>100%</span>
          </div>
        </div>
      )}

      {/* Recent tickets */}
      <div>
        <h2 className="text-lg font-semibold text-gray-200 mb-4">Recent Tickets</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Ticket size={40} className="mx-auto mb-3 opacity-30" />
            <p>No tickets yet. Submit one from the Tickets page.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recent.map(t => <TicketCard key={t.ticket_id} ticket={t} />)}
          </div>
        )}
      </div>
    </div>
  )
}
