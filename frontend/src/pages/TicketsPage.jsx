import { useEffect, useState } from 'react'
import { getTickets, runAgent } from '../api'
import TicketCard from '../components/TicketCard'
import { Plus, X, Search, Filter, Ticket, Bot, Sparkles, SlidersHorizontal } from 'lucide-react'

const STATUSES  = ['', 'pending', 'in_progress', 'resolved', 'escalated', 'failed']
const PRIORITIES = ['', 'low', 'medium', 'high', 'critical']

/* ─── New Ticket Modal ──────────────────────────────────────────── */
function NewTicketModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    subject: '', description: '', user_email: '',
    order_id: '', priority: 'medium', category: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await runAgent(form)
      onCreated()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to submit ticket.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="glass-strong rounded-2xl w-full max-w-lg shadow-2xl shadow-indigo-500/10 animate-fadeInUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600
                            flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">New Support Ticket</h2>
              <p className="text-[10px] text-gray-500 mt-0.5">AI agent will auto-resolve</p>
            </div>
          </div>
          <button onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center
                             hover:bg-white/5 text-gray-500 hover:text-white transition-all">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl px-4 py-3
                            flex items-center gap-2">
              <X size={14} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Subject *</label>
            <input
              required value={form.subject} onChange={e => set('subject', e.target.value)}
              className="w-full glass rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600
                         focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
              placeholder="Brief summary of the issue"
            />
          </div>

          <div>
            <label className="block text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Description *</label>
            <textarea
              required rows={3} value={form.description} onChange={e => set('description', e.target.value)}
              className="w-full glass rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600
                         focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none"
              placeholder="Describe the problem in detail..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Email *</label>
              <input
                required type="email" value={form.user_email} onChange={e => set('user_email', e.target.value)}
                className="w-full glass rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600
                           focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                placeholder="alice@example.com"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Order ID</label>
              <input
                value={form.order_id} onChange={e => set('order_id', e.target.value)}
                className="w-full glass rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600
                           focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                placeholder="ORD-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Priority</label>
              <select
                value={form.priority} onChange={e => set('priority', e.target.value)}
                className="w-full glass rounded-xl px-4 py-3 text-sm text-gray-100
                           focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
              >
                {['low','medium','high','critical'].map(p => (
                  <option key={p} value={p} className="bg-[#0d0d14]">
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Category</label>
              <select
                value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full glass rounded-xl px-4 py-3 text-sm text-gray-100
                           focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
              >
                <option value="" className="bg-[#0d0d14]">Auto-detect</option>
                {['software','hardware','network','security','access','billing','general'].map(c => (
                  <option key={c} value={c} className="bg-[#0d0d14]">
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl glass text-sm text-gray-400 font-medium
                         hover:bg-white/[0.06] hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600
                         text-sm font-semibold text-white hover:from-indigo-500 hover:to-purple-500
                         transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Submit & Run Agent
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Tickets Page ──────────────────────────────────────────────── */
export default function TicketsPage() {
  const [tickets, setTickets]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setModal]   = useState(false)
  const [search, setSearch]     = useState('')
  const [statusF, setStatusF]   = useState('')
  const [priorityF, setPriorityF] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusF)   params.status   = statusF
      if (priorityF) params.priority = priorityF
      const res = await getTickets(params)
      setTickets(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [statusF, priorityF])

  const filtered = tickets.filter(t =>
    !search ||
    t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.ticket_id.toLowerCase().includes(search.toLowerCase()) ||
    t.user_email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Tickets</h1>
          <p className="text-gray-500 text-sm mt-1">
            <span className="text-white font-semibold">{tickets.length}</span> total tickets
          </p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                     bg-gradient-to-r from-indigo-600 to-purple-600
                     text-sm font-semibold text-white hover:from-indigo-500 hover:to-purple-500
                     transition-all shadow-lg shadow-indigo-500/20 group"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
          New Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tickets…"
            className="w-full glass rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-600
                       focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl glass flex items-center justify-center">
            <SlidersHorizontal size={14} className="text-gray-500" />
          </div>
          <select
            value={statusF} onChange={e => setStatusF(e.target.value)}
            className="glass rounded-xl px-4 py-2.5 text-sm text-gray-300
                       focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
          >
            {STATUSES.map(s => (
              <option key={s} value={s} className="bg-[#0d0d14]">
                {s ? s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ') : 'All Statuses'}
              </option>
            ))}
          </select>
          <select
            value={priorityF} onChange={e => setPriorityF(e.target.value)}
            className="glass rounded-xl px-4 py-2.5 text-sm text-gray-300
                       focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
          >
            {PRIORITIES.map(p => (
              <option key={p} value={p} className="bg-[#0d0d14]">
                {p ? p.charAt(0).toUpperCase() + p.slice(1) : 'All Priorities'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      {search && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Search size={12} />
          <span>Showing <span className="text-white font-medium">{filtered.length}</span> results for "{search}"</span>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 glass rounded-2xl animate-pulse">
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
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl py-20 text-center">
          <Ticket size={36} className="mx-auto mb-3 text-gray-700" />
          <p className="text-gray-400 text-sm font-medium mb-1">No tickets found</p>
          <p className="text-gray-600 text-xs">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t, i) => (
            <div key={t.ticket_id} className="animate-fadeInUp" style={{ animationDelay: `${i * 0.04}s` }}>
              <TicketCard ticket={t} />
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <NewTicketModal onClose={() => setModal(false)} onCreated={load} />
      )}
    </div>
  )
}
