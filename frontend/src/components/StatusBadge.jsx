const STYLES = {
  pending:     'bg-amber-500/10 text-amber-300 border border-amber-500/20',
  in_progress: 'bg-blue-500/10 text-blue-300 border border-blue-500/20',
  resolved:    'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
  escalated:   'bg-orange-500/10 text-orange-300 border border-orange-500/20',
  failed:      'bg-red-500/10 text-red-300 border border-red-500/20',
}

const DOT_COLOR = {
  pending:     'bg-amber-400',
  in_progress: 'bg-blue-400 animate-pulse',
  resolved:    'bg-emerald-400',
  escalated:   'bg-orange-400',
  failed:      'bg-red-400',
}

const LABELS = {
  pending:     'Pending',
  in_progress: 'In Progress',
  resolved:    'Resolved',
  escalated:   'Escalated',
  failed:      'Failed',
}

export default function StatusBadge({ status, size = 'sm' }) {
  const s = status?.toLowerCase() ?? 'pending'
  const sizeClasses = size === 'lg'
    ? 'px-3 py-1 text-xs'
    : 'px-2 py-0.5 text-[10px]'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wider
                      transition-all duration-300 ${sizeClasses} ${STYLES[s] ?? STYLES.pending}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLOR[s] ?? DOT_COLOR.pending}`} />
      {LABELS[s] ?? status}
    </span>
  )
}
