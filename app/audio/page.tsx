'use client'
import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Disc, Play, Download, Monitor, Maximize } from 'lucide-react'

type ProjectorState = {
  mode: string
  scripture: { reference: string; text: string } | null
  lyricLines: string[]
  lyricSection: string
  backgroundUrl: string | null
}

export default function AudioPage() {
  const [recordings, setRecordings] = useState<any[]>([])
  const [projState, setProjState] = useState<ProjectorState>({
    mode: 'idle', scripture: null, lyricLines: [], lyricSection: '', backgroundUrl: null
  })
  const [screens, setScreens] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/recordings')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRecordings(data) })
      .catch(e => console.error(e))
  }, [])

  // Poll projector state
  useEffect(() => {
    const int = setInterval(async () => {
      try {
        const r = await fetch('/api/control')
        const d = await r.json()
        setProjState(d)
      } catch (e) {}
    }, 1500)
    return () => clearInterval(int)
  }, [])

  const pushMode = async (mode: string) => {
    await fetch('/api/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setMode', mode })
    })
  }

  const detectDisplays = async () => {
    if (!('getScreenDetails' in window)) {
      return alert('Window Management API not supported. Use Chrome 100+ on desktop.')
    }
    try {
      const details = await (window as any).getScreenDetails()
      setScreens(details.screens)
      details.addEventListener('screenschange', () => setScreens([...details.screens]))
    } catch (e) {
      alert('Permission denied to access connected displays.')
    }
  }

  const goFullscreenOn = async (screen: any) => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      await (document.documentElement as any).requestFullscreen({ screen } as any)
    } catch (err) {
      alert('Could not go fullscreen on selected display.')
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-10 relative">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <h1 className="text-4xl font-cinzel font-black tracking-tighter text-cream uppercase">Audio Archive</h1>
          </div>

          {/* Recordings */}
          <div className="space-y-4 mb-10">
            {recordings.length === 0 && (
              <div className="glass-card p-10 rounded-2xl border border-forest/20 text-center text-cream/30 font-bold">
                No recordings found in the /exports directory.
              </div>
            )}
            {recordings.map(rec => (
              <div key={rec.id} className="glass-card p-5 rounded-2xl border border-forest/20 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-gold/30 transition-all group">
                <div className="flex flex-col gap-3 w-full">
                  <div className="flex items-center gap-4 flex-1 w-full">
                    <div className="w-10 h-10 rounded-full bg-forest/20 flex items-center justify-center shrink-0 group-hover:bg-gold/20 group-hover:text-gold transition-colors text-gold">
                      <Disc className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-cream">{rec.title}</h3>
                      <div className="flex gap-3 text-xs text-cream/50 mt-1 uppercase tracking-wider">
                        <span>{rec.date}</span>
                        <span>&bull;</span>
                        <span className="text-gold-light">{rec.type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full flex items-center gap-4 bg-dark/30 rounded-lg p-2 border border-forest/10">
                    <audio controls className="w-full h-10" src={`/api/recordings/play?file=${rec.filename}`}>
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto flex-col">
                  <a
                    href={`/api/recordings/play?file=${rec.filename}&download=1`}
                    download={rec.filename}
                    className="px-4 flex items-center justify-center gap-2 py-2 bg-forest/20 border border-forest/30 rounded-lg text-cream/80 hover:bg-forest/40 hover:text-cream transition-colors font-bold text-xs"
                  >
                    <Download className="w-4 h-4" /> Download
                  </a>
                  <button
                    onClick={async () => {
                      if (confirm(`Permanently delete ${rec.title}?`)) {
                        await fetch('/api/recordings/delete', { method: 'POST', body: JSON.stringify({ filename: rec.filename }), headers: { 'Content-Type': 'application/json' } })
                        window.location.reload()
                      }
                    }}
                    className="px-4 flex items-center justify-center gap-2 py-2 bg-dark/50 border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors font-bold text-xs rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ─── Projector Section ─── */}
          <div className="border-t border-white/5 pt-10">
            <div className="mb-6 flex items-center gap-4">
              <Monitor className="w-5 h-5 text-gold" />
              <h2 className="text-2xl font-cinzel font-black tracking-tighter text-cream uppercase">Live Projection</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Projector Preview */}
              <div className="glass-card rounded-2xl p-6 border border-white/5">
                <h3 className="font-cinzel text-xs font-black uppercase tracking-[0.2em] text-cream/30 mb-4">Preview</h3>
                <div className="w-full bg-black rounded-2xl min-h-[200px] flex flex-col items-center justify-center p-8 border border-white/5 shadow-2xl relative overflow-hidden">
                  {projState.backgroundUrl && (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${projState.backgroundUrl})` }}
                    >
                      <div className="absolute inset-0 bg-black/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-forest-700/30 to-black pointer-events-none" />

                  {projState.mode === 'worship' && projState.lyricLines.length > 0 && (
                    <div className="text-center z-10 text-cream font-black uppercase tracking-tight space-y-2">
                      {projState.lyricSection && (
                        <div className="text-[10px] bg-gold text-dark-950 px-3 py-1 rounded-full mb-3 font-black uppercase tracking-widest inline-block">{projState.lyricSection}</div>
                      )}
                      {projState.lyricLines.map((l, i) => <p key={i} className="text-xl">{l}</p>)}
                    </div>
                  )}
                  {projState.mode === 'scripture' && projState.scripture && (
                    <div className="text-center z-10 space-y-3">
                      <p className="text-lg font-bold text-white leading-relaxed">{projState.scripture.text}</p>
                      <p className="font-cinzel font-black text-gold tracking-widest uppercase text-sm">{projState.scripture.reference}</p>
                    </div>
                  )}
                  {(projState.mode === 'idle' || (!projState.lyricLines.length && !projState.scripture)) && (
                    <span className="text-[10px] text-cream/20 font-black uppercase tracking-[0.2em] z-10">System Idle</span>
                  )}
                </div>

                {/* Mode Switcher */}
                <div className="flex gap-2 mt-4">
                  {['idle', 'worship', 'sermon'].map(m => (
                    <button
                      key={m}
                      onClick={() => pushMode(m)}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
                        projState.mode === m
                          ? 'bg-forest text-cream border-forest glow-forest'
                          : 'bg-transparent border-white/10 text-cream/40 hover:text-cream hover:border-white/20'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Output Switching */}
              <div className="glass-card rounded-2xl p-6 border border-white/5">
                <h3 className="font-cinzel text-xs font-black uppercase tracking-[0.2em] text-cream/30 mb-6">Output Displays</h3>
                <p className="text-xs text-cream/50 mb-6 leading-relaxed">
                  Detect connected displays (HDMI, VGA, USB-C) and project directly from this device. Requires Chrome on desktop.
                </p>

                <button
                  onClick={detectDisplays}
                  className="w-full py-3 bg-forest/20 hover:bg-forest/40 border border-forest/30 text-cream font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 mb-4"
                >
                  <Monitor className="w-4 h-4 text-gold" />
                  Detect Connected Displays
                </button>

                {screens.length > 0 ? (
                  <div className="space-y-2">
                    {screens.map((screen, i) => (
                      <button
                        key={screen.id || i}
                        onClick={() => goFullscreenOn(screen)}
                        className="w-full py-3 px-4 bg-cream/5 hover:bg-cream/10 border border-cream/20 hover:border-cream/40 text-cream rounded-xl text-xs font-bold transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Monitor className="w-4 h-4 text-gold" />
                          <div className="text-left">
                            <p className="font-black">{screen.label || `Display ${i + 1}`}</p>
                            <p className="text-cream/40">{screen.width} × {screen.height}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-cream/60">
                          <Maximize className="w-3.5 h-3.5" />
                          <span>Fullscreen</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-cream/20 text-xs py-6 border border-white/5 rounded-xl">
                    No displays detected yet.<br/>Click the button above to scan.
                  </div>
                )}
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
