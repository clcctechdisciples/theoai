'use client'
import { useEffect, useState } from 'react'

type State = {
  mode: string
  scripture: { reference: string, text: string } | null
  lyricLines: string[]
  lyricSection: string
  backgroundUrl: string | null
}

export default function DisplayPage() {
  const [state, setState] = useState<State>({ mode: 'idle', scripture: null, lyricLines: [], lyricSection: '', backgroundUrl: null })

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

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden flex flex-col justify-center items-center font-inter">
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
            {state.mode === 'idle' && (
              <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e3a8a_0%,_transparent_70%)] opacity-20"></div>
                {/* Modern subtle rays */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute w-[1px] h-[150%] bg-blue-500/20 rotate-45 blur-sm"></div>
                  <div className="absolute w-[1px] h-[150%] bg-blue-500/20 -rotate-45 blur-sm"></div>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Global vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]"></div>
      </div>

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-12 md:px-32 text-center">
        
        {state.mode === 'idle' && !state.backgroundUrl && (
          <div className="animate-fade-in">
             <h1 className="text-8xl font-cinzel font-black tracking-tighter text-white/90 drop-shadow-2xl">THEO AI</h1>
             <div className="h-1 w-24 bg-blue-500 mx-auto mt-6 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)]"></div>
          </div>
        )}

        {state.mode === 'scripture' && state.scripture && (
          <div className="scripture-reveal w-full space-y-12">
            <p className="font-bold text-5xl md:text-7xl lg:text-8xl leading-[1.15] text-white drop-shadow-[0_8px_32px_rgba(0,0,0,0.9)]">
              {state.scripture.text}
            </p>
            <div className="flex items-center justify-center gap-6">
              <div className="h-[2px] w-12 bg-blue-500/50"></div>
              <h2 className="font-cinzel font-black text-3xl md:text-5xl text-blue-400 drop-shadow-lg uppercase tracking-widest">
                {state.scripture.reference}
              </h2>
              <div className="h-[2px] w-12 bg-blue-500/50"></div>
            </div>
          </div>
        )}

        {state.mode === 'worship' && state.lyricLines.length > 0 && (
          <div className="w-full max-w-7xl animate-fade-in flex flex-col justify-center h-full pt-12">
            {state.lyricSection && (
              <div className="bg-blue-600/20 backdrop-blur-md text-blue-400 border border-blue-500/30 rounded-xl px-8 py-2 text-sm font-black tracking-[0.3em] uppercase mb-16 self-center animate-slide-up shadow-2xl">
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
  )
}
