import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Scan, CheckCircle2, Activity } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import ProbabilityChart from './ProbabilityChart'

const ICONS = {
  scan_detector_skill        : Scan,
  body_part_detecting_skill  : Brain,
  disease_classifier_skill   : Activity,
}

const COLORS = {
  scan_detector_skill: {
    bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100',
    badge: 'bg-blue-100 text-blue-700', bar: 'from-blue-500 to-blue-400',
    barLabel: 'text-blue-600',
  },
  body_part_detecting_skill: {
    bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100',
    badge: 'bg-violet-100 text-violet-700', bar: 'from-violet-500 to-violet-400',
    barLabel: 'text-violet-600',
  },
  disease_classifier_skill: {
    bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100',
    badge: 'bg-emerald-100 text-emerald-700', bar: 'from-emerald-500 to-emerald-400',
    barLabel: 'text-emerald-600',
  },
}

const LOADING_TEXT = {
  scan_detector_skill       : 'Detecting scan modality…',
  body_part_detecting_skill : 'Analyzing anatomical region…',
  disease_classifier_skill  : 'Classifying pathology…',
}

const SEVERITY_COLORS = {
  HIGH    : { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  MODERATE: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  LOW     : { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
}

export default function SkillExecutionCard({ skill, status, result, index }) {
  const Icon   = ICONS[skill]  || Brain
  const colors = COLORS[skill] || COLORS['scan_detector_skill']
  const loadingText = LOADING_TEXT[skill] || 'Processing…'

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
        <div className="skill-badge-row">
          <span className={`skill-badge ${colors.badge}`}>Skill Executed</span>
          <code className="skill-mono">{skill}</code>
        </div>

        <div className="glass-card p-5">
          <AnimatePresence mode="wait">
            {/* ── Loading state ── */}
            {status === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="loading-row"
              >
                <LoadingSpinner
                  size={20}
                  color={
                    skill === 'body_part_detecting_skill' ? '#7C3AED' :
                    skill === 'disease_classifier_skill'  ? '#059669' : '#2563EB'
                  }
                />
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

            {/* ── Done state ── */}
            {status === 'done' && result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* ── Stage 1: Scan type ── */}
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
                    <div className="conf-bar-wrap">
                      <div className="conf-bar-header">
                        <span>Confidence</span>
                        <span className={`font-semibold ${colors.barLabel}`}>{result.stage1_confidence}%</span>
                      </div>
                      <div className="conf-bar-track">
                        <motion.div
                          className={`conf-bar-fill bg-gradient-to-r ${colors.bar}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${result.stage1_confidence}%` }}
                          transition={{ duration: 1.0, ease: 'easeOut', delay: 0.2 }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Stage 2: Body part ── */}
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
                    <div className="mb-5">
                      <div className="conf-bar-header">
                        <span>Confidence</span>
                        <span className={`font-semibold ${colors.barLabel}`}>{result.stage2_confidence}%</span>
                      </div>
                      <div className="conf-bar-track">
                        <motion.div
                          className={`conf-bar-fill bg-gradient-to-r ${colors.bar}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${result.stage2_confidence}%` }}
                          transition={{ duration: 1.0, ease: 'easeOut', delay: 0.2 }}
                        />
                      </div>
                    </div>
                    {result.stage2_all_probs && (
                      <ProbabilityChart probs={result.stage2_all_probs} predicted={result.stage2_body_part} />
                    )}
                  </div>
                )}

                {/* ── Stage 3: Disease ── */}
                {skill === 'disease_classifier_skill' && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                      Disease Classification
                    </p>

                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xl font-extrabold text-slate-800 leading-tight">
                          {result.diagnosis}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Routing: <span className="font-mono font-semibold text-slate-600">{result.routing_key}</span>
                        </p>
                      </div>
                      {result.severity && (
                        <span
                          className="severity-chip"
                          style={{
                            background: SEVERITY_COLORS[result.severity]?.bg   || '#F1F5F9',
                            color     : SEVERITY_COLORS[result.severity]?.text || '#475569',
                            border    : `1px solid ${SEVERITY_COLORS[result.severity]?.border || '#E2E8F0'}`,
                          }}
                        >
                          {result.severity}
                        </span>
                      )}
                    </div>

                    {/* Confidence bar */}
                    <div className="conf-bar-wrap">
                      <div className="conf-bar-header">
                        <span>Confidence</span>
                        <span className={`font-semibold ${colors.barLabel}`}>{result.confidence}%</span>
                      </div>
                      <div className="conf-bar-track">
                        <motion.div
                          className={`conf-bar-fill bg-gradient-to-r ${colors.bar}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${result.confidence}%` }}
                          transition={{ duration: 1.0, ease: 'easeOut', delay: 0.2 }}
                        />
                      </div>
                    </div>

                    {/* All findings mini chart */}
                    {result.all_findings && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                          All Findings
                        </p>
                        <ProbabilityChart
                          probs={result.all_findings}
                          predicted={result.diagnosis}
                          accentColor="#059669"
                        />
                      </div>
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
