import { motion } from 'framer-motion'

const BODY_PART_COLORS = {
  chest:   { bar: 'from-blue-400 to-blue-500',    bg: 'bg-blue-50',   text: 'text-blue-700' },
  brain:   { bar: 'from-violet-400 to-violet-500', bg: 'bg-violet-50', text: 'text-violet-700' },
  abdomen: { bar: 'from-emerald-400 to-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  spine:   { bar: 'from-amber-400 to-amber-500',   bg: 'bg-amber-50',  text: 'text-amber-700' },
  knee:    { bar: 'from-orange-400 to-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' },
  breast:  { bar: 'from-pink-400 to-pink-500',     bg: 'bg-pink-50',   text: 'text-pink-700' },
  hand:    { bar: 'from-cyan-400 to-cyan-500',     bg: 'bg-cyan-50',   text: 'text-cyan-700' },
  eye:     { bar: 'from-indigo-400 to-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700' },
}

export default function ProbabilityChart({ probs, predicted }) {
  if (!probs) return null

  const sorted = Object.entries(probs).sort(([, a], [, b]) => b - a)
  const max = sorted[0]?.[1] || 100

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
        All Probabilities
      </p>
      {sorted.map(([part, pct], i) => {
        const colors = BODY_PART_COLORS[part] || BODY_PART_COLORS.chest
        const isPredicted = part === predicted
        return (
          <motion.div
            key={part}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.35, ease: 'easeOut' }}
            className={`prob-row ${isPredicted ? `${colors.bg}` : ''}`}
            style={isPredicted ? { border: '1px solid currentColor', opacity: 0.9 } : {}}
          >
            {/* Label */}
            <span
              className={`prob-label ${isPredicted ? colors.text : 'text-slate-500'}`}
            >
              {part}
            </span>
            
            {/* Bar track */}
            <div className="prob-track">
              <motion.div
                className={`prob-fill bg-gradient-to-r ${colors.bar}`}
                initial={{ width: 0 }}
                animate={{ width: `${(pct / max) * 100}%` }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.08 * i }}
              />
            </div>
            
            {/* Percentage */}
            <span
              className={`prob-pct ${isPredicted ? colors.text : 'text-slate-400'}`}
            >
              {pct}%
            </span>

            {isPredicted && (
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} border border-current/20`}>
                ✓
              </span>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
