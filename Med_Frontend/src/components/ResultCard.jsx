import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Scan, Brain, Activity, Route, CheckCircle2, ArrowRight,
  FileText, Eye, HelpCircle, ChevronDown, ChevronUp,
} from 'lucide-react'

const SEVERITY_PALETTE = {
  HIGH    : { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', glow: 'rgba(220,38,38,0.12)' },
  MODERATE: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', glow: 'rgba(217,119,6,0.10)' },
  LOW     : { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0', glow: 'rgba(22,163,74,0.10)' },
}

const MODALITY_LABELS = {
  chest_xray: 'Chest X-Ray', brain_mri: 'Brain MRI',
  ct_scan: 'CT Scan', ultrasound: 'Ultrasound', pet: 'PET Scan',
}

// ── Mini probability bar list ─────────────────────────────────────────────────
function FindingsList({ findings, predicted }) {
  const entries = Object.entries(findings).sort((a, b) => b[1] - a[1])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      {entries.map(([label, pct]) => {
        const isTop = label === predicted
        return (
          <div key={label} className="prob-row" style={isTop ? { background: '#F0FDF4' } : {}}>
            <span
              className="prob-label"
              style={{ color: isTop ? '#059669' : '#475569', fontWeight: isTop ? 700 : 500 }}
            >
              {label}
            </span>
            <div className="prob-track">
              <motion.div
                className="prob-fill"
                style={{ background: isTop ? '#10B981' : '#CBD5E1' }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
              />
            </div>
            <span className="prob-pct" style={{ color: isTop ? '#059669' : '#64748B' }}>
              {pct}%
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── GradCAM heatmap panel ─────────────────────────────────────────────────────
function HeatmapPanel({ heatmapB64, originalB64, diagnosis }) {
  const [showOverlay, setShowOverlay] = useState(true)
  if (!heatmapB64) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="heatmap-panel"
    >
      <div className="heatmap-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Eye size={14} className="text-orange-500" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
            GradCAM Attention
          </span>
          <span className="heatmap-badge">AI Focus Region</span>
        </div>
        <button
          onClick={() => setShowOverlay((v) => !v)}
          className="heatmap-toggle-btn"
          id="heatmap-toggle-btn"
        >
          {showOverlay ? 'Show Original' : 'Show Heatmap'}
        </button>
      </div>
      <div className="heatmap-img-wrap">
        <AnimatePresence mode="wait">
          <motion.img
            key={showOverlay ? 'overlay' : 'original'}
            src={showOverlay ? heatmapB64 : originalB64}
            alt={showOverlay ? `GradCAM heatmap for ${diagnosis}` : 'Original scan'}
            className="heatmap-img"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        </AnimatePresence>
        <div className="heatmap-caption">
          {showOverlay
            ? '🔴 Red = High AI attention  🔵 Blue = Low attention'
            : 'Original scan image (224 × 224)'}
        </div>
      </div>
    </motion.div>
  )
}

// ── AI Report panel ───────────────────────────────────────────────────────────
function ReportPanel({ report, summary }) {
  const [expanded, setExpanded] = useState(false)
  if (!report) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65 }}
      className="report-panel"
    >
      <div className="report-header">
        <FileText size={14} className="text-blue-500" />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
          AI Radiology Report
        </span>
      </div>

      {summary && (
        <div className="report-summary">
          <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>{summary}</p>
        </div>
      )}

      <button
        id="report-expand-btn"
        onClick={() => setExpanded((v) => !v)}
        className="report-expand-btn"
      >
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {expanded ? 'Collapse full report' : 'Read full report'}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <pre className="report-text">{report}</pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main ResultCard ───────────────────────────────────────────────────────────
export default function ResultCard({ result }) {
  if (!result) return null

  const modalityLabel = MODALITY_LABELS[result.stage1_modality] || result.stage1_modality?.replace('_', ' ')
  const bodyPartLabel = result.stage2_body_part
    ? result.stage2_body_part.charAt(0).toUpperCase() + result.stage2_body_part.slice(1)
    : 'Unknown'
  const routingKey  = result.routing_key?.toUpperCase().replace('_', ' + ')
  const sevPalette  = SEVERITY_PALETTE[result.severity] || {}
  const hasStage3   = result.stage3_supported !== false && result.diagnosis

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      {/* Glow */}
      <div className="result-glow" />

      <div className="glass-card border border-blue-100 overflow-hidden">
        <div className="result-top-bar" />

        <div className="p-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* ── Route header ── */}
          <div>
            <div className="result-header">
              <div className="result-header-left">
                <div className="result-icon">
                  <Route size={16} className="text-white" />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Pipeline Result
                </p>
              </div>
              <span className="result-badge">
                <CheckCircle2 size={12} />
                {result.ready_for_stage3 ? 'Stage 3 Ready' : 'Low Confidence'}
              </span>
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5, type: 'spring', stiffness: 200 }}
              className="result-key-box"
            >
              <p className="result-key-text">{routingKey}</p>
              <p className="result-key-sub">{result.routing_key}</p>
            </motion.div>

            {/* Stages 1 + 2 confidence grid */}
            <div className="result-grid">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                className="result-stat bg-blue-50/70 border border-blue-100"
              >
                <div className="result-stat-header">
                  <Scan size={14} className="text-blue-500" />
                  <span className="result-stat-label text-blue-500">Scan Type</span>
                </div>
                <p className="result-stat-value">{modalityLabel}</p>
                <div className="conf-bar-track bg-blue-100">
                  <motion.div
                    className="conf-bar-fill bg-gradient-to-r from-blue-500 to-blue-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${result.stage1_confidence}%` }}
                    transition={{ delay: 0.5, duration: 1.0, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-xs text-blue-500 font-bold mt-1">{result.stage1_confidence}%</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42, duration: 0.4 }}
                className="result-stat bg-violet-50/70 border border-violet-100"
              >
                <div className="result-stat-header">
                  <Brain size={14} className="text-violet-500" />
                  <span className="result-stat-label text-violet-500">Body Part</span>
                </div>
                <p className="result-stat-value">{bodyPartLabel}</p>
                <div className="conf-bar-track bg-violet-100">
                  <motion.div
                    className="conf-bar-fill bg-gradient-to-r from-violet-500 to-violet-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${result.stage2_confidence}%` }}
                    transition={{ delay: 0.55, duration: 1.0, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-xs text-violet-500 font-bold mt-1">{result.stage2_confidence}%</p>
              </motion.div>
            </div>
          </div>

          {/* ── Stage 3: Diagnosis card ── */}
          {hasStage3 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <div className="diagnosis-divider">
                <div className="timeline-divider-line" style={{ background: '#E2E8F0' }} />
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  <Activity size={11} /> Stage 3 Diagnosis
                </span>
                <div className="timeline-divider-line" style={{ background: '#E2E8F0' }} />
              </div>

              {/* Diagnosis hero */}
              <div
                className="diagnosis-hero"
                style={{
                  background: sevPalette.glow
                    ? `linear-gradient(135deg, #F0FDF4, ${sevPalette.glow})`
                    : '#F8FAFC',
                  border: `1.5px solid ${sevPalette.border || '#E2E8F0'}`,
                }}
              >
                <div className="diagnosis-hero-top">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Primary Diagnosis
                    </p>
                    <p className="diagnosis-title">{result.diagnosis}</p>
                  </div>
                  <span
                    className="severity-chip"
                    style={{
                      background: sevPalette.bg,
                      color     : sevPalette.text,
                      border    : `1px solid ${sevPalette.border}`,
                    }}
                  >
                    {result.severity}
                  </span>
                </div>

                {/* Confidence bar */}
                <div className="conf-bar-wrap" style={{ marginTop: '1rem' }}>
                  <div className="conf-bar-header">
                    <span>Model Confidence</span>
                    <span style={{ fontWeight: 700, color: sevPalette.text || '#059669' }}>
                      {result.confidence}%
                    </span>
                  </div>
                  <div className="conf-bar-track" style={{ height: 10 }}>
                    <motion.div
                      className="conf-bar-fill"
                      style={{ background: `linear-gradient(90deg, #10B981, #059669)` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${result.confidence}%` }}
                      transition={{ delay: 0.7, duration: 1.2, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>

              {/* All findings */}
              {result.all_findings && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                    All Findings
                  </p>
                  <FindingsList findings={result.all_findings} predicted={result.diagnosis} />
                </div>
              )}
            </motion.div>
          )}

          {/* ── GradCAM ── */}
          {result.heatmap_b64 && (
            <HeatmapPanel
              heatmapB64={result.heatmap_b64}
              originalB64={result.original_b64}
              diagnosis={result.diagnosis}
            />
          )}

          {/* ── AI Report ── */}
          {result.report && (
            <ReportPanel report={result.report} summary={result.report_summary} />
          )}

          {/* ── Route footer ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="result-route-footer"
          >
            <span className="font-semibold text-slate-600">{modalityLabel}</span>
            <ArrowRight size={14} className="text-slate-300" />
            <span className="font-semibold text-slate-600">{bodyPartLabel}</span>
            {hasStage3 && (
              <>
                <ArrowRight size={14} className="text-slate-300" />
                <span className="font-semibold text-emerald-600">{result.diagnosis}</span>
              </>
            )}
            {!hasStage3 && (
              <>
                <ArrowRight size={14} className="text-slate-300" />
                <span className="route-stage-chip">Stage 3</span>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
