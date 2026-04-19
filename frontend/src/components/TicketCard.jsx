import { useNavigate } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { Clock, User, Zap, ArrowUpRight } from 'lucide-react'

const PRIORITY_BADGE = {
  low:      { label: 'Low',      class: 'text-gray-400 bg-gray-500/10' },
  medium:   { label: 'Medium',   class: 'text-blue-400 bg-blue-500/10' },
  high:     { label: 'High',     class: 'text-orange-400 bg-orange-500/10' },
  critical: { label: 'Critical', class: 'text-red-400 bg-red-500/10 animate-pulse' },
}

const ACCENT_LINE = {
  pending:     'from-amber-500 to-yellow-500',
  in_progress: 'from-blue-500 to-cyan-500',
  resolved:    'from-emerald-500 to-green-500',
  escalated:   'from-orange-500 to-amber-500',
  failed:      'from-red-500 to-rose-500',
}

export default function TicketCard({ ticket }) {
  const nav = useNavigate()
  const created = ticket.created_at
    ? new Date(ticket.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : '—'

  const priority = PRIORITY_BADGE[ticket.priority] ?? PRIORITY_BADGE.medium
  const accentLine = ACCENT_LINE[ticket.status] ?? ACCENT_LINE.pending

  return (
    <div
      onClick={() => nav(`/tickets/${ticket.ticket_id}`)}
      className="group relative glass rounded-2xl overflow-hidden cursor-pointer
                 transition-all duration-300 hover:scale-[1.02] hover:glow-indigo"
    >
      {/* Top accent line */}
      <div className={`h-0.5 bg-gradient-to-r ${accentLine} opacity-60 group-hover:opacity-100 transition-opacity`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono text-indigo-400/70 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                {ticket.ticket_id}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${priority.class}`}>
                {priority.label}
              </span>
            </div>
            <h3 className="font-semibold text-[13px] text-gray-100 truncate group-hover:text-white transition-colors">
              {ticket.subject}
            </h3>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={ticket.status} />
            <ArrowUpRight size={14} className="text-gray-600 opacity-0 group-hover:opacity-100 
                                                transition-all duration-300 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">{ticket.description}</p>

        {/* Footer */}
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <User size={10} className="text-gray-600" />
            <span className="truncate max-w-[120px]">{ticket.user_email}</span>
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <Clock size={10} className="text-gray-600" />
            {created}
          </span>
        </div>

        {/* Confidence bar */}
        {ticket.confidence_score != null && (
          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between text-[10px] mb-1.5">
              <span className="text-gray-500 font-medium">AI Confidence</span>
              <span className="text-white font-bold">
                {Math.round(ticket.confidence_score * 100)}%
              </span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full
                           transition-all duration-1000 ease-out"
                style={{ width: `${Math.round(ticket.confidence_score * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
