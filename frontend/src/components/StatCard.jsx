export default function StatCard({ label, value, icon: Icon, gradient, sub }) {
  return (
    <div className={`relative overflow-hidden rounded-xl p-5 border border-gray-800 bg-gray-900`}>
      {/* gradient accent */}
      <div className={`absolute inset-0 opacity-10 ${gradient}`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">{label}</span>
          {Icon && (
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${gradient} bg-opacity-20`}>
              <Icon size={18} className="text-white" />
            </div>
          )}
        </div>
        <p className="text-3xl font-bold text-white">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      </div>
    </div>
  )
}
