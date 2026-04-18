'use client'
import { useState, useRef, useEffect } from 'react'
import { Sidebar } from '@/components/Sidebar'

import { AudioEngine } from '@/components/AudioEngine'
import { ChatWidget } from '@/components/ChatWidget'
import { FileText, Download, CheckCircle2, FileDown } from 'lucide-react'

export default function SermonPage() {
  const [globalMode, setGlobalMode] = useState('idle')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [generating, setGenerating] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [pendingAudioBlob, setPendingAudioBlob] = useState<Blob | null>(null)
  
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/control').then(r => r.json()).then(d => setGlobalMode(d.mode))
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript, interimTranscript])

  const handleTranscript = (text: string, isFinal?: boolean) => {
    if (isFinal) {
      setTranscript(prev => prev + ' ' + text + '.')
      setInterimTranscript('')
    } else {
      setInterimTranscript(text)
    }
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
          <header className="mb-6">
            <h1 className="text-3xl font-cinzel font-bold gold-text">Sermon Mode</h1>
            <p className="text-cream/60 mt-1">Live transcription and AI-powered sermon synthesis.</p>
          </header>

          <AudioEngine mode="sermon" onTranscript={handleTranscript} onRecordingComplete={setPendingAudioBlob} />

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
            {/* Live Transcript Log */}
            <div className="lg:col-span-2 glass-card rounded-2xl flex flex-col border border-forest/30 overflow-hidden">
              <div className="p-4 border-b border-forest/30 bg-forest-dark/30 flex justify-between items-center">
                <h2 className="font-cinzel text-lg font-bold text-cream flex items-center gap-2">
                  <FileText className="w-5 h-5 text-forest-light" /> Live Transcript
                </h2>
                {transcript && <div className="text-xs text-cream/50 uppercase tracking-widest">{transcript.split(' ').length} words</div>}
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

            {/* Smart Summary Panel */}
            <div className="glass-card rounded-2xl flex flex-col border border-gold/20 overflow-hidden relative">
              <div className="p-4 border-b border-gold/20 bg-dark-card flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border border-gold flex items-center justify-center bg-gold/10">
                  <img src="/logo.png" className="w-5 h-5" alt=""/>
                </div>
                <h2 className="font-cinzel font-bold text-gold-light">Theo Summary Engine</h2>
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
