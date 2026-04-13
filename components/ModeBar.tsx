'use client'
import { useState } from 'react'

export function ModeBar({ currentMode }: { currentMode: string }) {
  const [loading, setLoading] = useState(false)

  const setMode = async (mode: string) => {
    setLoading(true)
    await fetch('/api/control', {
      method: 'POST',
      body: JSON.stringify({ action: 'setMode', mode })
    })
    setLoading(false)
  }

  return (
    <div className="flex gap-4 p-4 border-b border-forest/30 bg-dark-card/50">
      <span className="text-sm font-cinzel font-bold text-cream/50 self-center mr-4 uppercase tracking-wider">Projector Control</span>
      
      {['idle', 'worship', 'sermon'].map(m => (
        <button
          key={m}
          onClick={() => setMode(m)}
          disabled={loading}
          className={`px-6 py-2 rounded-lg font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-gold/50 ${
            currentMode === m 
            ? 'forest-gradient text-gold-light border border-gold/40 shadow-[0_0_15px_rgba(74,124,89,0.5)]' 
            : 'bg-dark border border-forest/30 text-cream/70 hover:bg-forest/20 hover:text-cream'
          }`}
        >
          {m.charAt(0).toUpperCase() + m.slice(1)} Mode
        </button>
      ))}

      <a 
        href="/display" 
        target="_blank" 
        className="ml-auto flex items-center px-4 py-2 bg-gold/10 text-gold border border-gold/30 rounded-lg hover:bg-gold/20 text-sm font-medium transition-colors"
      >
        Open Projector View
      </a>
    </div>
  )
}
