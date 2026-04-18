'use client'
import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/Sidebar'

import { AudioEngine } from '@/components/AudioEngine'
import { ChatWidget } from '@/components/ChatWidget'
import { Check, Edit2, Plus, Trash2, Save, FolderOpen, MonitorPlay as MonitorIcon, ChevronLeft, ChevronRight } from 'lucide-react'

export default function WorshipPage() {
  const [globalState, setGlobalState] = useState({ mode: 'idle', lyricLines: [] as string[], lyricSection: '' })

  const [masterText, setMasterText] = useState('')
  const [verses, setVerses] = useState<string[][]>([])
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0)

  const [songTitle, setSongTitle] = useState('')
  const [library, setLibrary] = useState<any[]>([])
  const [showLibrary, setShowLibrary] = useState(false)

  useEffect(() => {
    fetch('/api/songs').then(r => r.json()).then(d => setLibrary(Array.isArray(d) ? d : [])).catch(() => { })
  }, [])

  // Poll state just to keep local UI synced with what's actually on the projector
  useEffect(() => {
    const int = setInterval(async () => {
      try {
        const r = await fetch('/api/control'); const d = await r.json()
        setGlobalState(d)
      } catch (e) { }
    }, 2000)
    return () => clearInterval(int)
  }, [])

  useEffect(() => {
    // Auto-split master string into 3-line chunks
    const lines = masterText.split('\n').filter(l => l.trim() !== '')
    const newVerses = []
    for (let i = 0; i < lines.length; i += 3) {
      newVerses.push(lines.slice(i, i + 3))
    }
    setVerses(newVerses)
  }, [masterText])

  const pushToProjector = async () => {
    if (verses.length === 0) return
    await fetch('/api/control', {
      method: 'POST',
      body: JSON.stringify({ action: 'setLyrics', lines: verses[currentVerseIndex], section: `Verse ${currentVerseIndex + 1}` })
    })
  }

  const handleTranscript = async (text: string, isFinal?: boolean) => {
    // Left completely intact as requested, but without scripture execution.
    const newLines = [text.substring(0, 30), text.substring(30, 60), text.substring(60)]
    try {
      await fetch('/api/control', {
        method: 'POST',
        body: JSON.stringify({ action: 'setLyrics', lines: newLines.filter(l => l.trim().length > 0), section: 'Live Audio' })
      })
    } catch (e) { }
  }

  const saveToLibrary = async () => {
    if (!songTitle.trim()) return alert("Please enter a Song Title to save.")
    try {
      await fetch('/api/songs', {
        method: 'POST',
        body: JSON.stringify({ title: songTitle, lyrics: [masterText] })
      })
      fetch('/api/songs').then(r => r.json()).then(d => setLibrary(Array.isArray(d) ? d : []))
      alert("Song saved to Library!")
    } catch (e) { alert("Failed to save.") }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8 relative">
          <header className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-cinzel font-bold gold-text">Worship Mode</h1>
              <p className="text-cream/60 mt-1">Live audio transcription and dynamic lyric projection.</p>
            </div>
            <button onClick={() => setShowLibrary(!showLibrary)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all border ${showLibrary ? 'bg-gold/20 border-gold text-gold-light' : 'bg-dark border-forest/30 text-cream/70 hover:text-white'}`}>
              <FolderOpen className="w-4 h-4" /> Song Library ({library.length})
            </button>
          </header>

          {showLibrary && (
            <div className="glass-card mb-8 p-6 rounded-2xl border border-gold/30 animate-fade-in grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {library.map(song => (
                <div key={song.id} className="bg-dark border border-forest/20 p-4 rounded-xl hover:border-gold/50 cursor-pointer transition-all" onClick={() => { setSongTitle(song.title); setMasterText(song.lyrics?.[0] || ''); setShowLibrary(false) }}>
                  <h3 className="font-bold text-cream truncate">{song.title}</h3>
                  <span className="text-[10px] uppercase text-gold-light mt-1 block">Saved Song</span>
                </div>
              ))}
              {library.length === 0 && <p className="text-sm text-cream/50 col-span-full">No songs saved yet. Type below and hit Save!</p>}
            </div>
          )}

          <AudioEngine mode="worship" onTranscript={handleTranscript} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Editor Panel */}
            <div className="glass-card rounded-2xl p-6 border border-gold/20 flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-dark/50 border border-forest/30 rounded-lg px-3 py-1">
                  <Edit2 className="w-4 h-4 text-forest-light shrink-0" />
                  <input value={songTitle} onChange={e => setSongTitle(e.target.value)} placeholder="Song Title..." className="bg-transparent border-none text-cream focus:outline-none w-full text-sm font-bold" />
                </div>
                <button onClick={saveToLibrary} className="bg-forest border border-forest-light/30 hover:brightness-110 text-white p-2 rounded-lg" title="Save to Library"><Save className="w-4 h-4" /></button>
              </div>

              <div className="flex-1 flex flex-col gap-4">
                <p className="text-xs text-cream/40 uppercase tracking-widest font-bold">Paste Lyrics (Auto-splits every 3 lines)</p>
                <textarea
                  value={masterText}
                  onChange={e => setMasterText(e.target.value)}
                  placeholder="Paste your worship lyrics here..."
                  className="w-full flex-1 min-h-[250px] bg-dark/50 border border-forest/20 rounded-lg p-4 text-sm text-cream focus:outline-none focus:border-gold-light transition-colors resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Live Output Status */}
            <div className="space-y-6 flex flex-col">
              <div className="glass-card rounded-2xl p-6 border border-forest/30 flex flex-col gap-4 max-h-[500px]">
                <div className="flex items-center justify-between z-10 shrink-0">
                  <h3 className="font-cinzel text-lg font-bold text-cream">Verse Queue</h3>
                  <span className="text-xs font-bold text-forest-light bg-forest/10 px-3 py-1 rounded-full border border-forest/20">
                    {verses.length} Total Elements
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 relative pointer-events-auto">
                  {verses.length > 0 ? verses.map((verseLines, idx) => {
                    const isLive = idx === currentVerseIndex
                    return (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation()
                          setCurrentVerseIndex(idx)
                          // Automatically push when clicked
                          fetch('/api/control', {
                            method: 'POST',
                            body: JSON.stringify({ action: 'setLyrics', lines: verseLines, section: `Verse ${idx + 1}` })
                          })
                        }}
                        className={`w-full text-left p-4 rounded-xl border transition-all pointer-events-auto ${isLive
                            ? 'bg-cream/10 border-cream/50 shadow-[0_0_15px_rgba(242,236,225,0.1)] scale-[1.02]'
                            : 'bg-dark/40 border-forest/30 hover:border-gold/50 hover:bg-dark/60 opacity-60 hover:opacity-100'
                          }`}
                      >
                        <div className="flex justify-between items-start mb-2 pointer-events-none">
                          <span className={`text-[10px] uppercase tracking-widest font-bold ${isLive ? 'text-gold' : 'text-cream/40'}`}>Verse {idx + 1}</span>
                          {isLive && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 rounded-full border border-red-500/30 animate-pulse">LIVE</span>}
                        </div>
                        <div className="space-y-1 pointer-events-none">
                          {verseLines.map((line, i) => (
                            <p key={i} className={`text-sm ${isLive ? 'text-cream font-bold' : 'text-cream/70'}`}>{line}</p>
                          ))}
                        </div>
                      </button>
                    )
                  }) : <div className="h-full flex items-center justify-center"><p className="text-cream/30 italic text-sm">Paste lyrics to generate dynamic verse blocks...</p></div>}
                </div>

                <div className="pt-4 border-t border-forest/20 shrink-0 z-10 flex gap-2">
                  <button
                    onClick={() => {
                      const prev = Math.max(0, currentVerseIndex - 1)
                      setCurrentVerseIndex(prev)
                      fetch('/api/control', { method: 'POST', body: JSON.stringify({ action: 'setLyrics', lines: verses[prev], section: `Verse ${prev + 1}` }) })
                    }}
                    disabled={currentVerseIndex === 0 || verses.length === 0}
                    className="flex-1 py-3 bg-dark/50 hover:bg-forest/20 border border-forest/30 transition-colors rounded-lg text-cream flex justify-center items-center gap-2 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-5 h-5" /> Back
                  </button>
                  <button
                    onClick={() => {
                      const nxt = Math.min(verses.length - 1, currentVerseIndex + 1)
                      setCurrentVerseIndex(nxt)
                      fetch('/api/control', { method: 'POST', body: JSON.stringify({ action: 'setLyrics', lines: verses[nxt], section: `Verse ${nxt + 1}` }) })
                    }}
                    disabled={currentVerseIndex === verses.length - 1 || verses.length === 0}
                    className="flex-[2] py-3 bg-cream hover:bg-white text-forest-dark border border-cream transition-colors rounded-lg font-bold flex justify-center items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Next Verse <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-forest/30 flex-1 flex flex-col items-center">
                <h3 className="font-cinzel text-lg font-bold text-cream mb-4 w-full text-left">Live Projector Preview</h3>
                <div className="w-full bg-black rounded-lg min-h-[300px] flex flex-col items-center justify-center p-4 border border-dark relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-forest-dark/30 to-black pointer-events-none"></div>
                  {globalState.mode === 'worship' ? (
                    <>
                      <div className="text-[10px] text-gold-light border border-gold/30 px-2 rounded-full mb-2 z-10 uppercase tracking-widest">{globalState.lyricSection}</div>
                      <div className="text-center z-10 text-cream/90 font-bold leading-tight space-y-1">
                        {globalState.lyricLines.map((l, i) => <p key={i} className="text-lg md:text-xl">{l}</p>)}
                      </div>
                    </>
                  ) : <span className="text-xs text-cream/30 uppercase tracking-widest z-10 relative">({globalState.mode} mode active)</span>}
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
