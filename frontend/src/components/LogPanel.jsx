import { useEffect, useRef } from 'react'
import { Terminal, Activity } from 'lucide-react'

function formatEntry(entry) {
  const ts = entry.logged_at ? new Date(entry.logged_at).toLocaleTimeString() : '??:??:??'
  const status = entry.status ?? 'unknown'
  const colorMap = {
    resolved:  { text: 'text-emerald-400', bg: 'bg-emerald-400', dot: 'bg-emerald-400' },
    escalated: { text: 'text-orange-400',  bg: 'bg-orange-400',  dot: 'bg-orange-400' },
    failed:    { text: 'text-red-400',     bg: 'bg-red-400',     dot: 'bg-red-400' },
  }
  const colors = colorMap[status] ?? { text: 'text-blue-400', bg: 'bg-blue-400', dot: 'bg-blue-400' }
  return { ts, status, colors, entry }
}

export default function LogPanel({ logs = [], autoScroll = true }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Terminal header bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5 bg-white/[0.02]">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors cursor-pointer" />
          <span className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors cursor-pointer" />
        </div>
        <div className="flex items-center gap-2 ml-2">
          <Terminal size={12} className="text-gray-500" />
          <span className="text-[11px] text-gray-500 font-mono">audit_log</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Activity size={11} className="text-green-400 animate-pulse" />
          <span className="text-[10px] text-gray-500 font-mono">{logs.length} entries</span>
        </div>
      </div>

      {/* Log body */}
      <div className="font-mono text-[11px] p-4 h-[520px] overflow-y-auto space-y-0.5">
        {logs.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Terminal size={32} className="mx-auto mb-3 text-gray-700" />
              <span className="text-gray-600 text-xs">Waiting for agent activity...</span>
            </div>
          </div>
        )}
        {logs.map((raw, i) => {
          const { ts, status, colors, entry } = formatEntry(raw)
          return (
            <div
              key={i}
              className="flex gap-3 leading-relaxed py-1.5 px-2 rounded-lg
                         hover:bg-white/[0.03] transition-colors duration-150 group"
              style={{ animationDelay: `${i * 20}ms` }}
            >
              <span className="text-gray-600 flex-shrink-0 tabular-nums">{ts}</span>
              <span className="flex items-center gap-1.5 flex-shrink-0 w-24">
                <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                <span className={`${colors.text} font-medium`}>{status}</span>
              </span>
              <span className="text-indigo-400/70 flex-shrink-0 font-medium">{entry.ticket_id}</span>
              <span className="text-gray-400 truncate flex-1 group-hover:text-gray-300 transition-colors">
                {entry.subject}
              </span>
              <span className="text-gray-600 ml-auto flex-shrink-0 tabular-nums">
                {entry.confidence_score != null ? `${Math.round(entry.confidence_score * 100)}%` : '—'}
              </span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
