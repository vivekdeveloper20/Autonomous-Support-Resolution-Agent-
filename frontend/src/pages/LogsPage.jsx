import { useEffect, useState, useRef } from 'react'
import { getLogs } from '../api'
import LogPanel from '../components/LogPanel'
import { RefreshCw, Play, Pause, Activity, Terminal, Code, Wifi, WifiOff } from 'lucide-react'

export default function LogsPage() {
  const [logs, setLogs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [live, setLive]         = useState(true)
  const intervalRef             = useRef(null)

  const load = async () => {
    try {
      const res = await getLogs(200)
      setLogs(res.data.logs ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (live) {
      intervalRef.current = setInterval(load, 4000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [live])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Audit Logs</h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
            <Terminal size={12} />
            Real-time agent activity stream
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLive(l => !l)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
              ${live
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 glow-green'
                : 'glass text-gray-400'}`}
          >
            {live ? (
              <>
                <Wifi size={13} className="animate-pulse" />
                <span>Live</span>
              </>
            ) : (
              <>
                <WifiOff size={13} />
                <span>Paused</span>
              </>
            )}
          </button>
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-sm text-gray-300
                       hover:bg-white/[0.06] transition-all"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Entries', value: logs.length, icon: Activity, color: 'text-indigo-400' },
          { label: 'Resolved', value: logs.filter(l => l.status === 'resolved').length, icon: Activity, color: 'text-emerald-400' },
          { label: 'Escalated', value: logs.filter(l => l.status === 'escalated').length, icon: Activity, color: 'text-orange-400' },
          { label: 'Failed', value: logs.filter(l => l.status === 'failed').length, icon: Activity, color: 'text-red-400' },
        ].map((item, i) => (
          <div key={i} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
            <item.icon size={14} className={item.color} />
            <div>
              <p className="text-lg font-bold text-white">{item.value}</p>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Log Panel */}
      <LogPanel logs={logs} autoScroll={live} />

      {/* Raw JSON viewer */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-3.5 border-b border-white/5">
          <Code size={13} className="text-gray-500" />
          <span className="text-xs font-semibold text-gray-300">Latest Entry</span>
          <span className="text-[9px] text-gray-600 font-mono ml-auto">JSON</span>
        </div>
        <div className="p-5">
          {logs.length > 0 ? (
            <pre className="text-[11px] text-gray-400 bg-[#0a0a0f] rounded-xl p-4 overflow-x-auto max-h-64
                            border border-white/5 font-mono">
              {JSON.stringify(logs[logs.length - 1], null, 2)}
            </pre>
          ) : (
            <p className="text-xs text-gray-600 italic text-center py-6">No entries yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
