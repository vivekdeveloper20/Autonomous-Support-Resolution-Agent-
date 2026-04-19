import { useEffect, useState, useRef } from 'react'

export default function StatCard({ label, value, icon: Icon, gradient, sub, glowClass, delay = 0 }) {
  const [displayValue, setDisplayValue] = useState(0)
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay * 1000)
    return () => clearTimeout(timer)
  }, [delay])

  // Animated counter
  useEffect(() => {
    if (value == null || !visible) return
    const numVal = typeof value === 'number' ? value : parseInt(value, 10)
    if (isNaN(numVal)) { setDisplayValue(value); return }

    let start = 0
    const duration = 800
    const startTime = performance.now()

    function tick(now) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(eased * numVal))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value, visible])

  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-2xl p-5 glass transition-all duration-500
                  hover:scale-[1.02] hover:${glowClass || 'glow-indigo'}
                  ${visible ? 'animate-fadeInUp' : 'opacity-0'}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Gradient background accent */}
      <div className={`absolute inset-0 opacity-[0.07] ${gradient} transition-opacity duration-500
                        group-hover:opacity-[0.15]`} />

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-shimmer" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-400">{label}</span>
          {Icon && (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${gradient}
                            shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
              <Icon size={18} className="text-white" />
            </div>
          )}
        </div>
        <p className="text-4xl font-extrabold text-white tracking-tight animate-countUp">
          {displayValue ?? '—'}
        </p>
        {sub && (
          <p className="text-[11px] text-gray-500 mt-2 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-current" />
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}
