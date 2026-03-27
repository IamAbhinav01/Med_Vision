import { motion } from 'framer-motion'
import { Scan, Brain, ArrowRight, Route, CheckCircle2, Share2 } from 'lucide-react'

const MODALITY_LABELS = {
  chest_xray: 'Chest X-Ray',
  brain_mri:  'Brain MRI',
  ct_scan:    'CT Scan',
  ultrasound: 'Ultrasound',
  pet:        'PET Scan',
}

export default function ResultCard({ result }) {
  if (!result) return null

  const modalityLabel = MODALITY_LABELS[result.stage1_modality] || result.stage1_modality
  const bodyPartLabel = result.stage2_body_part
    ? result.stage2_body_part.charAt(0).toUpperCase() + result.stage2_body_part.slice(1)
    : 'Unknown'
  const routingKey = result.routing_key?.toUpperCase().replace('_', ' + ')

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      {/* Glow backdrop */}
      <div className="result-glow" />

      <div className="glass-card border border-blue-100 overflow-hidden">
        {/* Top gradient bar */}
        <div className="result-top-bar" />

        <div className="p-6">
          {/* Header */}
          <div className="result-header">
            <div className="result-header-left">
              <div className="result-icon">
                <Route size={16} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Final Routing Key
                </p>
              </div>
            </div>
            <span className="result-badge">
              <CheckCircle2 size={12} />
              {result.ready_for_stage3 ? 'Ready for Stage 3' : 'Low Confidence'}
            </span>
          </div>

          {/* Routing key pill */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.5, type: 'spring', stiffness: 200 }}
            className="result-key-box"
          >
            <p className="result-key-text">
              {routingKey}
            </p>
            <p className="result-key-sub">{result.routing_key}</p>
          </motion.div>

          {/* Stats grid */}
          <div className="result-grid">
            {/* Scan type */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="result-stat bg-blue-50/70 border border-blue-100"
            >
              <div className="result-stat-header">
                <Scan size={14} className="text-blue-500" />
                <span className="result-stat-label text-blue-500">
                  Scan Type
                </span>
              </div>
              <p className="result-stat-value">{modalityLabel}</p>
              <div className="mt-2">
                <div className="conf-bar-header">
                  <span>Confidence</span>
                  <span className="font-bold text-blue-600">{result.stage1_confidence}%</span>
                </div>
                <div className="conf-bar-track bg-blue-100">
                  <motion.div
                    className="conf-bar-fill bg-gradient-to-r from-blue-500 to-blue-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${result.stage1_confidence}%` }}
                    transition={{ delay: 0.5, duration: 1.0, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Body part */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.4 }}
              className="result-stat bg-violet-50/70 border border-violet-100"
            >
              <div className="result-stat-header">
                <Brain size={14} className="text-violet-500" />
                <span className="result-stat-label text-violet-500">
                  Body Part
                </span>
              </div>
              <p className="result-stat-value">{bodyPartLabel}</p>
              <div className="mt-2">
                <div className="conf-bar-header">
                  <span>Confidence</span>
                  <span className="font-bold text-violet-600">{result.stage2_confidence}%</span>
                </div>
                <div className="conf-bar-track bg-violet-100">
                  <motion.div
                    className="conf-bar-fill bg-gradient-to-r from-violet-500 to-violet-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${result.stage2_confidence}%` }}
                    transition={{ delay: 0.55, duration: 1.0, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer route arrow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="result-route-footer"
          >
            <span className="font-semibold text-slate-600">{modalityLabel}</span>
            <ArrowRight size={14} className="text-slate-300" />
            <span className="font-semibold text-slate-600">{bodyPartLabel}</span>
            <ArrowRight size={14} className="text-slate-300" />
            <span className="route-stage-chip">
              Stage 3
            </span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
