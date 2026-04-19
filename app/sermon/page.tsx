'use client'
import { useState, useRef, useEffect } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { AudioEngine } from '@/components/AudioEngine'
import { ChatWidget } from '@/components/ChatWidget'
import { FileText, Download, CheckCircle2, FileDown, BookOpen, Search, Plus, Trash2, Maximize, Eye, EyeOff } from 'lucide-react'
import { detectScripture } from '@/lib/scriptureDetector'

export default function SermonPage() {
  const [globalMode, setGlobalMode] = useState('idle')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [generating, setGenerating] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [pendingAudioBlob, setPendingAudioBlob] = useState<Blob | null>(null)
  const [detectedScripture, setDetectedScripture] = useState<string | null>(null)
  const [scriptureToast, setScriptureToast] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [bibleQueue, setBibleQueue] = useState<{ reference: string, text: string }[]>([])
  const [bibleVersion, setBibleVersion] = useState('kjv')

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

  const endRef = useRef<HTMLDivElement>(null)
  const lastPushedRef = useRef<string>('')

  useEffect(() => {
    fetch('/api/control').then(r => r.json()).then(d => setGlobalMode(d.mode))
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript, interimTranscript])

  const handleTranscript = async (text: string, isFinal?: boolean) => {
    if (isFinal) {
      const newTranscript = transcript + ' ' + text + '.'
      setTranscript(newTranscript)
      setInterimTranscript('')

      // AI Injected Detection
      try {
        const res = await fetch('/api/ai-process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: text, mode: 'sermon' })
        })
        const data = await res.json()
        
        if (data.type === 'scripture' && data.content.reference) {
          const ref = data.content.reference
          if (ref !== lastPushedRef.current) {
            lastPushedRef.current = ref
            setDetectedScripture(ref)
            setScriptureToast(ref)
            setTimeout(() => setScriptureToast(null), 5000)

            const scriptureData = { reference: ref, text: data.content.text }
            
            // Auto-add to queue if not present
            if (!bibleQueue.some(v => v.reference === ref)) {
              saveQueue([scriptureData, ...bibleQueue].slice(0, 20))
            }

            await fetch('/api/control', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'setScripture', scripture: scriptureData })
            })
          }
        }
      } catch (e) {
        console.error('AI injection error:', e)
        // Fallback to simple regex
        const ref = detectScripture(text)
        if (ref && ref !== lastPushedRef.current) {
          lastPushedRef.current = ref
          setDetectedScripture(ref)
          setScriptureToast(ref)
          setTimeout(() => setScriptureToast(null), 5000)
          fetch(`/api/bible?ref=${encodeURIComponent(ref)}`)
            .then(r => r.json())
            .then(d => {
              if (d.reference && d.text) {
                fetch('/api/control', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'setScripture', scripture: { reference: d.reference, text: d.text } })
                })
              }
            })
        }
      }
    } else {
      setInterimTranscript(text)
    }
  }

  const searchVerse = async () => {
    if (!searchQuery.trim()) return
    try {
      const res = await fetch(`/api/bible?ref=${encodeURIComponent(searchQuery)}&translation=${bibleVersion}`)
      const data = await res.json()
      if (data.reference && data.text) {
        const newVerse = { reference: data.reference, text: data.text }
        if (!bibleQueue.some(v => v.reference === data.reference)) {
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

  const generateSummary = async () => {
    if (!transcript) return alert('No transcript available to summarize.')
    setGenerating(true)
    try {
      const res = await fetch('/api/sermon-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      })
      const data = await res.json()
      if (data.summary) {
        setSummary(data.summary)

        let derivedTitle = 'Theo-Sermon'
        const titleMatch = data.summary.match(/^#+\s(.*?)$/m)
        if (titleMatch && titleMatch[1]) {
           derivedTitle = titleMatch[1].trim().replace(/[^a-zA-Z0-9 -]/g, '')
        }

        if (pendingAudioBlob) {
           const url = URL.createObjectURL(pendingAudioBlob)
           const a = document.createElement('a')
           a.style.display = 'none'
           a.href = url
           a.download = `${derivedTitle}-${new Date().toISOString().split('T')[0]}.mp4`
           document.body.appendChild(a)
           a.click()
           setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 100)
           setPendingAudioBlob(null)
        }

      } else {
        alert('Failed to generate summary.')
      }
    } catch(e) { console.error(e) }
    setGenerating(false)
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

          <AudioEngine mode="sermon" onTranscript={handleTranscript} onRecordingComplete={setPendingAudioBlob} />

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
            {/* Live Transcript Log */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="glass-card rounded-2xl flex-1 flex flex-col border border-forest/30 overflow-hidden min-h-[300px]">
                <div className="p-4 border-b border-forest/30 bg-forest-700/30 flex justify-between items-center">
                  <h2 className="font-cinzel text-xs font-black uppercase tracking-[0.2em] text-cream flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gold-light" /> Transcript
                  </h2>
                  <div className="flex items-center gap-3">
                    {detectedScripture && (
                      <span className="text-[10px] font-black text-gold bg-gold/10 px-2 py-1 rounded-full border border-gold/30">
                        📖 {detectedScripture}
                      </span>
                    )}
                    {transcript && <div className="text-[10px] font-black text-cream/40 uppercase tracking-widest bg-dark-950 px-3 py-1 rounded-full">{transcript.split(' ').length} words</div>}
                  </div>
                </div>
                <div className="p-6 overflow-y-auto flex-1 font-inter text-cream/80 leading-relaxed text-lg bg-dark/40">
                  {transcript || interimTranscript ? (
                    <p>
                      {transcript}
                      <span className="text-cream/40 italic ml-2">{interimTranscript}</span>
                    </p>
                  ) : (
                    <div className="flex items-center justify-center h-full text-cream/30 italic">
                      Start the audio engine to begin transcribing...
                    </div>
                  )}
                  <div ref={endRef} />
                </div>
              </div>

              {/* Bible Controller (Now part of the main grid) */}
              <div className="glass-card rounded-2xl flex flex-col border border-forest/30 overflow-hidden h-[400px]">
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
                      className="flex-1 bg-black/40 border border-forest/30 rounded-xl px-2 text-[10px] font-black uppercase text-gold focus:outline-none focus:border-gold/50"
                    >
                      <option value="kjv">KJV</option>
                      <option value="niv">NIV</option>
                      <option value="asv">ASV</option>
                      <option value="web">WEB</option>
                      <option value="bbe">BBE</option>
                    </select>
                    <button onClick={searchVerse} className="bg-forest px-6 py-3 rounded-xl text-cream text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg">Project</button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                    {bibleQueue.map((v, i) => {
                      const isProjected = detectedScripture === v.reference
                      return (
                        <div key={i} className={`bg-dark-950/40 border p-4 rounded-xl group transition-all cursor-default ${isProjected ? 'border-gold/50 bg-gold/5' : 'border-white/5 hover:border-gold/30 hover:bg-white/5'}`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isProjected ? 'text-gold' : 'text-gold/60'}`}>{v.reference}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                               <button onClick={() => toggleProjectVerse(v)} className={`p-1.5 rounded-lg transition-all ${isProjected ? 'bg-gold text-dark-950' : 'hover:bg-forest/20 text-forest-light'}`} title={isProjected ? "Clear Projection" : "Project"}>
                                 {isProjected ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                               </button>
                               <button onClick={() => removeFromQueue(i)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-400" title="Delete"><Trash2 className="w-4 h-4"/></button>
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

            {/* Smart Summary Panel */}
            <div className="glass-card rounded-2xl flex flex-col border border-gold/20 overflow-hidden relative">
              <div className="p-4 border-b border-gold/20 bg-dark-950/50 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border border-gold flex items-center justify-center bg-gold/10">
                  <img src="/logo.png" className="w-3 h-3 grayscale brightness-200" alt=""/>
                </div>
                <h2 className="font-cinzel text-xs font-black uppercase tracking-[0.2em] text-gold-light">Theo Summary Engine</h2>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto">
                {!summary ? (
                   <div className="text-center mt-10">
                    <p className="text-sm text-cream/60 mb-6">Theo will process the raw transcript into key points, theological themes, and detected scriptures.</p>
                    <button 
                      onClick={generateSummary}
                      disabled={generating || !transcript}
                      className="w-full forest-gradient text-cream font-bold py-3 rounded-lg shadow-lg hover:brightness-110 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2"
                    >
                      {generating ? <div className="w-5 h-5 border-2 border-cream/30 border-t-cream rounded-full animate-spin"/> : <FileDown className="w-5 h-5"/>}
                      {generating ? 'Synthesizing...' : 'Generate PDF Summary'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fade-in relative">
                    <div className="absolute -top-4 -right-2 text-green-400">
                      <CheckCircle2 className="w-8 h-8 opacity-50" />
                    </div>
                    {summary.split('\n').map((line, i) => {
                      if (line.match(/^#+\s/)) {
                         return <h3 key={i} className="font-cinzel font-bold text-gold text-lg mt-6 mb-2 border-b border-gold/20 pb-1">{line.replace(/^#+\s/, '')}</h3>
                      }
                      if (line.trim() === '') return <div key={i} className="h-2"/>
                      if (line.match(/^[1-4]\./)) {
                        return <h4 key={i} className="font-bold text-forest-light uppercase tracking-wider text-xs mt-4 mb-2">{line}</h4>
                      }
                      if (line.startsWith('*') || line.startsWith('-')) {
                        return <li key={i} className="text-sm text-cream/80 ml-4 mb-1 list-disc">{line.replace(/^[-*]\s/, '')}</li>
                      }
                      return <p key={i} className="text-sm text-cream/90">{line}</p>
                    })}
                    
                    <button 
                      onClick={() => window.print()}
                      className="mt-8 w-full bg-dark border border-gold/40 text-gold-light font-bold py-3 rounded-lg hover:bg-gold/10 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4"/> Download & Print Summary
                    </button>
                    <p className="text-center text-[10px] text-cream/30 uppercase mt-2">Use browser print for PDF export</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <ChatWidget />
        </main>
      </div>
    </div>
  )
}
