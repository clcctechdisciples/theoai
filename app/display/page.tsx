'use client'
import { useEffect, useState } from 'react'

type State = {
  mode: string
  scripture: { reference: string, text: string } | null
  lyricLines: string[]
  lyricSection: string
}

export default function DisplayPage() {
  const [state, setState] = useState<State>({ mode: 'idle', scripture: null, lyricLines: [], lyricSection: '' })

  useEffect(() => {
    // Poll the control server every 1 second
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/control')
        const data = await res.json()
        // Simple distinct check to trigger re-renders
        setState(data)
      } catch (e) {
        // ignore errors on display
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden flex flex-col justify-center items-center">
      {/* Background depending on mode */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {state.mode === 'idle' && (
          <div className="w-full h-full flex items-center justify-center relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-forest-dark via-black to-black opacity-60"></div>
            {/* Animated cross/rays */}
            <div className="relative w-96 h-96 flex items-center justify-center">
              <div className="absolute w-[2px] h-full bg-gradient-to-b from-transparent via-gold to-transparent animate-pulse opacity-30 shadow-[0_0_50px_rgba(201,168,76,0.8)]"></div>
              <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent animate-pulse opacity-30 shadow-[0_0_50px_rgba(201,168,76,0.8)]" style={{ marginTop: '-40px' }}></div>
            </div>
            <div className="absolute bottom-12 text-center w-full">
              <h1 className="font-cinzel text-5xl font-bold tracking-widest text-gold opacity-80" style={{ textShadow: '0 4px 20px rgba(201,168,76,0.3)' }}>THEO AI</h1>
              <p className="font-inter text-xl tracking-[0.3em] uppercase text-forest-light mt-4 opacity-70">CLCC Tech Disciples</p>
            </div>
          </div>
        )}
        
        {state.mode !== 'idle' && (
          <div className="w-full h-full bg-black">
             {/* Subdued ambient background for active modes */}
             <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-forest-dark/20 to-transparent"></div>
          </div>
        )}
      </div>

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-12 pb-24 text-center px-4 md:px-24">
        
        {state.mode === 'scripture' && state.scripture && (
          <div className="scripture-reveal max-w-6xl w-full">
            <p className="font-inter font-medium text-4xl md:text-6xl leading-tight md:leading-normal mb-8 text-cream" style={{ textShadow: '0 4px 24px rgba(0,0,0,0.8)' }}>
              "{state.scripture.text}"
            </p>
            <h2 className="font-cinzel font-bold text-3xl md:text-5xl text-gold" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
              {state.scripture.reference}
            </h2>
          </div>
        )}

        {state.mode === 'worship' && state.lyricLines.length > 0 && (
          <div className="w-full max-w-7xl animate-fade-in flex flex-col justify-end h-full">
            {state.lyricSection && (
              <div className="bg-forest-dark/80 text-gold-light border border-gold/30 rounded-full px-6 py-2 text-xl font-cinzel font-bold tracking-widest uppercase mb-12 self-center animate-slide-up shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                {state.lyricSection}
              </div>
            )}
            
            <div className="space-y-4 md:space-y-8 flex flex-col items-center">
              {state.lyricLines.map((line, i) => (
                <p 
                  key={i} 
                  className="lyric-line font-inter font-bold text-5xl md:text-7xl lg:text-[5.5rem] leading-tight text-white/95 text-center drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] px-4"
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
