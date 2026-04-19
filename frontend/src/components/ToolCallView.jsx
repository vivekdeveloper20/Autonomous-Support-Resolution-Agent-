import { Wrench, CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronRight, Code, ArrowRight } from 'lucide-react'
import { useState } from 'react'

const STATUS_CONFIG = {
  success: {
    icon: <CheckCircle size={14} className="text-emerald-400" />,
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/5',
    label: 'Success',
    labelColor: 'text-emerald-400',
  },
  error: {
    icon: <XCircle size={14} className="text-red-400" />,
    border: 'border-red-500/20',
    bg: 'bg-red-500/5',
    label: 'Error',
    labelColor: 'text-red-400',
  },
  retried: {
    icon: <RefreshCw size={14} className="text-amber-400" />,
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/5',
    label: 'Retried',
    labelColor: 'text-amber-400',
  },
}

function ToolCallRow({ call, index }) {
  const [open, setOpen] = useState(false)
  const status = call.status ?? 'success'
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.success

  return (
    <div
      className={`glass rounded-xl overflow-hidden transition-all duration-300 animate-fadeInUp
                  ${open ? 'glow-purple' : ''}`}
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-all duration-200 text-left"
      >
        <span className="text-gray-600 text-[10px] font-mono w-5 text-right">{index + 1}</span>

        <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
          <Wrench size={13} className="text-purple-400" />
        </div>

        <div className="flex-1 min-w-0">
          <span className="font-mono text-xs text-purple-300 font-medium">{call.tool_name}</span>
        </div>

        {call.attempt > 1 && (
          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-semibold">
            ×{call.attempt}
          </span>
        )}

        <span className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${config.bg} ${config.labelColor}`}>
          {config.label}
        </span>

        {config.icon}

        <div className="transition-transform duration-200">
          {open
            ? <ChevronDown size={14} className="text-gray-500" />
            : <ChevronRight size={14} className="text-gray-500" />
          }
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-5 py-4 border-t border-white/5 space-y-4 animate-fadeIn">
          {/* Args */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ArrowRight size={10} className="text-indigo-400" />
              <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-semibold">Input Arguments</p>
            </div>
            <pre className="text-[11px] text-gray-300 bg-[#0a0a0f] rounded-lg p-3 overflow-x-auto font-mono
                            border border-white/5">
              {JSON.stringify(call.arguments, null, 2)}
            </pre>
          </div>
          {/* Result */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Code size={10} className="text-emerald-400" />
              <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-semibold">Output Result</p>
            </div>
            <pre className="text-[11px] text-gray-300 bg-[#0a0a0f] rounded-lg p-3 overflow-x-auto max-h-48 font-mono
                            border border-white/5">
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
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <Wrench size={28} className="mx-auto mb-2 text-gray-700" />
        <p className="text-gray-600 text-xs">No tool calls recorded.</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-2">
      {calls.map((call, i) => (
        <ToolCallRow key={call.id ?? i} call={call} index={i} />
      ))}
    </div>
  )
}
