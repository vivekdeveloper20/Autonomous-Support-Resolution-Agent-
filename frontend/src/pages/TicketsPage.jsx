import { useEffect, useState } from 'react'
import { getTickets, runAgent } from '../api'
import TicketCard from '../components/TicketCard'
import { Plus, X, Search, Filter } from 'lucide-react'

const STATUSES  = ['', 'pending', 'in_progress', 'resolved', 'escalated', 'failed']
const PRIORITIES = ['', 'low', 'medium', 'high', 'critical']

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white">New Support Ticket</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-1">Subject *</label>
            <input
              required value={form.subject} onChange={e => set('subject', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm
                         text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              placeholder="Brief summary of the issue"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Description *</label>
            <textarea
              required rows={3} value={form.description} onChange={e => set('description', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm
                         text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none"
              placeholder="Describe the problem in detail..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Customer Email *</label>
              <input
                required type="email" value={form.user_email} onChange={e => set('user_email', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm
                           text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                placeholder="alice@example.com"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Order ID</label>
              <input
                value={form.order_id} onChange={e => set('order_id', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm
                           text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                placeholder="ORD-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Priority</label>
              <select
                value={form.priority} onChange={e => set('priority', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm
                           text-gray-100 focus:outline-none focus:border-indigo-500"
              >
                {['low','medium','high','critical'].map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Category</label>
              <select
                value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm
                           text-gray-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Auto-detect</option>
                {['software','hardware','network','security','access','billing','general'].map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-700 text-sm text-gray-400
                         hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={loading}
              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600
                         text-sm font-medium text-white hover:from-indigo-500 hover:to-purple-500
                         transition-all disabled:opacity-50"
            >
              {loading ? 'Submitting…' : 'Submit & Run Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

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
          <h1 className="text-2xl font-bold text-white">Tickets</h1>
          <p className="text-gray-400 text-sm mt-1">{tickets.length} total tickets</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg
                     bg-gradient-to-r from-indigo-600 to-purple-600
                     text-sm font-medium text-white hover:from-indigo-500 hover:to-purple-500
                     transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus size={16} />
          New Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tickets…"
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm
                       text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-500" />
          <select
            value={statusF} onChange={e => setStatusF(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm
                       text-gray-300 focus:outline-none focus:border-indigo-500"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
          <select
            value={priorityF} onChange={e => setPriorityF(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm
                       text-gray-300 focus:outline-none focus:border-indigo-500"
          >
            {PRIORITIES.map(p => <option key={p} value={p}>{p || 'All Priorities'}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p>No tickets found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => <TicketCard key={t.ticket_id} ticket={t} />)}
        </div>
      )}

      {showModal && (
        <NewTicketModal onClose={() => setModal(false)} onCreated={load} />
      )}
    </div>
  )
}
