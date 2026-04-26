'use client'
import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { FileUp, Play, ChevronLeft, ChevronRight, Layers, Presentation, Trash2, Eye } from 'lucide-react'

export default function SlidesPage() {
  const [slides, setSlides] = useState<any[]>([])
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [projState, setProjState] = useState<any>({ mode: 'idle' })

  useEffect(() => {
    const int = setInterval(async () => {
      try {
        const r = await fetch('/api/control')
        const d = await r.json()
        setProjState(d)
      } catch (e) {}
    }, 2000)
    return () => clearInterval(int)
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/slides/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        setSlides([...slides, ...data.slides])
      } else {
        alert('Upload failed: ' + data.error)
      }
    } catch (e) {
      alert('Error uploading file.')
    }
    setUploading(false)
  }

  const projectSlide = async (index: number) => {
    setCurrentSlideIndex(index)
    const slide = slides[index]
    if (!slide) return

    await fetch('/api/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'setSlide', 
        url: slide.url,
        title: slide.title || `Slide ${index + 1}`
      })
    })
  }

  const removeSlide = (index: number) => {
    setSlides(slides.filter((_, i) => i !== index))
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8 relative">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-cinzel font-black tracking-tighter text-cream uppercase">Slides Display</h1>
              <p className="text-cream/40 text-xs font-black uppercase tracking-[0.2em] mt-1">Presentation Engine</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input type="file" accept=".pdf,.pptx" onChange={handleUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <button className="flex items-center gap-2 px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest bg-gold border border-gold text-dark-950 hover:bg-gold-light transition-all shadow-lg glow-accent">
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" />
                  ) : (
                    <FileUp className="w-4 h-4" />
                  )}
                  {uploading ? 'Processing...' : 'Upload Slides'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Slide Queue & Previews */}
            <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-cream/30 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Slide Deck
                </h2>
                <span className="text-[10px] font-black text-gold bg-gold/10 px-3 py-1 rounded-full border border-gold/20">{slides.length} Slides</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {slides.map((slide, idx) => {
                  const isLive = currentSlideIndex === idx && projState.mode === 'slide'
                  return (
                    <div 
                      key={idx}
                      className={`group relative glass-card rounded-xl overflow-hidden border transition-all cursor-pointer ${isLive ? 'border-gold shadow-[0_0_20px_rgba(201,168,76,0.3)]' : 'border-white/5 hover:border-gold/30'}`}
                      onClick={() => projectSlide(idx)}
                    >
                      <div className="aspect-[16/9] bg-black/40 flex items-center justify-center overflow-hidden">
                        {slide.url ? (
                          <img src={slide.url} alt={`Slide ${idx + 1}`} className="w-full h-full object-contain" />
                        ) : (
                          <Presentation className="w-8 h-8 text-cream/10" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <button className="p-2 bg-gold rounded-full text-dark-950 hover:scale-110 transition-transform">
                            <Play className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeSlide(idx) }}
                            className="p-2 bg-red-500 rounded-full text-white hover:scale-110 transition-transform"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="p-3 bg-dark/60 flex justify-between items-center">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isLive ? 'text-gold' : 'text-cream/40'}`}>Slide {idx + 1}</span>
                        {isLive && <span className="text-[8px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse">LIVE</span>}
                      </div>
                    </div>
                  )
                })}
                {slides.length === 0 && (
                  <div className="col-span-full border-2 border-dashed border-white/5 rounded-3xl py-20 flex flex-col items-center justify-center opacity-20">
                    <Presentation className="w-16 h-16 mb-4" />
                    <p className="font-black uppercase tracking-[0.3em] text-xs">No slides uploaded</p>
                  </div>
                )}
              </div>
            </div>

            {/* Controls & Preview */}
            <div className="space-y-6">
              <div className="glass-card rounded-2xl p-6 border border-white/10">
                <h3 className="font-cinzel text-xs font-black uppercase tracking-[0.2em] text-cream/40 mb-4">Live Control</h3>
                
                <div className="aspect-[16/9] bg-black rounded-xl mb-6 overflow-hidden border border-white/5 relative">
                  {slides[currentSlideIndex] && (
                    <img src={slides[currentSlideIndex].url} className="w-full h-full object-contain" alt="Preview"/>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${projState.mode === 'slide' ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`} />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/60">
                      {projState.mode === 'slide' ? 'Projecting' : 'Preview Mode'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => projectSlide(Math.max(0, currentSlideIndex - 1))}
                    disabled={currentSlideIndex === 0 || slides.length === 0}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all disabled:opacity-20"
                  >
                    <ChevronLeft className="w-5 h-5 text-gold" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-cream/40">Prev</span>
                  </button>
                  <button 
                    onClick={() => projectSlide(Math.min(slides.length - 1, currentSlideIndex + 1))}
                    disabled={currentSlideIndex === slides.length - 1 || slides.length === 0}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all disabled:opacity-20"
                  >
                    <ChevronRight className="w-5 h-5 text-gold" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-cream/40">Next</span>
                  </button>
                </div>

                <button 
                  onClick={() => fetch('/api/control', { method: 'POST', body: JSON.stringify({ action: 'setMode', mode: 'idle' }) })}
                  className="w-full mt-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500/20 transition-all"
                >
                  Kill Projection
                </button>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-forest/30">
                <h3 className="font-cinzel text-xs font-black uppercase tracking-[0.2em] text-cream/40 mb-4">Quick Shortcuts</h3>
                <div className="space-y-2">
                  <button className="w-full py-3 bg-dark/40 border border-forest/20 rounded-xl text-xs font-bold text-cream/60 hover:text-cream hover:border-gold/30 flex items-center justify-between px-4 transition-all">
                    <span>Blackout Screen</span>
                    <EyeOff className="w-4 h-4" />
                  </button>
                  <button className="w-full py-3 bg-dark/40 border border-forest/20 rounded-xl text-xs font-bold text-cream/60 hover:text-cream hover:border-gold/30 flex items-center justify-between px-4 transition-all">
                    <span>Reset Deck</span>
                    <Layers className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}

function EyeOff(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
  )
}
