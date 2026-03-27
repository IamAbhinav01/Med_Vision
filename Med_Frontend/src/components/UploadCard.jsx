import { useCallback, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, ImageIcon, FileImage } from 'lucide-react'

export default function UploadCard({ onUpload, disabled }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback(
    (file) => {
      if (!file || disabled) return
      if (!file.type.startsWith('image/')) {
        alert('Please upload a valid image file (JPG, PNG, JPEG).')
        return
      }
      onUpload(file)
    },
    [onUpload, disabled],
  )

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="gradient-border"
    >
      <div className="glass-card p-8">
        {/* Section label */}
        <div className="card-section-label">
          <div className="card-label-icon">
            <FileImage size={15} className="text-blue-600" />
          </div>
          <span className="card-label-text">Upload Medical Scan</span>
        </div>

        {/* Drop zone */}
        <div
          id="drop-zone"
          className={`drop-zone rounded-xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer select-none ${dragOver ? 'drag-over' : ''} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <motion.div
            animate={dragOver ? { scale: 1.12 } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-sm"
          >
            <Upload size={28} className="text-blue-600" />
          </motion.div>

          <div style={{ textAlign: 'center' }}>
            <p className="font-semibold text-slate-700 text-base">
              {dragOver ? 'Drop to analyze' : 'Drag & drop your scan'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              or{' '}
              <span className="text-blue-600 font-medium hover:underline">
                click to browse
              </span>
            </p>
          </div>

          {/* Format tags */}
          <div className="flex gap-2">
            {['JPG', 'PNG', 'JPEG'].map((fmt) => (
              <span
                key={fmt}
                className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 text-slate-500 rounded-full shadow-sm"
              >
                {fmt}
              </span>
            ))}
          </div>
        </div>

        <input
          ref={inputRef}
          id="file-input"
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        <p className="text-xs text-slate-400 mt-4 flex items-center justify-center gap-1" style={{ textAlign: 'center' }}>
          <ImageIcon size={11} />
          Supports X-ray, MRI, CT, PET, Ultrasound scans
        </p>
      </div>
    </motion.div>
  )
}
