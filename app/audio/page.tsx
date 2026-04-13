'use client'
import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Disc, Play, Download, Settings2 } from 'lucide-react'

export default function AudioPage() {
  const [recordings, setRecordings] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/recordings')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setRecordings(data)
      })
      .catch(e => console.error(e))
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-10 relative">
          <header className="mb-10">
            <h1 className="text-3xl font-cinzel font-bold gold-text flex items-center gap-3">
              <Disc className="w-8 h-8 text-gold" /> Audio Archive
            </h1>
            <p className="text-cream/60 mt-2">Manage full service recordings and extracted highlight clips.</p>
          </header>

          <div className="glass-card rounded-2xl p-8 mb-8 border border-forest/30 flex justify-between items-center bg-dark/50">
            <div>
              <h2 className="font-cinzel text-lg font-bold text-cream">Export Settings</h2>
              <p className="text-sm text-cream/50 mt-1">Configure auto-export quality and highlight detection sensitivity.</p>
            </div>
            <button className="px-4 py-2 bg-dark border border-forest/30 rounded-lg text-cream/70 hover:text-cream hover:border-gold transition-colors flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Configure
            </button>
          </div>

          <div className="space-y-4">
            {recordings.length === 0 && (
               <div className="glass-card p-10 rounded-xl border border-forest/20 text-center text-cream/50">
                 No audio recordings found in the /exports directory.
               </div>
            )}
            {recordings.map(rec => (
              <div key={rec.id} className="glass-card p-4 rounded-xl border border-forest/20 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-gold/30 transition-all group">
                <div className="flex items-center gap-4 flex-1 w-full">
                  <button className="w-10 h-10 rounded-full bg-forest/20 flex items-center justify-center shrink-0 group-hover:bg-gold/20 group-hover:text-gold transition-colors text-forest-light">
                    <Play className="w-4 h-4 ml-1" />
                  </button>
                  <div>
                    <h3 className="font-bold text-cream">{rec.title}</h3>
                    <div className="flex gap-3 text-xs text-cream/50 mt-1 uppercase tracking-wider">
                      <span>{rec.date}</span>
                      <span>&bull;</span>
                      <span>{rec.duration}</span>
                      <span>&bull;</span>
                      <span className="text-gold-light">{rec.type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                  <button className="flex-1 md:flex-none px-4 flex items-center justify-center gap-2 py-2 bg-forest-dark border border-forest-light/30 rounded-lg text-cream/80 hover:bg-forest/50 hover:text-cream transition-colors font-medium text-sm">
                    <Download className="w-4 h-4" /> MP3
                  </button>
                  <button className="flex-1 md:flex-none px-4 flex items-center justify-center gap-2 py-2 bg-dark hover:bg-gold/10 border border-gold/30 rounded-lg text-gold-light hover:text-gold transition-colors font-medium text-sm">
                    <Download className="w-4 h-4" /> WAV
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-xs text-cream/30 uppercase tracking-widest font-bold">Auto-saves to /home/alash-studios/theoai/exports</p>
          </div>
        </main>
      </div>
    </div>
  )
}
