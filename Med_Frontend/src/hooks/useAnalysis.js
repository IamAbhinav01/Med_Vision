import { useState, useCallback } from 'react'

/**
 * State machine for the full 3-stage analysis pipeline.
 *
 * Phases: idle → analyzing → done | error
 * Stages: stage1 | stage2 | stage3  each: null | 'loading' | 'done'
 */
export function useAnalysis() {
  const [phase,        setPhase]        = useState('idle')
  const [stage1Status, setStage1Status] = useState(null)
  const [stage2Status, setStage2Status] = useState(null)
  const [stage3Status, setStage3Status] = useState(null)
  const [result,       setResult]       = useState(null)
  const [error,        setError]        = useState(null)

  const analyze = useCallback(async (file, patientName = 'Anonymous', symptomText = '', runNlp = false) => {
    setPhase('analyzing')
    setStage1Status('loading')
    setStage2Status(null)
    setStage3Status(null)
    setResult(null)
    setError(null)

    const formData = new FormData()
    formData.append('image', file)
    formData.append('patient_name', patientName)
    formData.append('symptom_text', symptomText)
    formData.append('run_nlp', runNlp ? 'true' : 'false')

    try {
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload.detail || `HTTP ${res.status}`)
      }

      const data = await res.json()

      // ── Animated sequential reveal ─────────────────────────────────────
      await delay(600)
      setStage1Status('done')

      await delay(500)
      setStage2Status('loading')

      await delay(700)
      setStage2Status('done')

      // Only show Stage 3 card if the classifier ran
      if (data.stage3_supported !== false) {
        await delay(400)
        setStage3Status('loading')
        await delay(800)
        setStage3Status('done')
      }

      await delay(350)
      setResult(data)
      setPhase('done')
    } catch (err) {
      setStage1Status(null)
      setStage2Status(null)
      setStage3Status(null)
      setError(err.message || 'Unknown error')
      setPhase('error')
    }
  }, [])

  const reset = useCallback(() => {
    setPhase('idle')
    setStage1Status(null)
    setStage2Status(null)
    setStage3Status(null)
    setResult(null)
    setError(null)
  }, [])

  return {
    phase,
    stage1Status, stage2Status, stage3Status,
    result, error,
    analyze, reset,
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
