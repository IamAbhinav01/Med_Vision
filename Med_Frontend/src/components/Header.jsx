import { Brain, Cpu, Zap } from 'lucide-react'

export default function Header() {
  return (
    <header className="site-header">
      {/* Logo chip */}
      <div className="header-chip">
        <div className="header-chip-dot" />
        <span className="header-chip-text">
          Medical AI Platform
        </span>
      </div>

      {/* Title */}
      <h1 className="header-title text-gradient">
        MedVision AI
      </h1>
      <p className="header-subtitle">
        Scan Intelligence Engine
      </p>
      <p className="header-desc">
        Upload a medical scan and watch the AI analyze it step by step.
      </p>

      {/* Feature pills */}
      <div className="header-pills">
        {[
          { icon: Brain, label: 'Modality Detection' },
          { icon: Cpu,   label: 'Body Part Analysis' },
          { icon: Zap,   label: 'Instant Routing' },
        ].map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="header-pill shadow-sm"
          >
            <Icon size={12} className="text-blue-500" />
            {label}
          </span>
        ))}
      </div>
    </header>
  )
}
