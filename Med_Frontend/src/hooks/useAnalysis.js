import { useState, useCallback } from 'react'

/**
 * State machine for the analysis pipeline.
 *
 * States:
 *   idle → uploading → stage1-loading → stage1-done → stage2-loading → stage2-done → done | error
 */
export function useAnalysis() {
  const [phase, setPhase] = useState('idle')      // 'idle' | 'analyzing' | 'done' | 'error'
  const [stage1Status, setStage1Status] = useState(null)  // null | 'loading' | 'done'
  const [stage2Status, setStage2Status] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const analyze = useCallback(async (file) => {
    setPhase('analyzing')
    setStage1Status('loading')
    setStage2Status(null)
    setResult(null)
    setError(null)

    const formData = new FormData()
    formData.append('image', file)

    try {
      const res = await fetch('/analyze-scan', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload.detail || `HTTP ${res.status}`)
      }

      const data = await res.json()

      // Simulate sequential reveal so the UI reasoning flow is visible.
      // Stage 1 arrives — show it.
      await delay(600)
      setStage1Status('done')

      // Brief pause before revealing Stage 2 loading state.
      await delay(500)
      setStage2Status('loading')

      // Show stage 2 result.
      await delay(700)
      setStage2Status('done')

      // Final result.
      await delay(400)
      setResult(data)
      setPhase('done')
    } catch (err) {
      setStage1Status(null)
      setStage2Status(null)
      setError(err.message || 'Unknown error')
      setPhase('error')
    }
  }, [])

  const reset = useCallback(() => {
    setPhase('idle')
    setStage1Status(null)
    setStage2Status(null)
    setResult(null)
    setError(null)
  }, [])

  return { phase, stage1Status, stage2Status, result, error, analyze, reset }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
