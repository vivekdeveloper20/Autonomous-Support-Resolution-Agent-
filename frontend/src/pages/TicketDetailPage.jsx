import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTicket } from '../api'
import StatusBadge from '../components/StatusBadge'
import ReasoningView from '../components/ReasoningView'
import ToolCallView from '../components/ToolCallView'
import {
  ArrowLeft, RefreshCw, Tag, Brain, Wrench, Target, Award,
  Clock, Mail, Shield, Users, Hash, Bot
} from 'lucide-react'

function Section({ icon: Icon, title, badge, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-6 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
          <Icon size={14} className="text-indigo-400" />
        </div>
        <h2 className="font-semibold text-sm text-white flex-1 text-left">{title}</h2>
        {badge != null && (
          <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded-md">{badge}</span>
        )}
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-6 pb-5 border-t border-white/5 pt-4">{children}</div>}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
      {Icon && (
        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
          <Icon size={12} className="text-gray-500" />
        </div>
      )}
      <span className="text-xs text-gray-500 w-24 flex-shrink-0 font-medium">{label}</span>
      <span className={`text-sm text-gray-200 flex-1 ${mono ? 'font-mono text-xs' : ''}`}>
        {value ?? <span className="text-gray-600">—</span>}
      </span>
    </div>
  )
}

const ACTION_STYLE = {
  refund:   { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/20', glow: 'glow-green' },
  reply:    { bg: 'bg-blue-500/10',    text: 'text-blue-300',    border: 'border-blue-500/20',    glow: 'glow-indigo' },
  escalate: { bg: 'bg-orange-500/10',  text: 'text-orange-300',  border: 'border-orange-500/20',  glow: 'glow-orange' },
  resolved: { bg: 'bg-purple-500/10',  text: 'text-purple-300',  border: 'border-purple-500/20',  glow: 'glow-purple' },
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

  useEffect(() => {
    if (!polling) return
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [polling, load])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20
                        flex items-center justify-center animate-pulse">
          <Bot size={20} className="text-indigo-400" />
        </div>
        <p className="text-xs text-gray-500">Loading ticket...</p>
      </div>
    </div>
  )

  if (!ticket) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Ticket not found.</p>
      <button onClick={() => nav(-1)} className="mt-4 text-indigo-400 text-sm hover:underline">Go back</button>
    </div>
  )

  const actionStyle = ACTION_STYLE[ticket.final_action] ?? ACTION_STYLE.resolved

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => nav(-1)}
          className="mt-1 w-10 h-10 rounded-xl glass flex items-center justify-center
                     text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1.5">
            <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg">
              {ticket.ticket_id}
            </span>
            <StatusBadge status={ticket.status} size="lg" />
            {polling && (
              <span className="flex items-center gap-1.5 text-[10px] text-blue-400 bg-blue-500/10
                               px-2.5 py-1 rounded-lg border border-blue-500/20 animate-pulse">
                <RefreshCw size={10} className="animate-spin" /> Agent processing…
              </span>
            )}
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">{ticket.subject}</h1>
        </div>
        <button
          onClick={load}
          className="w-10 h-10 rounded-xl glass flex items-center justify-center
                     text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Ticket info */}
      <Section icon={Tag} title="Ticket Information">
        <div className="space-y-0">
          <InfoRow icon={Hash}   label="Description" value={ticket.description} />
          <InfoRow icon={Mail}   label="Customer"    value={ticket.user_email} mono />
          <InfoRow icon={Shield} label="Priority"    value={ticket.priority} />
          <InfoRow icon={Tag}    label="Category"    value={ticket.category} />
          <InfoRow icon={Users}  label="Team"        value={ticket.assigned_team} />
          <InfoRow icon={Clock}  label="Created"     value={ticket.created_at ? new Date(ticket.created_at).toLocaleString() : null} />
          <InfoRow icon={Clock}  label="Resolved"    value={ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleString() : null} />
        </div>
      </Section>

      {/* Final decision cards */}
      {(ticket.final_action || ticket.confidence_score != null) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ticket.final_action && (
            <div className={`glass rounded-2xl p-6 ${actionStyle.glow} animate-fadeInUp`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg ${actionStyle.bg} flex items-center justify-center`}>
                  <Target size={14} className={actionStyle.text} />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400">Final Action</span>
              </div>
              <p className={`text-3xl font-extrabold capitalize ${actionStyle.text}`}>{ticket.final_action}</p>
            </div>
          )}
          {ticket.confidence_score != null && (
            <div className="glass rounded-2xl p-6 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Award size={14} className="text-amber-400" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400">AI Confidence</span>
              </div>
              <p className="text-3xl font-extrabold text-white mb-3">
                {Math.round(ticket.confidence_score * 100)}%
              </p>
              <div className="relative h-2.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-500
                             rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.round(ticket.confidence_score * 100)}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500/40 via-yellow-400/40 to-emerald-500/40
                             rounded-full blur-sm transition-all duration-1000 ease-out"
                  style={{ width: `${Math.round(ticket.confidence_score * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reasoning steps */}
      <Section
        icon={Brain}
        title="AI Reasoning Chain"
        badge={ticket.reasoning_steps?.length ?? 0}
      >
        <ReasoningView steps={ticket.reasoning_steps ?? []} />
      </Section>

      {/* Tool calls */}
      <Section
        icon={Wrench}
        title="Tool Executions"
        badge={ticket.tool_calls?.length ?? 0}
      >
        <ToolCallView calls={ticket.tool_calls ?? []} />
      </Section>
    </div>
  )
}
