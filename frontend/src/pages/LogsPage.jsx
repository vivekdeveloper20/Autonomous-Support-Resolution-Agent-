import { useEffect, useState, useRef } from 'react'
import { getLogs } from '../api'
import LogPanel from '../components/LogPanel'
import { RefreshCw, Play, Pause } from 'lucide-react'

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-gray-400 text-sm mt-1">Real-time agent activity — logs/audit_log.json</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLive(l => !l)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
              ${live
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
          >
            {live ? <><Play size={13} /> Live</> : <><Pause size={13} /> Paused</>}
          </button>
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700
                       text-sm text-gray-300 transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <LogPanel logs={logs} autoScroll={live} />

      {/* Raw JSON viewer */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Latest Entry (raw)</h2>
        {logs.length > 0 ? (
          <pre className="text-xs text-gray-400 bg-gray-950 rounded-lg p-4 overflow-x-auto max-h-64">
            {JSON.stringify(logs[logs.length - 1], null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-gray-600 italic">No entries yet.</p>
        )}
      </div>
    </div>
  )
}
