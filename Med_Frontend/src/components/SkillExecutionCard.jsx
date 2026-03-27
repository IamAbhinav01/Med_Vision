import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Scan, CheckCircle2, AlertCircle } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import ProbabilityChart from './ProbabilityChart'

const ICONS = {
  scan_detector_skill: Scan,
  body_part_detecting_skill: Brain,
}

const COLORS = {
  scan_detector_skill: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', badge: 'bg-blue-100 text-blue-700' },
  body_part_detecting_skill: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100', badge: 'bg-violet-100 text-violet-700' },
}

export default function SkillExecutionCard({ skill, status, result, index }) {
  const Icon = ICONS[skill] || Brain
  const colors = COLORS[skill] || COLORS['scan_detector_skill']

  const loadingText = skill === 'scan_detector_skill'
    ? 'Detecting scan modality…'
    : 'Analyzing anatomical region…'

  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.05 * index }}
      className="skill-row"
    >
      {/* Timeline dot */}
      <div className="skill-icon-col">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
          className={`skill-icon-wrap ${colors.bg} border ${colors.border}`}
        >
          <Icon size={18} className={colors.text} />
          {status === 'loading' && (
            <span className="absolute -top-1 -right-1">
              <span className="relative flex h-3 w-3">
                <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-blue-400" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
              </span>
            </span>
          )}
          {status === 'done' && (
            <CheckCircle2
              size={14}
              className="absolute -top-1.5 -right-1.5 text-emerald-500 bg-white rounded-full"
            />
          )}
        </motion.div>
      </div>

      {/* Card body */}
      <div className="skill-body">
        {/* Skill header */}
        <div className="skill-badge-row">
          <span className={`skill-badge ${colors.badge}`}>
            Skill Executed
          </span>
          <code className="skill-mono">{skill}</code>
        </div>

        <div className="glass-card p-5">
          <AnimatePresence mode="wait">
            {status === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="loading-row"
              >
                <LoadingSpinner size={20} color={skill === 'body_part_detecting_skill' ? '#7C3AED' : '#2563EB'} />
                <p className="text-sm text-slate-500 font-medium">{loadingText}</p>
                <div className="loading-dots">
                  {[0, 0.15, 0.3].map((d) => (
                    <motion.span
                      key={d}
                      className="loading-dot"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: d }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {status === 'done' && result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Stage 1 result */}
                {skill === 'scan_detector_skill' && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                      Scan Type Detected
                    </p>
                    <div className="flex items-end gap-4">
                      <div>
                        <p className="text-2xl font-extrabold text-slate-800 capitalize leading-none">
                          {result.stage1_modality?.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Confidence: <span className="font-semibold text-slate-600">{result.stage1_confidence}%</span>
                        </p>
                      </div>
                    </div>
                    {/* Confidence bar */}
                    <div className="conf-bar-wrap">
                      <div className="conf-bar-header">
                        <span>Confidence</span>
                        <span className="font-semibold text-blue-600">{result.stage1_confidence}%</span>
                      </div>
                      <div className="conf-bar-track">
                        <motion.div
                          className="conf-bar-fill bg-gradient-to-r from-blue-500 to-blue-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${result.stage1_confidence}%` }}
                          transition={{ duration: 1.0, ease: 'easeOut', delay: 0.2 }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Stage 2 result */}
                {skill === 'body_part_detecting_skill' && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                      Body Part Identified
                    </p>
                    <div className="flex items-end gap-4 mb-4">
                      <div>
                        <p className="text-2xl font-extrabold text-slate-800 capitalize leading-none">
                          {result.stage2_body_part}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Confidence: <span className="font-semibold text-slate-600">{result.stage2_confidence}%</span>
                        </p>
                      </div>
                    </div>
                    {/* Confidence bar */}
                    <div className="mb-5">
                      <div className="conf-bar-header">
                        <span>Confidence</span>
                        <span className="font-semibold text-violet-600">{result.stage2_confidence}%</span>
                      </div>
                      <div className="conf-bar-track">
                        <motion.div
                          className="conf-bar-fill bg-gradient-to-r from-violet-500 to-violet-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${result.stage2_confidence}%` }}
                          transition={{ duration: 1.0, ease: 'easeOut', delay: 0.2 }}
                        />
                      </div>
                    </div>
                    {/* Probability chart */}
                    {result.stage2_all_probs && (
                      <ProbabilityChart probs={result.stage2_all_probs} predicted={result.stage2_body_part} />
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
