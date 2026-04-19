import { Brain, Lightbulb } from 'lucide-react'

export default function ReasoningView({ steps = [] }) {
  if (!steps.length) return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <Brain size={28} className="mx-auto mb-2 text-gray-700" />
        <p className="text-gray-600 text-xs">No reasoning steps recorded.</p>
      </div>
    </div>
  )

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-[18px] top-4 bottom-4 w-px bg-gradient-to-b from-indigo-500/50 via-purple-500/30 to-transparent" />

      <div className="space-y-4">
        {steps.map((step, i) => (
          <div
            key={step.step_number}
            className="flex gap-4 relative animate-fadeInUp"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            {/* Step number bubble */}
            <div className="relative z-10 flex-shrink-0 w-9 h-9 rounded-full
                            bg-gradient-to-br from-indigo-500/20 to-purple-500/20
                            border border-indigo-500/30 flex items-center justify-center
                            text-xs font-bold text-indigo-400 shadow-lg shadow-indigo-500/10">
              {step.step_number}
            </div>

            {/* Thought bubble */}
            <div className="flex-1 glass rounded-xl p-4 group hover:bg-white/[0.04] transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={12} className="text-indigo-400" />
                <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-[0.15em]">
                  Thought {step.step_number}
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">
                {step.thought}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
