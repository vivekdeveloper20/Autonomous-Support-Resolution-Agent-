import { useEffect, useRef } from 'react'
import { Terminal } from 'lucide-react'

function formatEntry(entry) {
  const ts = entry.logged_at ? new Date(entry.logged_at).toLocaleTimeString() : '??:??:??'
  const status = entry.status ?? 'unknown'
  const color =
    status === 'resolved'  ? 'text-green-400'  :
    status === 'escalated' ? 'text-orange-400' :
    status === 'failed'    ? 'text-red-400'    : 'text-blue-400'

  return { ts, status, color, entry }
}

export default function LogPanel({ logs = [], autoScroll = true }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
      {/* Terminal header bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 border-b border-gray-800">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/70" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <span className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <Terminal size={13} className="text-gray-500 ml-2" />
        <span className="text-xs text-gray-500 font-mono">audit_log — live</span>
        <span className="ml-auto text-xs text-gray-600">{logs.length} entries</span>
      </div>

      {/* Log body */}
      <div className="font-mono text-xs p-4 h-[520px] overflow-y-auto space-y-1">
        {logs.length === 0 && (
          <span className="text-gray-600">Waiting for agent activity...</span>
        )}
        {logs.map((raw, i) => {
          const { ts, status, color, entry } = formatEntry(raw)
          return (
            <div key={i} className="flex gap-2 leading-relaxed hover:bg-gray-900/40 px-1 rounded">
              <span className="text-gray-600 flex-shrink-0">{ts}</span>
              <span className={`flex-shrink-0 w-20 ${color}`}>[{status}]</span>
              <span className="text-indigo-400 flex-shrink-0">{entry.ticket_id}</span>
              <span className="text-gray-400 truncate">{entry.subject}</span>
              <span className="text-gray-600 ml-auto flex-shrink-0">
                conf: {entry.confidence_score != null ? `${Math.round(entry.confidence_score * 100)}%` : '—'}
              </span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
