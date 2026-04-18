'use client'
import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Disc, Download } from 'lucide-react'

export default function AudioPage() {
  const [recordings, setRecordings] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/recordings')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRecordings(data) })
      .catch(e => console.error(e))
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-10">
          <div className="mb-8">
            <h1 className="text-4xl font-cinzel font-black tracking-tighter text-cream uppercase">Audio Archive</h1>
            <p className="text-cream/40 mt-2 text-sm">Manage full service recordings. Use the sidebar to control the projector and switch displays.</p>
          </div>

          <div className="space-y-4">
            {recordings.length === 0 && (
              <div className="glass-card p-10 rounded-2xl border border-forest/20 text-center text-cream/30 font-bold">
                No recordings found in the /exports directory.
              </div>
            )}
            {recordings.map(rec => (
              <div key={rec.id} className="glass-card p-5 rounded-2xl border border-forest/20 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-gold/30 transition-all group">
                <div className="flex flex-col gap-3 w-full">
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-10 h-10 rounded-full bg-forest/20 flex items-center justify-center shrink-0 group-hover:bg-gold/20 transition-colors">
                      <Disc className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-bold text-cream">{rec.title}</h3>
                      <div className="flex gap-3 text-xs text-cream/40 mt-1 uppercase tracking-wider">
                        <span>{rec.date}</span>
                        <span>&bull;</span>
                        <span className="text-gold/70">{rec.type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full flex items-center bg-dark/30 rounded-lg p-2 border border-forest/10">
                    <audio controls className="w-full h-10" src={`/api/recordings/play?file=${rec.filename}`}>
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto flex-col shrink-0">
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
        </main>
      </div>
    </div>
  )
}
