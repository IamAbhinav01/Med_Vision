import { motion } from 'framer-motion'
import { User, FileText, Cpu } from 'lucide-react'

/**
 * Optional patient metadata collected before analysis.
 * Props:
 *   onPatientName(name: string)
 *   onSymptomText(text: string)
 *   onRunNlp(flag: boolean)
 *   runNlp: boolean  (controlled)
 */
export default function PatientForm({ onPatientName, onSymptomText, onRunNlp, runNlp }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card p-5"
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <div className="card-label-icon">
          <User size={14} className="text-blue-500" />
        </div>
        <span className="card-label-text">Patient Information</span>
        <span style={{
          marginLeft: 'auto', fontSize: '0.68rem', fontWeight: 600,
          color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          Optional
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Patient name */}
        <div>
          <label className="form-label" htmlFor="patient-name-input">Patient Name</label>
          <input
            id="patient-name-input"
            type="text"
            placeholder="e.g. John Doe"
            className="form-input"
            onChange={(e) => onPatientName(e.target.value || 'Anonymous')}
          />
        </div>

        {/* Symptoms */}
        <div>
          <label className="form-label" htmlFor="symptoms-input">
            <FileText size={11} style={{ display: 'inline', marginRight: 4 }} />
            Symptoms / Clinical Notes
          </label>
          <textarea
            id="symptoms-input"
            placeholder="e.g. persistent cough, fever, shortness of breath…"
            rows={2}
            className="form-input form-textarea"
            onChange={(e) => onSymptomText(e.target.value)}
          />
        </div>

        {/* NLP toggle */}
        <div
          className="nlp-toggle-row"
          onClick={() => onRunNlp(!runNlp)}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Cpu size={13} className="text-violet-500" />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                Generate AI Report
              </span>
              <span className="nlp-badge">NLP</span>
            </div>
            <p style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '0.2rem' }}>
              BioGPT report + BART summary + BioBERT Q&A (adds ~30 s on CPU)
            </p>
          </div>
          <div className={`toggle-switch ${runNlp ? 'toggle-on' : ''}`}>
            <div className="toggle-thumb" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
