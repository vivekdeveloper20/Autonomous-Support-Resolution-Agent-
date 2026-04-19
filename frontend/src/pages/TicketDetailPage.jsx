import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTicket } from '../api'
import StatusBadge from '../components/StatusBadge'
import ReasoningView from '../components/ReasoningView'
import ToolCallView from '../components/ToolCallView'
import {
  ArrowLeft, RefreshCw, User, Mail, Tag, Zap,
  Clock, Brain, Wrench, Target, Award,
} from 'lucide-react'

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} className="text-indigo-400" />
        <h2 className="font-semibold text-gray-200">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-800 last:border-0">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className={`text-sm text-gray-200 text-right ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</span>
    </div>
  )
}

const ACTION_STYLE = {
  refund:   'bg-green-500/20 text-green-300 border-green-500/30',
  reply:    'bg-blue-500/20  text-blue-300  border-blue-500/30',
  escalate: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  resolved: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
}

export default function TicketDetailPage() {
  const { id }  = useParams()
  const nav     = useNavigate()
  const [ticket, setTicket]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await getTicket(id)
      setTicket(res.data)
      // Keep polling while in-progress or pending
      if (['pending', 'in_progress'].includes(res.data.status)) {
        setPolling(true)
      } else {
        setPolling(false)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  // Auto-refresh while agent is running
  useEffect(() => {
    if (!polling) return
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [polling, load])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw size={24} className="animate-spin text-indigo-400" />
    </div>
  )

  if (!ticket) return (
    <div className="text-center py-20 text-gray-500">Ticket not found.</div>
  )

  const actionStyle = ACTION_STYLE[ticket.final_action] ?? ACTION_STYLE.resolved

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => nav(-1)}
          className="mt-1 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-indigo-400 text-sm">{ticket.ticket_id}</span>
            <StatusBadge status={ticket.status} />
            {polling && (
              <span className="flex items-center gap-1 text-xs text-blue-400">
                <RefreshCw size={11} className="animate-spin" /> Agent running…
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-white mt-1">{ticket.subject}</h1>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Ticket info */}
      <Section icon={Tag} title="Ticket Info">
        <InfoRow label="Description" value={ticket.description} />
        <InfoRow label="Customer"    value={ticket.user_email} mono />
        <InfoRow label="Priority"    value={ticket.priority} />
        <InfoRow label="Category"    value={ticket.category} />
        <InfoRow label="Team"        value={ticket.assigned_team} />
        <InfoRow label="Created"     value={ticket.created_at ? new Date(ticket.created_at).toLocaleString() : null} />
        <InfoRow label="Resolved"    value={ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleString() : null} />
      </Section>

      {/* Final decision */}
      {(ticket.final_action || ticket.confidence_score != null) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ticket.final_action && (
            <div className={`rounded-xl p-5 border ${actionStyle}`}>
              <div className="flex items-center gap-2 mb-1">
                <Target size={15} />
                <span className="text-xs font-medium uppercase tracking-wide">Final Action</span>
              </div>
              <p className="text-2xl font-bold capitalize">{ticket.final_action}</p>
            </div>
          )}
          {ticket.confidence_score != null && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <Award size={15} className="text-yellow-400" />
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Confidence</span>
              </div>
              <p className="text-2xl font-bold text-white mb-2">
                {Math.round(ticket.confidence_score * 100)}%
              </p>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-green-500 rounded-full"
                  style={{ width: `${Math.round(ticket.confidence_score * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reasoning steps */}
      <Section icon={Brain} title={`Reasoning Steps (${ticket.reasoning_steps?.length ?? 0})`}>
        <ReasoningView steps={ticket.reasoning_steps ?? []} />
      </Section>

      {/* Tool calls */}
      <Section icon={Wrench} title={`Tool Calls (${ticket.tool_calls?.length ?? 0})`}>
        <ToolCallView calls={ticket.tool_calls ?? []} />
      </Section>
    </div>
  )
}
