import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, RotateCcw } from 'lucide-react'

import ParticleBackground  from './components/ParticleBackground'
import Header              from './components/Header'
import UploadCard          from './components/UploadCard'
import PatientForm         from './components/PatientForm'
import ImagePreview        from './components/ImagePreview'
import SkillExecutionCard  from './components/SkillExecutionCard'
import ResultCard          from './components/ResultCard'
import { useAnalysis }     from './hooks/useAnalysis'

import './index.css'

export default function App() {
  const [file,        setFile]        = useState(null)
  const [previewUrl,  setPreviewUrl]  = useState(null)

  // Patient metadata — collected from PatientForm before upload
  const [patientName, setPatientName] = useState('Anonymous')
  const [symptomText, setSymptomText] = useState('')
  const [runNlp,      setRunNlp]      = useState(false)

  const {
    phase,
    stage1Status, stage2Status, stage3Status,
    result, error,
    analyze, reset,
  } = useAnalysis()

  const isAnalyzing = phase === 'analyzing'
  const isIdle      = phase === 'idle'

  const handleUpload = (f) => {
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    analyze(f, patientName, symptomText, runNlp)
  }

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    reset()
  }

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [])

  const showSkill1 = stage1Status !== null
  const showSkill2 = stage2Status !== null
  const showSkill3 = stage3Status !== null && result?.stage3_supported !== false
  const showResult = phase === 'done' && result

  return (
    <>
      <ParticleBackground />

      <div className="page-wrapper">
        <div className="page-inner">

          {/* ── Header ───────────────────────────────────────────── */}
          <Header />

          {/* ── Main content ─────────────────────────────────────── */}
          <div className="content-stack">

            {/* Upload + patient form (hidden once analysis starts) */}
            <AnimatePresence>
              {isIdle && (
                <motion.div
                  key="upload-section"
                  exit={{ opacity: 0, y: -16, scale: 0.97 }}
                  transition={{ duration: 0.35 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                >
                  <UploadCard onUpload={handleUpload} disabled={false} />
                  <PatientForm
                    onPatientName={setPatientName}
                    onSymptomText={setSymptomText}
                    onRunNlp={setRunNlp}
                    runNlp={runNlp}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Image preview */}
            <ImagePreview
              file={file}
              previewUrl={previewUrl}
              loading={isAnalyzing}
              onReset={handleReset}
            />

            {/* ── AI Reasoning Timeline ─────────────────────────── */}
            <AnimatePresence>
              {(showSkill1 || showSkill2 || showSkill3) && (
                <motion.div
                  key="timeline"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="timeline-section"
                >
                  <div className="timeline-divider">
                    <div className="timeline-divider-line bg-gradient-to-r from-transparent to-slate-200" />
                    <span className="timeline-divider-label text-slate-400">AI Reasoning</span>
                    <div className="timeline-divider-line bg-gradient-to-l from-transparent to-slate-200" />
                  </div>

                  <div className="timeline-skills">
                    {/* Connector line */}
                    {showSkill1 && (showSkill2 || showSkill3) && (
                      <div className="timeline-vline" />
                    )}

                    <AnimatePresence>
                      {showSkill1 && (
                        <SkillExecutionCard
                          key="skill1"
                          skill="scan_detector_skill"
                          status={stage1Status}
                          result={result}
                          index={0}
                        />
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {showSkill2 && (
                        <SkillExecutionCard
                          key="skill2"
                          skill="body_part_detecting_skill"
                          status={stage2Status}
                          result={result}
                          index={1}
                        />
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {showSkill3 && (
                        <SkillExecutionCard
                          key="skill3"
                          skill="disease_classifier_skill"
                          status={stage3Status}
                          result={result}
                          index={2}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Final result card ─────────────────────────────── */}
            <AnimatePresence>
              {showResult && (
                <motion.div key="result-section">
                  <div className="timeline-divider">
                    <div className="timeline-divider-line bg-gradient-to-r from-transparent to-blue-200" />
                    <span className="timeline-divider-label text-blue-400">Final Result</span>
                    <div className="timeline-divider-line bg-gradient-to-l from-transparent to-blue-200" />
                  </div>
                  <ResultCard result={result} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Error ────────────────────────────────────────── */}
            <AnimatePresence>
              {phase === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="glass-card border border-red-100 p-5"
                >
                  <div className="error-card">
                    <div className="error-icon-wrap">
                      <AlertCircle size={16} className="text-red-500" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className="font-semibold text-red-700 text-sm">Analysis Failed</p>
                      <p className="text-xs text-red-400 mt-1">{error}</p>
                    </div>
                    <button
                      id="retry-btn"
                      onClick={handleReset}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <RotateCcw size={12} /> Try again
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Re-analyze ───────────────────────────────────── */}
            <AnimatePresence>
              {phase === 'done' && (
                <motion.div
                  key="reset-section"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ display: 'flex', justifyContent: 'center', paddingTop: '0.5rem' }}
                >
                  <button
                    id="analyze-another-btn"
                    onClick={handleReset}
                    className="btn-primary"
                  >
                    <RotateCcw size={14} />
                    Analyze Another Scan
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="page-footer">
            MedVision AI · EfficientNet-B4/B3 + GradCAM + BioGPT · For research use only
          </p>
        </div>
      </div>
    </>
  )
}
