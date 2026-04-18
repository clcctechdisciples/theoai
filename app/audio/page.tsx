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

          <div className="mb-4">
             {/* Removed Configure Settings block per user request */}
          </div>

          <div className="space-y-4">
            {recordings.length === 0 && (
               <div className="glass-card p-10 rounded-xl border border-forest/20 text-center text-cream/50">
                 No audio recordings found in the /exports directory.
               </div>
            )}
            {recordings.map(rec => (
              <div key={rec.id} className="glass-card p-4 rounded-xl border border-forest/20 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-gold/30 transition-all group">
                <div className="flex flex-col gap-4 w-full">
                  <div className="flex items-center gap-4 flex-1 w-full">
                    <div className="w-10 h-10 rounded-full bg-forest/20 flex items-center justify-center shrink-0 group-hover:bg-gold/20 group-hover:text-gold transition-colors text-forest-light">
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
                    <audio controls className="w-full h-10 custom-audio" src={`/api/recordings/play?file=${rec.filename}`}>
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto h-full flex-col justify-center">
                  <a href={`/api/recordings/play?file=${rec.filename}&download=1`} download={rec.filename} className="px-4 flex items-center justify-center gap-2 py-2 bg-forest-dark border border-forest-light/30 rounded-lg text-cream/80 hover:bg-forest/50 hover:text-cream transition-colors font-medium text-sm">
                    <Download className="w-4 h-4" /> Download Original ({rec.type})
                  </a>
                  <button onClick={async () => {
                    const confirmDeletion = confirm(`Permanently delete ${rec.title}?`);
                    if (confirmDeletion) {
                       await fetch('/api/recordings/delete', { method: 'POST', body: JSON.stringify({ filename: rec.filename }), headers: { 'Content-Type': 'application/json' } })
                       window.location.reload()
                    }
                  }} className="px-4 flex items-center justify-center gap-2 py-2 bg-dark/50 border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors font-medium text-sm rounded-lg">
                     Delete
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
