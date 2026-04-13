'use client'
import { useState, useRef, useEffect } from 'react'
import { Mic, Square, AlertCircle } from 'lucide-react'

// Inform TypeScript about window.SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function AudioEngine({ mode, onTranscript }: { mode: 'worship' | 'sermon', onTranscript: (text: string) => void }) {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState('')
  const recognitionRef = useRef<any>(null)
  const intendedToRecordRef = useRef(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const sessionIdRef = useRef('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        setError('Speech Recognition not supported in this browser. Please use Chrome/Edge.')
        return
      }

      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = false 
      recognition.lang = 'en-US'
      
      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const text = event.results[i][0].transcript.trim()
            if (text) onTranscript(text)
          }
        }
      }
      
      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setIsRecording(false)
          intendedToRecordRef.current = false
          setError('Microphone permission denied.')
        }
      }
      
      recognition.onend = () => {
        if (intendedToRecordRef.current) {
          try { recognition.start() } catch(e) {}
        }
      }
      
      recognitionRef.current = recognition
    }
  }, [onTranscript]) 

  const toggleRecording = async () => {
    if (error) { alert(error); return }
    if (!recognitionRef.current) return
    
    if (isRecording) {
      intendedToRecordRef.current = false
      recognitionRef.current.stop()
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop()
      setIsRecording(false)
    } else {
      try {
         // Start Audio Archiving to backend
         const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
         sessionIdRef.current = Math.random().toString(36).substring(7)
         
         const mr = new MediaRecorder(stream)
         mr.ondataavailable = async (e) => {
           if (e.data.size > 0 && intendedToRecordRef.current) {
             const formData = new FormData()
             formData.append('audio', e.data)
             formData.append('sessionId', sessionIdRef.current)
             formData.append('mode', mode)
             try { await fetch('/api/recordings/upload', { method: 'POST', body: formData }) } catch(e) {}
           }
         }
         mr.start(5000) // send every 5 seconds
         mediaRecorderRef.current = mr

         intendedToRecordRef.current = true
         recognitionRef.current.start()
         setIsRecording(true)
      } catch(e) {
         setIsRecording(true)
      }
    }
  }

  return (
    <div className="glass-card p-4 flex items-center gap-4 rounded-xl mb-6 border border-forest/30">
      <div className="flex-1">
        <label className="text-xs text-cream/70 uppercase tracking-wider block mb-1">Audio Input Mode</label>
        {error ? (
          <div className="text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4"/> {error}</div>
        ) : (
          <div className="text-forest-light text-sm font-medium">Native Browser STT Active</div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {isRecording && <div className="text-red-400 text-xs font-bold uppercase record-pulse flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /> LIVE RECOGNITION</div>}
        <button
          onClick={toggleRecording}
          disabled={!!error}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all ${
            isRecording 
            ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
            : 'forest-gradient text-cream hover:brightness-110 shadow-[0_0_20px_rgba(74,124,89,0.4)] disabled:opacity-50'
          }`}
        >
          {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
          {isRecording ? 'Stop' : 'Engage Audio Engine'}
        </button>
      </div>
    </div>
  )
}
