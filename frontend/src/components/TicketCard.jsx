import { useNavigate } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { Clock, User, Zap } from 'lucide-react'

const PRIORITY_COLOR = {
  low:      'text-gray-400',
  medium:   'text-blue-400',
  high:     'text-orange-400',
  critical: 'text-red-400',
}

export default function TicketCard({ ticket }) {
  const nav = useNavigate()
  const created = ticket.created_at
    ? new Date(ticket.created_at).toLocaleString()
    : '—'

  return (
    <div
      onClick={() => nav(`/tickets/${ticket.ticket_id}`)}
      className="group bg-gray-900 border border-gray-800 rounded-xl p-5 cursor-pointer
                 hover:border-indigo-500/50 hover:bg-gray-800/60 transition-all duration-200
                 hover:shadow-lg hover:shadow-indigo-500/5"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-indigo-400 font-mono mb-1">{ticket.ticket_id}</p>
          <h3 className="font-semibold text-gray-100 truncate group-hover:text-white">
            {ticket.subject}
          </h3>
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      <p className="text-sm text-gray-400 line-clamp-2 mb-4">{ticket.description}</p>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <User size={12} />
          {ticket.user_email}
        </span>
        <span className={`flex items-center gap-1 font-medium ${PRIORITY_COLOR[ticket.priority] ?? 'text-gray-400'}`}>
          <Zap size={12} />
          {ticket.priority}
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <Clock size={12} />
          {created}
        </span>
      </div>

      {ticket.confidence_score != null && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">Confidence</span>
            <span className="text-gray-300 font-medium">
              {Math.round(ticket.confidence_score * 100)}%
            </span>
          </div>
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
              style={{ width: `${Math.round(ticket.confidence_score * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
