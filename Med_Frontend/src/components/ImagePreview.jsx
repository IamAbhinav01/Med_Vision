import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, CheckCircle2 } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'

export default function ImagePreview({ file, previewUrl, loading, onReset }) {
  return (
    <AnimatePresence>
      {previewUrl && (
        <motion.div
          key="preview"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="glass-card p-5 relative"
        >
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {loading ? 'Analyzing…' : 'Scan Loaded'}
              </span>
            </div>
            {!loading && (
              <button
                id="reset-btn"
                onClick={onReset}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Image */}
          <div className="relative rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
            <img
              src={previewUrl}
              alt="Uploaded medical scan preview"
              className="w-full max-h-64 object-contain"
            />
            {/* Scanning overlay */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm"
                >
                  <LoadingSpinner size={36} color="#60A5FA" />
                  <p className="text-white text-sm font-medium mt-3">Running AI pipeline…</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* File info */}
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span className="truncate max-w-[200px]">{file?.name}</span>
            {!loading && (
              <span className="flex items-center gap-1 text-emerald-500 font-medium">
                <CheckCircle2 size={12} /> Ready
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
