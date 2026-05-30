'use client'
import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { FileUp, Play, Trash2, Film, Image as ImageIcon, MonitorPlay, X, Plus } from 'lucide-react'

export default function MediaEnginePage() {
  const [media, setMedia] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [projState, setProjState] = useState<any>({ mode: 'idle' })

  useEffect(() => {
    fetchMedia()
    const int = setInterval(async () => {
      try {
        const r = await fetch('/api/control')
        const d = await r.json()
        setProjState(d)
      } catch (e) {}
    }, 2000)
    return () => clearInterval(int)
  }, [])

  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/media')
      const data = await res.json()
      if (Array.isArray(data)) setMedia(data)
    } catch (e) {}
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    setUploading(true)
    const formData = new FormData()
    files.forEach(f => formData.append('files', f))

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        setMedia([...data.media, ...media])
      } else {
        alert('Upload failed: ' + data.error)
      }
    } catch (e: any) {
      alert('Error uploading: ' + e.message)
    }
    setUploading(false)
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this?')) return
    try {
      const res = await fetch('/api/media', {
        method: 'DELETE',
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        setMedia(media.filter(m => m.id !== id))
      }
    } catch (e) {}
  }

  const projectMedia = async (item: any) => {
    await fetch('/api/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: item.type === 'video' ? 'setVideo' : 'setBackground', 
        url: item.url 
      })
    })
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-cinzel font-black tracking-tighter text-cream uppercase">Media Engine</h1>
              <p className="text-cream/40 text-xs font-black uppercase tracking-[0.2em] mt-1">Pictures & Videos</p>
            </div>
            <div className="relative">
              <input type="file" multiple accept="image/*,video/*" onChange={handleUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <button className="flex items-center gap-2 px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest bg-gold border border-gold text-dark-950 hover:bg-gold-light transition-all shadow-lg">
                {uploading ? <div className="w-4 h-4 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" /> : <FileUp className="w-4 h-4" />}
                {uploading ? 'Uploading...' : 'Upload Media'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {media.map((item) => {
              const isLive = (projState.backgroundUrl === item.url || projState.videoUrl === item.url)
              return (
                <div key={item.id} className={`group relative glass-card rounded-2xl overflow-hidden border transition-all ${isLive ? 'border-gold ring-1 ring-gold shadow-[0_0_20px_rgba(201,168,76,0.2)]' : 'border-white/5 hover:border-gold/30'}`}>
                  <div className="aspect-video bg-black/40 relative overflow-hidden">
                    {item.type === 'video' ? (
                      <video src={item.url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                    )}
                    
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                      <button onClick={() => projectMedia(item)} className="p-3 bg-gold rounded-full text-dark-950 hover:scale-110 transition-transform">
                        <MonitorPlay className="w-5 h-5" />
                      </button>
                      <button onClick={() => deleteItem(item.id)} className="p-3 bg-red-500 rounded-full text-white hover:scale-110 transition-transform">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="absolute top-2 left-2">
                      {item.type === 'video' ? (
                        <Film className="w-4 h-4 text-white/50" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-white/50" />
                      )}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-dark/60">
                    <p className="text-[10px] font-bold text-cream truncate mb-1">{item.title}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-black uppercase tracking-widest text-gold/50">{item.type}</span>
                      {isLive && <span className="text-[8px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse">LIVE</span>}
                    </div>
                  </div>
                </div>
              )
            })}

            {media.length === 0 && !uploading && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-white/5 rounded-3xl">
                <Film className="w-16 h-16 mb-4" />
                <p className="font-black uppercase tracking-[0.3em] text-xs">No media found</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
