'use client'
import { useState, useRef, useEffect } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { ChatWidget } from '@/components/ChatWidget'
import { BookOpen, Search, Trash2, Eye, X } from 'lucide-react'

export default function SermonPage() {
  const [detectedScripture, setDetectedScripture] = useState<string | null>(null)
  const [scriptureToast, setScriptureToast] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [bibleQueue, setBibleQueue] = useState<{ reference: string, text: string }[]>([])
  const [bibleVersion, setBibleVersion] = useState('kjv')
  const [chapterVerses, setChapterVerses] = useState<{ reference: string, verses: { verse: number, text: string }[] } | null>(null)
  const [selectedChapterVerse, setSelectedChapterVerse] = useState<{ verse: number, text: string } | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('theoai_bible_queue')
    if (saved) {
      try { setBibleQueue(JSON.parse(saved)) } catch (e) {}
    }
  }, [])

  const saveQueue = (newQueue: any[]) => {
    setBibleQueue(newQueue)
    localStorage.setItem('theoai_bible_queue', JSON.stringify(newQueue))
  }

  const lastPushedRef = useRef<string>('')

  const searchVerse = async () => {
    if (!searchQuery.trim()) return
    setChapterVerses(null)
    try {
      const res = await fetch(`/api/bible?ref=${encodeURIComponent(searchQuery)}&translation=${bibleVersion}`)
      const data = await res.json()
      
      if (data.verses) {
        setChapterVerses(data)
        setSearchQuery('')
      } else if (data.reference && data.text) {
        const newVerse = { reference: `${data.reference} (${bibleVersion.toUpperCase()})`, text: data.text }
        if (!bibleQueue.some(v => v.reference === newVerse.reference)) {
          saveQueue([newVerse, ...bibleQueue])
        }
        projectStoredVerse(newVerse)
        setSearchQuery('')
      } else {
        alert('Verse not found.')
      }
    } catch (e) { alert('Error fetching verse.') }
  }

  const projectStoredVerse = async (v: { reference: string, text: string }) => {
    setDetectedScripture(v.reference)
    await fetch('/api/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setScripture', scripture: v })
    })
  }

  const clearProjection = async () => {
    setDetectedScripture(null)
    await fetch('/api/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setMode', mode: 'sermon' }) // This should clear scripture if handled correctly
    })
  }

  const toggleProjectVerse = async (v: { reference: string, text: string }) => {
    if (detectedScripture === v.reference) {
      await clearProjection()
    } else {
      await projectStoredVerse(v)
    }
  }

  const removeFromQueue = (idx: number) => {
    const next = [...bibleQueue]
    next.splice(idx, 1)
    saveQueue(next)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8 relative flex flex-col">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-4xl font-cinzel font-black tracking-tighter text-cream uppercase">Sermon</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetch('/api/control', { method: 'POST', body: JSON.stringify({ action: 'setMode', mode: 'idle' }) })}
                className="bg-forest/20 border border-forest/30 hover:bg-forest/40 text-cream px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all glow-forest"
              >
                Go Idle
              </button>
            </div>
          </div>

          {/* Scripture Detected Toast */}
          {scriptureToast && (
            <div className="mb-4 flex items-center gap-3 bg-gold/10 border border-gold/40 rounded-2xl px-5 py-4 animate-fade-in">
              <BookOpen className="w-5 h-5 text-gold shrink-0" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gold">Scripture Detected & Projected</p>
                <p className="text-cream font-bold mt-1">{scriptureToast}</p>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col min-h-0">
            {/* Bible Controller - Full Width */}
            <div className="glass-card rounded-2xl flex flex-col border border-forest/30 overflow-hidden flex-1">
              <div className="p-4 border-b border-forest/30 bg-forest-700/30 flex justify-between items-center">
                <h2 className="font-cinzel text-xs font-black uppercase tracking-[0.2em] text-cream flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gold-light" /> Bible Controller
                </h2>
                <span className="text-[10px] font-black text-cream/30 uppercase tracking-widest">{bibleQueue.length} Stored</span>
              </div>
              <div className="p-6 space-y-6 flex-1 flex flex-col min-h-0">
                <div className="flex gap-3 shrink-0">
                  <div className="flex-[2] bg-black/40 border border-forest/30 rounded-xl px-4 py-3 flex items-center gap-3 focus-within:border-gold/50 transition-all">
                    <Search className="w-4 h-4 text-gold" />
                    <input 
                      placeholder="Search verse (e.g. Romans 8:28)" 
                      className="bg-transparent border-none text-cream focus:outline-none text-sm w-full font-bold"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && searchVerse()}
                    />
                  </div>
                  <select 
                    value={bibleVersion}
                    onChange={e => setBibleVersion(e.target.value)}
                    className="flex-1 bg-black/60 border border-forest/40 rounded-xl px-2 text-[10px] font-black uppercase text-gold cursor-pointer focus:outline-none focus:border-gold/50 appearance-none text-center hover:bg-black/80 transition-all"
                  >
                    <option value="kjv" className="bg-forest-950 text-gold">KJV (King James)</option>
                    <option value="nlt" className="bg-forest-950 text-gold">NLT (New Living Translation)</option>
                    <option value="niv" className="bg-forest-950 text-gold">NIV (New International Version)</option>
                    <option value="amp" className="bg-forest-950 text-gold">AMP (Amplified Bible)</option>
                    <option value="asv" className="bg-forest-950 text-gold">ASV (American Standard)</option>
                    <option value="web" className="bg-forest-950 text-gold">WEB (World English)</option>
                    <option value="bbe" className="bg-forest-950 text-gold">BBE (Basic English)</option>
                    <option value="almeida" className="bg-forest-950 text-gold">ALMEIDA (Portuguese)</option>
                  </select>
                  <button onClick={searchVerse} className="bg-forest px-6 py-3 rounded-xl text-cream text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg">Project</button>
                </div>
                
                {chapterVerses && (
                  <div className="bg-forest-950/50 border border-gold/30 rounded-2xl overflow-hidden flex flex-row h-[300px] animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Left: Numbers */}
                    <div className="w-full md:w-1/3 p-4 border-b md:border-b-0 md:border-r border-gold/10 flex flex-col">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gold">{chapterVerses.reference}</h3>
                        <button onClick={() => setChapterVerses(null)} className="text-[10px] font-black uppercase text-cream/40 hover:text-cream md:hidden">Close</button>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 overflow-y-auto custom-scrollbar pr-1 flex-1">
                        {chapterVerses.verses.map((v, i) => {
                          const isSelected = selectedChapterVerse?.verse === v.verse
                          return (
                            <button
                              key={i}
                              onClick={() => setSelectedChapterVerse(v)}
                              className={`aspect-square flex items-center justify-center border rounded-lg text-[10px] font-bold transition-all ${isSelected ? 'bg-gold text-dark-950 border-gold' : 'bg-dark-900 border-white/5 text-cream/60 hover:bg-gold/20 hover:text-gold'}`}
                            >
                              {v.verse}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    
                    {/* Right: Bible Box */}
                    <div className="w-full md:w-2/3 p-4 bg-dark/20 flex flex-col relative">
                      <div className="hidden md:block absolute top-4 right-4">
                        <button onClick={() => setChapterVerses(null)} className="text-cream/20 hover:text-cream"><X className="w-4 h-4"/></button>
                      </div>
                      <div className="flex flex-col h-full">
                         <div className="text-[8px] font-black uppercase tracking-widest text-gold/30 mb-3">Bible Box Preview</div>
                         {selectedChapterVerse ? (
                           <div className="flex-1 flex flex-col justify-center animate-fade-in">
                             <p className="text-sm text-cream font-bold leading-relaxed mb-4 line-clamp-4 italic">"{selectedChapterVerse.text}"</p>
                             <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                               <span className="text-[9px] font-black text-gold uppercase tracking-widest">{chapterVerses.reference}:{selectedChapterVerse.verse}</span>
                               <button 
                                 onClick={() => {
                                   const newVerse = { reference: `${chapterVerses.reference}:${selectedChapterVerse.verse} (${bibleVersion.toUpperCase()})`, text: selectedChapterVerse.text }
                                   if (!bibleQueue.some(q => q.reference === newVerse.reference)) {
                                     saveQueue([newVerse, ...bibleQueue])
                                   }
                                   projectStoredVerse(newVerse)
                                 }}
                                 className="bg-gold text-dark-950 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
                               >
                                 Project
                               </button>
                             </div>
                           </div>
                         ) : (
                           <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                             <Search className="w-8 h-8 mb-2" />
                             <p className="text-[8px] font-black uppercase tracking-widest">Select Verse</p>
                           </div>
                         )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">

                  {bibleQueue.map((v, i) => {
                    const isProjected = detectedScripture === v.reference
                    return (
                      <div 
                        key={i} 
                        onClick={() => projectStoredVerse(v)}
                        className={`bg-dark-950/40 border p-4 rounded-xl group transition-all cursor-pointer select-none ${isProjected ? 'border-gold/50 bg-gold/5' : 'border-white/5 hover:border-gold/30 hover:bg-white/5'}`}
                        title="Tap to Project"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isProjected ? 'text-gold' : 'text-gold/60'}`}>{v.reference}</span>
                          <div className="flex gap-1 items-center">
                             <button 
                               onClick={(e) => { e.stopPropagation(); removeFromQueue(i) }}
                               className="p-1.5 rounded-lg transition-all text-red-500/50 hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover:opacity-100"
                               title="Remove from Queue"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                             <div className={`p-1.5 rounded-lg transition-all ${isProjected ? 'bg-gold text-dark-950' : 'text-cream/20 group-hover:text-gold/40'}`}>
                               {isProjected ? <Eye className="w-4 h-4"/> : <div className="w-4 h-4" />}
                             </div>
                          </div>
                        </div>
                        <p className={`text-sm leading-relaxed ${isProjected ? 'text-cream font-bold' : 'text-cream/70 line-clamp-2'}`}>{v.text}</p>
                      </div>
                    )
                  })}
                  {bibleQueue.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
                      <BookOpen className="w-12 h-12 mb-2" />
                      <p className="text-[10px] uppercase font-black tracking-widest">Queue Empty</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <ChatWidget />
        </main>
      </div>
    </div>
  )
}
