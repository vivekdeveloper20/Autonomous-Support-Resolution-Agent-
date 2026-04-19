import { Wrench, CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const STATUS_ICON = {
  success: <CheckCircle size={14} className="text-green-400" />,
  error:   <XCircle    size={14} className="text-red-400"   />,
  retried: <RefreshCw  size={14} className="text-yellow-400" />,
}

const STATUS_BORDER = {
  success: 'border-green-500/30',
  error:   'border-red-500/30',
  retried: 'border-yellow-500/30',
}

function ToolCallRow({ call, index }) {
  const [open, setOpen] = useState(false)
  const status = call.status ?? 'success'

  return (
    <div className={`border rounded-lg overflow-hidden ${STATUS_BORDER[status] ?? 'border-gray-700'}`}>
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800/60 hover:bg-gray-800 transition-colors text-left"
      >
        <span className="text-gray-500 text-xs font-mono w-5">{index + 1}.</span>
        <Wrench size={14} className="text-purple-400 flex-shrink-0" />
        <span className="font-mono text-sm text-purple-300 flex-1">{call.tool_name}</span>
        {call.attempt > 1 && (
          <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">
            retry ×{call.attempt}
          </span>
        )}
        {STATUS_ICON[status]}
        {open ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-4 py-3 bg-gray-900/60 space-y-3 border-t border-gray-700/50">
          {/* Args */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Arguments</p>
            <pre className="text-xs text-gray-300 bg-gray-950 rounded p-2 overflow-x-auto">
              {JSON.stringify(call.arguments, null, 2)}
            </pre>
          </div>
          {/* Result */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Result</p>
            <pre className="text-xs text-gray-300 bg-gray-950 rounded p-2 overflow-x-auto max-h-48">
              {typeof call.result === 'string'
                ? call.result
                : JSON.stringify(call.result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ToolCallView({ calls = [] }) {
  if (!calls.length) return (
    <div className="text-gray-500 text-sm italic">No tool calls recorded.</div>
  )

  return (
    <div className="space-y-2">
      {calls.map((call, i) => (
        <ToolCallRow key={call.id ?? i} call={call} index={i} />
      ))}
    </div>
  )
}
