'use client'
import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { AudioEngine } from '@/components/AudioEngine'
import { ChatWidget } from '@/components/ChatWidget'
import { Edit2, Save, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react'

export default function WorshipPage() {
  const [globalState, setGlobalState] = useState({ mode: 'idle', lyricLines: [] as string[], lyricSection: '' })
  const [masterText, setMasterText] = useState('')
  const [verses, setVerses] = useState<string[][]>([])
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0)
  const [songTitle, setSongTitle] = useState('')
  const [library, setLibrary] = useState<any[]>([])
  const [showLibrary, setShowLibrary] = useState(false)

  useEffect(() => {
    fetch('/api/songs').then(r => r.json()).then(d => setLibrary(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  useEffect(() => {
    const int = setInterval(async () => {
      try {
        const r = await fetch('/api/control')
        const d = await r.json()
        setGlobalState(d)
      } catch (e) {}
    }, 2000)
    return () => clearInterval(int)
  }, [])

  useEffect(() => {
    const lines = masterText.split('\n').filter(l => l.trim() !== '')
    const newVerses: string[][] = []
    for (let i = 0; i < lines.length; i += 3) {
      newVerses.push(lines.slice(i, i + 3))
    }
    setVerses(newVerses)
  }, [masterText])

  const projectVerse = (idx: number, verseLines: string[]) => {
    setCurrentVerseIndex(idx)
    fetch('/api/control', {
      method: 'POST',
      body: JSON.stringify({ action: 'setLyrics', lines: verseLines, section: `Verse ${idx + 1}` })
    })
  }

  const handleTranscript = async (text: string) => {
    const newLines = [text.substring(0, 30), text.substring(30, 60), text.substring(60)]
    try {
      await fetch('/api/control', {
        method: 'POST',
        body: JSON.stringify({ action: 'setLyrics', lines: newLines.filter(l => l.trim().length > 0), section: 'Live Audio' })
      })
    } catch (e) {}
  }

  const saveToLibrary = async () => {
    if (!songTitle.trim()) return alert('Please enter a Song Title to save.')
    try {
      await fetch('/api/songs', {
        method: 'POST',
        body: JSON.stringify({ title: songTitle, lyrics: [masterText] })
      })
      fetch('/api/songs').then(r => r.json()).then(d => setLibrary(Array.isArray(d) ? d : []))
      alert('Song saved to Library!')
    } catch (e) { alert('Failed to save.') }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8 relative">
          {/* Header */}
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-4xl font-cinzel font-black tracking-tighter text-cream uppercase">Worship</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetch('/api/control', { method: 'POST', body: JSON.stringify({ action: 'setMode', mode: 'idle' }) })}
                className="bg-forest/20 border border-forest/30 hover:bg-forest/40 text-cream px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all"
              >
                Go Idle
              </button>
              <button
                onClick={() => setShowLibrary(!showLibrary)}
                className={`flex items-center gap-2 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all border ${showLibrary ? 'bg-gold border-gold text-dark-950' : 'bg-transparent border-white/10 text-cream/40 hover:text-cream'}`}
              >
                <FolderOpen className="w-4 h-4" /> Library
              </button>
            </div>
          </div>

          {/* Song Library */}
          {showLibrary && (
            <div className="glass-card mb-6 p-6 rounded-2xl border border-gold/30 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {library.map(song => (
                <div
                  key={song.id}
                  className="bg-dark border border-forest/20 p-4 rounded-xl hover:border-gold/50 cursor-pointer transition-all"
                  onClick={() => { setSongTitle(song.title); setMasterText(song.lyrics?.[0] || ''); setShowLibrary(false) }}
                >
                  <h3 className="font-bold text-cream text-sm truncate">{song.title}</h3>
                  <span className="text-[10px] uppercase text-gold-light mt-1 block">Saved Song</span>
                </div>
              ))}
              {library.length === 0 && <p className="text-sm text-cream/50 col-span-full">No songs saved yet.</p>}
            </div>
          )}

          <AudioEngine mode="worship" onTranscript={handleTranscript} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Editor Panel */}
            <div className="glass-card rounded-2xl p-6 border border-gold/20 flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex-1 flex items-center gap-2 bg-dark/50 border border-forest/30 rounded-lg px-3 py-2">
                  <Edit2 className="w-4 h-4 text-gold shrink-0" />
                  <input
                    value={songTitle}
                    onChange={e => setSongTitle(e.target.value)}
                    placeholder="Song Title..."
                    className="bg-transparent border-none text-cream focus:outline-none w-full text-sm font-bold"
                  />
                </div>
                <button onClick={saveToLibrary} className="bg-forest border border-forest/30 hover:brightness-110 text-white p-2 rounded-lg" title="Save to Library">
                  <Save className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-cream/40 uppercase tracking-widest font-black mb-3">Paste Lyrics — auto-splits every 3 lines</p>
              <textarea
                value={masterText}
                onChange={e => setMasterText(e.target.value)}
                placeholder="Paste your worship lyrics here..."
                className="w-full flex-1 min-h-[240px] bg-dark/50 border border-forest/20 rounded-lg p-4 text-sm text-cream focus:outline-none focus:border-gold-light transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* Verse Queue + Preview */}
            <div className="flex flex-col gap-4">
              {/* Verse Queue — fully scrollable */}
              <div className="glass-card rounded-2xl p-5 border border-forest/30 flex flex-col">
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <h3 className="font-cinzel text-xs font-black uppercase tracking-[0.2em] text-cream/60">Verse Queue</h3>
                  <span className="text-[10px] font-black text-gold bg-gold/10 px-3 py-1 rounded-full border border-gold/20">{verses.length} Verses</span>
                </div>

                {/* Scrollable list — all verses visible */}
                <div className="overflow-y-auto space-y-2 custom-scrollbar pr-1" style={{ maxHeight: '260px' }}>
                  {verses.length > 0 ? verses.map((verseLines, idx) => {
                    const isLive = idx === currentVerseIndex
                    return (
                      <button
                        key={idx}
                        onClick={() => projectVerse(idx, verseLines)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          isLive
                            ? 'bg-cream/10 border-gold/50 shadow-[0_0_10px_rgba(201,168,76,0.15)]'
                            : 'bg-dark/40 border-forest/20 hover:border-gold/40 hover:bg-dark/60 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-[10px] uppercase tracking-widest font-black ${isLive ? 'text-gold' : 'text-cream/30'}`}>Verse {idx + 1}</span>
                          {isLive && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 rounded-full border border-red-500/30 animate-pulse">LIVE</span>}
                        </div>
                        {verseLines.map((line, i) => (
                          <p key={i} className={`text-xs ${isLive ? 'text-cream font-bold' : 'text-cream/60'}`}>{line}</p>
                        ))}
                      </button>
                    )
                  }) : (
                    <div className="h-20 flex items-center justify-center">
                      <p className="text-cream/30 italic text-xs">Paste lyrics to generate verse blocks...</p>
                    </div>
                  )}
                </div>

                {/* Prev / Next */}
                <div className="pt-3 border-t border-forest/20 mt-3 flex gap-2 shrink-0">
                  <button
                    onClick={() => { const p = Math.max(0, currentVerseIndex - 1); projectVerse(p, verses[p]) }}
                    disabled={currentVerseIndex === 0 || verses.length === 0}
                    className="flex-1 py-2 bg-dark/50 hover:bg-forest/20 border border-forest/30 rounded-lg text-cream text-xs font-black flex justify-center items-center gap-1 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <button
                    onClick={() => { const n = Math.min(verses.length - 1, currentVerseIndex + 1); projectVerse(n, verses[n]) }}
                    disabled={currentVerseIndex === verses.length - 1 || verses.length === 0}
                    className="flex-[2] py-2 bg-forest/30 border border-gold/40 text-cream hover:bg-forest/50 hover:border-gold/70 font-black text-xs rounded-lg flex justify-center items-center gap-1 disabled:opacity-50 disabled:pointer-events-none transition-all"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Projector Preview */}
              <div className="glass-card rounded-2xl p-5 border border-white/5 flex flex-col">
                <h3 className="font-cinzel text-xs font-black uppercase tracking-[0.2em] text-cream/30 mb-4">Projector Preview</h3>
                <div className="w-full bg-black rounded-2xl min-h-[160px] flex flex-col items-center justify-center p-6 border border-white/5 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-forest-700/40 to-black pointer-events-none" />
                  {globalState.mode === 'worship' ? (
                    <>
                      <div className="text-[10px] bg-gold text-dark-950 px-3 py-1 rounded-full mb-3 z-10 font-black uppercase tracking-widest">{globalState.lyricSection}</div>
                      <div className="text-center z-10 text-cream font-black space-y-1 uppercase tracking-tight">
                        {globalState.lyricLines.map((l, i) => <p key={i} className="text-lg md:text-xl">{l}</p>)}
                      </div>
                    </>
                  ) : (
                    <span className="text-[10px] text-cream/20 font-black uppercase tracking-[0.2em] z-10">System Idle</span>
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
