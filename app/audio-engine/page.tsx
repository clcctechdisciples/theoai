'use client'
import { useState, useRef, useEffect } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Mic, Activity, CheckCircle2, AlertCircle } from 'lucide-react'

export default function AudioEnginePage() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('default')
  const [isTesting, setIsTesting] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    // Load saved device
    const saved = localStorage.getItem('theoai_mic_device')
    if (saved) setSelectedDeviceId(saved)

    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
        navigator.mediaDevices.enumerateDevices().then(d => {
          setDevices(d.filter(device => device.kind === 'audioinput'))
        }).catch(console.error)
      }).catch(console.error)
    }
  }, [])

  const handleDeviceSelect = (id: string) => {
    setSelectedDeviceId(id)
    localStorage.setItem('theoai_mic_device', id)
    if (isTesting) stopTest() // Stop test if device changes so user re-evaluates
  }

  const startTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: selectedDeviceId !== 'default' ? { deviceId: { exact: selectedDeviceId } } : true 
      })
      streamRef.current = stream
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioCtx
      
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 512
      analyserRef.current = analyser
      
      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)
      sourceRef.current = source
      
      setIsTesting(true)
      drawWaveform()
    } catch (e) {
      alert("Microphone permission denied or device error.")
    }
  }

  const stopTest = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    if (sourceRef.current) { sourceRef.current.disconnect(); sourceRef.current = null }
    if (analyserRef.current) analyserRef.current = null
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    
    // Clear canvas
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    setIsTesting(false)
  }

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    
    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    const draw = () => {
      if (!analyserRef.current) return
      analyserRef.current.getByteTimeDomainData(dataArray)
      requestAnimationFrame(draw)
      
      ctx.fillStyle = '#011410' // Match dark-bg
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      ctx.lineWidth = 2
      ctx.strokeStyle = '#ceb382' // Gold
      ctx.beginPath()
      
      const sliceWidth = canvas.width * 1.0 / bufferLength
      let x = 0
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = v * canvas.height / 2
        
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
        x += sliceWidth
      }
      
      ctx.lineTo(canvas.width, canvas.height / 2)
      ctx.stroke()
    }
    
    draw()
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTest()
    }
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto bg-dark-bg p-8 items-center">
        <header className="mb-8 w-full max-w-4xl">
          <h1 className="text-3xl font-cinzel font-bold text-cream flex items-center gap-3">
            <Activity className="w-8 h-8 text-gold" /> Global Audio Engine
          </h1>
          <p className="text-cream/60 mt-2">Manage backend microphone routing and trace Adobe Audition-style tracking visualizations.</p>
        </header>

        <div className="w-full max-w-4xl space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-cream/20 bg-forest-dark/30">
            <h2 className="font-cinzel text-xl font-bold text-cream mb-4">Input Selection</h2>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[250px]">
                <label className="text-xs uppercase tracking-widest text-cream/40 font-bold mb-2 block">Hardware Mic Source (e.g. Behringer)</label>
                <select 
                  value={selectedDeviceId}
                  onChange={e => handleDeviceSelect(e.target.value)}
                  className="w-full bg-dark/50 border border-cream/20 text-cream rounded-lg p-3 focus:outline-none focus:border-gold-light transition-colors"
                >
                  <option value="default">Default System Microphone</option>
                  {devices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId.substring(0,5)}`}</option>
                  ))}
                </select>
              </div>

              <div className="pt-6">
                <button 
                  onClick={isTesting ? stopTest : startTest}
                  className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg ${
                    isTesting 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30' 
                      : 'bg-forest/30 border border-gold/40 text-cream hover:bg-forest/50 hover:border-gold/70'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                  {isTesting ? 'Stop Visualizer' : 'Test Audio Feed'}
                </button>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-gold-light">
               <CheckCircle2 className="w-4 h-4"/> 
               <span>Selected microphone will be globally inherited by Sermon AI Transcriber.</span>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-cream/20 bg-forest-dark/30">
            <h2 className="font-cinzel text-xl font-bold text-cream mb-4">Live Frequency Monitor</h2>
            <div className="bg-dark border border-forest/30 rounded-xl overflow-hidden relative">
               {!isTesting && (
                 <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                   <p className="text-cream/50 tracking-widest uppercase font-bold text-sm tracking-[0.2em] animate-pulse">Monitor Inactive</p>
                 </div>
               )}
               <canvas ref={canvasRef} width={850} height={250} className="w-full h-[250px] object-cover" />
               <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(1,20,16,0.6)_100%)]"></div>
               {/* Vertical grid lines for Audition style */}
               <div className="absolute inset-0 pointer-events-none opacity-10 flex border-t border-b border-gold object-cover">
                  {[...Array(10)].map((_, i) => <div key={i} className="h-full border-r border-gold/50 flex-1"></div>)}
               </div>
               <div className="absolute inset-x-0 top-1/2 h-0 border-t border-red-500/30 opacity-50 pointer-events-none"></div>
            </div>
            
            <p className="text-xs text-cream/40 mt-3 text-center uppercase tracking-wider">Zero-Latency Visual Engine</p>
          </div>
        </div>
      </div>
    </div>
  )
}
