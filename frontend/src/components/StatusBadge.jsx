const STYLES = {
  pending:     'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  in_progress: 'bg-blue-500/20   text-blue-300   border border-blue-500/30',
  resolved:    'bg-green-500/20  text-green-300  border border-green-500/30',
  escalated:   'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  failed:      'bg-red-500/20    text-red-300    border border-red-500/30',
}

const LABELS = {
  pending:     'Pending',
  in_progress: 'In Progress',
  resolved:    'Resolved',
  escalated:   'Escalated',
  failed:      'Failed',
}

export default function StatusBadge({ status }) {
  const s = status?.toLowerCase() ?? 'pending'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STYLES[s] ?? STYLES.pending}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {LABELS[s] ?? status}
    </span>
  )
}
