'use client'
import { useState } from 'react'

export function ModeBar({ currentMode }: { currentMode: string }) {
  const [loading, setLoading] = useState(false)
  const [backgroundUrl, setBackgroundUrl] = useState('')

  const setMode = async (mode: string) => {
    setLoading(true)
    await fetch('/api/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setMode', mode })
    })
    setLoading(false)
  }

  const setBackground = async (url: string) => {
    setLoading(true)
    setBackgroundUrl(url)
    await fetch('/api/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setBackground', url: url || null })
    })
    setLoading(false)
  }

  const presets = [
    'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519751138087-5bf79df62d5b?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1464802686167-b939a8910659?q=80&w=2050&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=1950&auto=format&fit=crop'
  ]

  return (
    <div className="flex flex-col border-b border-dark-800 bg-dark-900/50 backdrop-blur-md">
      <div className="flex gap-6 p-6 items-center">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">Projector Control</span>
          <div className="flex gap-3">
            {['idle', 'worship', 'sermon'].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                disabled={loading}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                  currentMode === m 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'bg-dark-800 border border-white/5 text-white/40 hover:bg-white/5 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="h-10 w-px bg-white/5 mx-4"></div>

        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">Background Theme</span>
          <div className="flex gap-3 items-center">
             <div className="flex gap-2">
                <button 
                  onClick={() => setBackground('')}
                  className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${!backgroundUrl ? 'border-blue-500 bg-blue-500/20 shadow-lg' : 'border-white/10 bg-dark-800 hover:border-white/30'}`}
                  title="Default Black"
                >
                  <div className="w-6 h-6 rounded-md bg-black border border-white/10"></div>
                </button>
                {presets.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setBackground(p)}
                    className={`w-10 h-10 rounded-lg border overflow-hidden transition-all ${backgroundUrl === p ? 'border-blue-500 scale-110 shadow-lg' : 'border-white/10 hover:border-white/30'}`}
                  >
                    <img src={p} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
             </div>
             <div className="h-6 w-px bg-white/5 mx-2"></div>
             <input 
                type="text" 
                placeholder="Paste Image URL..." 
                value={backgroundUrl}
                onChange={(e) => setBackground(e.target.value)}
                className="flex-1 max-w-xs bg-dark-950 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-white/10"
             />
          </div>
        </div>
        
        <a 
          href="/display" 
          target="_blank" 
          className="ml-auto flex items-center px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
        >
          Projector View
        </a>
      </div>
    </div>
  )
}
