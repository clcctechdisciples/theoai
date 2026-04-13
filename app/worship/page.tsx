'use client'
import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { ModeBar } from '@/components/ModeBar'
import { AudioEngine } from '@/components/AudioEngine'
import { ChatWidget } from '@/components/ChatWidget'
import { detectScripture } from '@/lib/scriptureDetector'
import { Check, Edit2 } from 'lucide-react'

export default function WorshipPage() {
  const [globalState, setGlobalState] = useState({ mode: 'idle', lyricLines: [] as string[], lyricSection: '' })
  const [localLines, setLocalLines] = useState<string[]>(['', '', ''])
  const [section, setSection] = useState('Verse 1')
  const [scriptureRef, setScriptureRef] = useState<string | null>(null)

  // Poll state just to keep local UI synced with what's actually on the projector
  useEffect(() => {
    const int = setInterval(async () => {
      try {
        const r = await fetch('/api/control'); const d = await r.json()
        setGlobalState(d)
      } catch(e) {}
    }, 2000)
    return () => clearInterval(int)
  }, [])

  // Send local editor state to Projector
  const pushToProjector = async () => {
    await fetch('/api/control', {
      method: 'POST',
      body: JSON.stringify({ action: 'setLyrics', lines: localLines.filter(l => l.trim().length > 0), section })
    })
  }

  // Handle live transcription
  const handleTranscript = async (text: string) => {
    // 1. Detect scriptures automatically
    const refMatch = detectScripture(text)
    if (refMatch) {
      setScriptureRef(refMatch)
      // Auto fetch and push
      try {
        const bRes = await fetch(`/api/bible?ref=${encodeURIComponent(refMatch)}`)
        const bData = await bRes.json()
        if (!bData.error) {
          await fetch('/api/control', {
            method: 'POST',
            body: JSON.stringify({ action: 'setScripture', scripture: bData })
          })
          setScriptureRef(`${refMatch} (Displayed)`)
        }
      } catch (e) {}
    }

    // 2. Format lyrics via OpenRouter (Mocked with simple logic here to save API limits on every mic chunk)
    // In production, we'd batch chunks and send to LLM to structure into verses.
    // For now, we just push the raw text to the local editor.
    const newLines = [text.substring(0, 30), text.substring(30, 60), text.substring(60)]
    setLocalLines(newLines)
    
    // Auto push to projector without intervention
    try {
      await fetch('/api/control', {
        method: 'POST',
        body: JSON.stringify({ action: 'setLyrics', lines: newLines.filter(l => l.trim().length > 0), section })
      })
    } catch(e) {}
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModeBar currentMode={globalState.mode} />
        
        <main className="flex-1 overflow-y-auto p-8 relative">
          <header className="mb-8">
            <h1 className="text-3xl font-cinzel font-bold gold-text">Worship Mode</h1>
            <p className="text-cream/60 mt-1">Live audio transcription and dynamic lyric projection.</p>
          </header>

          <AudioEngine mode="worship" onTranscript={handleTranscript} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Editor Panel */}
            <div className="glass-card rounded-2xl p-6 border border-gold/20 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-cinzel text-xl font-bold text-cream flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-forest-light" /> Lyric Editor
                </h2>
                <select 
                  value={section} 
                  onChange={e => setSection(e.target.value)}
                  className="bg-dark/80 border border-forest/30 text-gold-light font-cinzel font-bold rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-gold"
                >
                  <option>Verse 1</option><option>Verse 2</option><option>Chorus</option>
                  <option>Bridge</option><option>Pre-Chorus</option><option>Vamp</option>
                </select>
              </div>

              <div className="space-y-4 flex-1">
                {localLines.map((line, i) => (
                  <input
                    key={i}
                    value={line}
                    onChange={(e) => {
                      const newArr = [...localLines]
                      newArr[i] = e.target.value
                      setLocalLines(newArr)
                    }}
                    placeholder={`Line ${i+1}`}
                    className="w-full bg-dark/50 border border-forest/20 rounded-lg px-4 py-3 text-lg text-cream focus:outline-none focus:border-gold-light focus:bg-dark transition-colors"
                  />
                ))}
              </div>

              <button 
                onClick={pushToProjector}
                className="mt-6 w-full forest-gradient text-cream font-bold py-3 rounded-xl shadow-lg border border-forest-light/30 hover:brightness-110 focus:ring-2 focus:ring-gold/50 flex justify-center items-center gap-2 transition-all"
              >
                <MonitorIcon /> Push to Projector
              </button>
            </div>

            {/* Live Scripture / Output Status */}
            <div className="space-y-6">
              <div className="glass-card rounded-2xl p-6 border border-forest/30">
                <h3 className="font-cinzel text-lg font-bold text-cream mb-4">Auto-Scripture Detection</h3>
                {scriptureRef ? (
                  <div className="bg-forest-dark border border-gold/30 rounded-lg p-4 animate-fade-in flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                      <Check className="w-5 h-5 text-gold-light" />
                    </div>
                    <div>
                      <p className="font-bold text-cream">Reference Detected</p>
                      <p className="text-gold font-cinzel text-xl mt-1">{scriptureRef}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-cream/40 px-2 py-4">
                    <div className="w-2 h-2 rounded-full bg-forest-light animate-pulse" />
                    <span className="text-sm">Listening for biblical references...</span>
                  </div>
                )}
              </div>

              <div className="glass-card rounded-2xl p-6 border border-forest/30 flex-1">
                <h3 className="font-cinzel text-lg font-bold text-cream mb-4">Live Projector Preview</h3>
                <div className="bg-black rounded-lg aspect-video flex flex-col items-center justify-center p-4 border border-dark relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-forest-dark/30 to-black pointer-events-none"></div>
                  {globalState.mode === 'worship' ? (
                    <>
                      <div className="text-[10px] text-gold-light border border-gold/30 px-2 rounded-full mb-2 z-10 uppercase tracking-widest">{globalState.lyricSection}</div>
                      <div className="text-center z-10 text-cream/90 font-bold leading-tight space-y-1">
                        {globalState.lyricLines.map((l, i) => <p key={i} className="text-sm">{l}</p>)}
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

function MonitorIcon() {
  return (
    <svg xmlns="http://www.-w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
  )
}
