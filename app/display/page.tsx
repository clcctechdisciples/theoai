'use client'
import { useEffect, useState } from 'react'
import { Monitor, Maximize } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'

type State = {
  mode: string
  scripture: { reference: string, text: string } | null
  lyricLines: string[]
  lyricSection: string
  backgroundUrl: string | null
}

export default function DisplayPage() {
  const [state, setState] = useState<State>({ mode: 'idle', scripture: null, lyricLines: [], lyricSection: '', backgroundUrl: null })
  const [screens, setScreens] = useState<any[]>([])
  const [uiVisible, setUiVisible] = useState(true)

  useEffect(() => {
    // Poll the control server every 1 second
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/control')
        const data = await res.json()
        setState(data)
      } catch (e) {
        // ignore errors on display
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let timeout: NodeJS.Timeout
    const hideUi = () => setUiVisible(false)
    const showUi = () => {
      setUiVisible(true)
      clearTimeout(timeout)
      timeout = setTimeout(hideUi, 3000)
    }
    
    window.addEventListener('mousemove', showUi)
    timeout = setTimeout(hideUi, 3000)
    
    return () => {
      window.removeEventListener('mousemove', showUi)
      clearTimeout(timeout)
    }
  }, [])

  const requestScreens = async () => {
    if (!('getScreenDetails' in window)) {
      alert("Window Management API not supported in this browser.")
      return
    }
    try {
      const details = await (window as any).getScreenDetails()
      setScreens(details.screens)
      
      details.addEventListener('screenschange', () => {
        setScreens(details.screens)
      })
    } catch(e) {
      console.error(e)
      alert("Permission denied to access connected displays.")
    }
  }

  const goFullscreenOn = async (screen: any) => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
      await (document.documentElement as any).requestFullscreen({ screen } as any)
    } catch(err) {
      console.error("Error attempting to enable fullscreen:", err)
      alert("Browser prevented fullscreen on the selected display.")
    }
  }

  const pushMode = async (mode: string) => {
    try {
      await fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setMode', mode })
      })
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden text-white font-inter group">
      <div className="flex-1 relative bg-black flex flex-col justify-center items-center overflow-hidden cursor-none">
        
        {/* Invisible hover area to restore cursor in dev */}
        <div className="absolute inset-0 hover:cursor-default z-[100] pointer-events-none"></div>

      {/* Control overlay */}
      <div className={`absolute top-4 right-4 z-[999] transition-all duration-500 flex flex-col items-end gap-3 pointer-events-auto ${uiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        
        {/* Projector Mode Quick-Switcher (The "Projector Section") */}
        <div className="flex bg-black/40 backdrop-blur-xl border border-cream/10 p-1 rounded-xl gap-1 shadow-2xl mb-2">
           {['idle', 'worship', 'sermon'].map(m => (
             <button
               key={m}
               onClick={() => pushMode(m)}
               className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                 state.mode === m 
                 ? 'bg-cream text-forest-950 shadow-lg scale-105' 
                 : 'text-cream/40 hover:text-cream hover:bg-white/5'
               }`}
             >
               {m}
             </button>
           ))}
        </div>

        <button 
          onClick={requestScreens}
          className="bg-black/50 backdrop-blur-md border border-cream/10 hover:bg-cream/10 text-cream/50 hover:text-cream px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
        >
          <Monitor className="w-4 h-4 text-cream" /> Detect Displays
        </button>

        {screens.length > 0 && screens.map((screen, i) => (
          <button 
            key={screen.id || i}
            onClick={() => goFullscreenOn(screen)}
            className="bg-cream/5 backdrop-blur-md border border-cream/20 hover:bg-cream/10 text-cream/80 hover:text-cream px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-2xl"
          >
            <Maximize className="w-3 h-3 text-cream" /> Fullscreen on {screen.label || `Display ${i + 1}`}
          </button>
        ))}
      </div>

      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        {state.backgroundUrl ? (
          <div 
            className="w-full h-full bg-cover bg-center transition-all duration-1000"
            style={{ backgroundImage: `url(${state.backgroundUrl})` }}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
          </div>
        ) : (
          <div className="w-full h-full bg-black">
            <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
              {/* Forest Green Radial glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#047361_0%,_transparent_70%)] opacity-20"></div>
              {/* Modern subtle rays in forest/cream */}
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="absolute w-[1px] h-[150%] bg-forest-500/20 rotate-45 blur-sm"></div>
                <div className="absolute w-[1px] h-[150%] bg-forest-500/20 -rotate-45 blur-sm"></div>
              </div>
            </div>
          </div>
        )}
        {/* Global vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.6)_100%)]"></div>
      </div>

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-12 md:px-32 text-center">
        
        {state.mode === 'idle' && !state.backgroundUrl && (
          <div className="animate-fade-in">
             <h1 className="text-8xl font-cinzel font-black tracking-tighter text-white/90 drop-shadow-2xl">THEO AI</h1>
             <div className="h-1 w-24 bg-cream/50 mx-auto mt-6 rounded-full shadow-[0_0_20px_rgba(242,236,225,0.3)]"></div>
          </div>
        )}

        {state.mode === 'scripture' && state.scripture && (
          <div className="scripture-reveal w-full space-y-12">
            <p className="font-bold text-5xl md:text-7xl lg:text-8xl leading-[1.15] text-white drop-shadow-[0_8px_32px_rgba(0,0,0,0.9)]">
              {state.scripture.text}
            </p>
            <div className="flex items-center justify-center gap-6">
              <div className="h-[2px] w-12 bg-cream/30"></div>
              <h2 className="font-cinzel font-black text-3xl md:text-5xl text-cream drop-shadow-lg uppercase tracking-widest">
                {state.scripture.reference}
              </h2>
              <div className="h-[2px] w-12 bg-cream/30"></div>
            </div>
          </div>
        )}

        {state.mode === 'worship' && state.lyricLines.length > 0 && (
          <div className="w-full max-w-7xl animate-fade-in flex flex-col justify-center h-full pt-12">
            {state.lyricSection && (
              <div className="bg-cream/10 backdrop-blur-md text-cream border border-cream/20 rounded-xl px-8 py-2 text-sm font-black tracking-[0.3em] uppercase mb-16 self-center animate-slide-up shadow-2xl">
                {state.lyricSection}
              </div>
            )}
            
            <div className="space-y-6 md:space-y-12 flex flex-col items-center">
              {state.lyricLines.map((line, i) => (
                <p 
                  key={i} 
                  className="lyric-line font-black text-6xl md:text-8xl lg:text-9xl leading-none text-white text-center drop-shadow-[0_10px_40px_rgba(0,0,0,1)] tracking-tight"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
