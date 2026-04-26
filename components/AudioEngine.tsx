'use client'
import { useState, useRef, useEffect } from 'react'
import { Mic, Square, AlertCircle, Settings2 } from 'lucide-react'

// Inform TypeScript about window.SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function AudioEngine({ mode, onTranscript, onRecordingComplete }: { mode: 'worship' | 'sermon', onTranscript: (text: string, isFinal?: boolean) => void, onRecordingComplete?: (blob: Blob) => void }) {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState('')
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('default')
  
  const recognitionRef = useRef<any>(null)
  const intendedToRecordRef = useRef(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const sessionIdRef = useRef('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (audioContextRef.current) audioContextRef.current.close()
    }
  }, [])

  const startVisualizer = (stream: MediaStream) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    
    audioContextRef.current = audioContext
    analyserRef.current = analyser

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const barWidth = (canvas.width / bufferLength) * 2.5
      let barHeight
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height
        ctx.fillStyle = `rgba(201, 168, 76, ${dataArray[i] / 255 + 0.2})`
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
        x += barWidth + 1
      }
    }
    draw()
  }

  const stopVisualizer = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    if (audioContextRef.current) audioContextRef.current.close()
  }

  useEffect(() => {
    const saved = localStorage.getItem('theoai_mic_device')
    if (saved) setSelectedDeviceId(saved)

    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
        navigator.mediaDevices.enumerateDevices().then(d => {
          setDevices(d.filter(device => device.kind === 'audioinput'))
        }).catch(() => {})
      }).catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        setError('Speech Recognition not supported in this browser. Please use Chrome/Edge.')
        return
      }

      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true 
      recognition.lang = 'en-US'
      
      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript.trim()
          if (text) {
            onTranscript(text, event.results[i].isFinal)
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
      stopVisualizer()
      setIsRecording(false)
    } else {
      try {
         const stream = await navigator.mediaDevices.getUserMedia({ 
           audio: selectedDeviceId !== 'default' ? { deviceId: { exact: selectedDeviceId } } : true 
         })
         
         sessionIdRef.current = Math.random().toString(36).substring(7)
         startVisualizer(stream)

         const mr = new MediaRecorder(stream)
         let localChunks: Blob[] = []
         
         mr.ondataavailable = async (e) => {
           if (e.data.size > 0 && intendedToRecordRef.current && mode === 'sermon') {
             localChunks.push(e.data)
             const formData = new FormData()
             formData.append('audio', e.data)
             formData.append('sessionId', sessionIdRef.current)
             formData.append('mode', mode)
             try { await fetch('/api/recordings/upload', { method: 'POST', body: formData }) } catch(e) {}
           }
         }
         mr.onstop = () => {
           if (mode === 'sermon' && localChunks.length > 0) {
             const finalBlob = new Blob(localChunks, { type: 'audio/webm' })
             if (onRecordingComplete) onRecordingComplete(finalBlob)
             localChunks = []
           }
         }
         mr.start(5000) 
         mediaRecorderRef.current = mr

         intendedToRecordRef.current = true
         recognitionRef.current.start()
         setIsRecording(true)
      } catch(e) {
         setError('Failed to access microphone: ' + (e as Error).message)
      }
    }
  }

  return (
    <div className="glass-card p-4 flex items-center gap-4 rounded-xl mb-6 border border-forest/30 flex-wrap overflow-hidden">
      <div className="flex-1 min-w-[150px]">
        <label className="text-xs text-cream/70 uppercase tracking-wider block mb-1">Audio Input Mode</label>
        {error ? (
          <div className="text-red-400 text-[10px] flex items-center gap-2 font-bold uppercase"><AlertCircle className="w-3 h-3"/> {error}</div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="text-forest-light text-xs font-black uppercase tracking-widest">Active</div>
            <canvas ref={canvasRef} width="120" height="20" className="opacity-60" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 bg-dark/50 border border-forest/20 rounded-lg pr-4 pl-3 py-1.5 min-w-[200px]">
        <Settings2 className="w-4 h-4 text-forest-light" />
        <select 
          value={selectedDeviceId}
          onChange={e => setSelectedDeviceId(e.target.value)}
          disabled={isRecording}
          className="bg-transparent border-none text-xs text-cream/80 focus:outline-none flex-1 truncate max-w-[200px]"
        >
          <option value="default" className="bg-dark text-cream">Default Microphone</option>
          {devices.map(d => (
            <option key={d.deviceId} value={d.deviceId} className="bg-dark text-cream">
              {d.label || `Mic ${d.deviceId.substring(0,5)}`}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        {isRecording && <div className="text-red-400 text-[10px] font-black uppercase record-pulse flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" /> Live</div>}
        <button
          onClick={toggleRecording}
          disabled={!!error}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${
            isRecording 
            ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
            : 'forest-gradient text-cream hover:brightness-110 shadow-lg disabled:opacity-50'
          }`}
        >
          {isRecording ? <Square className="w-3 h-3 fill-current" /> : <Mic className="w-3 h-3" />}
          {isRecording ? 'Stop' : 'Engage Engine'}
        </button>
      </div>
    </div>
  )
}
