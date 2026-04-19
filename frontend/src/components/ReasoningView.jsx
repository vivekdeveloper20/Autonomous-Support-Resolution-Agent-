import { Brain } from 'lucide-react'

export default function ReasoningView({ steps = [] }) {
  if (!steps.length) return (
    <div className="text-gray-500 text-sm italic">No reasoning steps recorded.</div>
  )

  return (
    <div className="space-y-3">
      {steps.map((step) => (
        <div key={step.step_number} className="flex gap-3">
          {/* Step number bubble */}
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/40
                          flex items-center justify-center text-xs font-bold text-indigo-400">
            {step.step_number}
          </div>

          {/* Thought bubble */}
          <div className="flex-1 bg-gray-800/60 border border-gray-700/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Brain size={12} className="text-indigo-400" />
              <span className="text-xs font-medium text-indigo-400 uppercase tracking-wide">Think</span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{step.thought}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
