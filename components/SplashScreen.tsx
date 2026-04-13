'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'

export function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setFading(true), 2200)
    const hide = setTimeout(() => setVisible(false), 2900)
    return () => { clearTimeout(timer); clearTimeout(hide) }
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(160deg, #0F1A0E 0%, #1A3A15 50%, #0F1A0E 100%)',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.7s ease-in-out',
      }}
    >
      {/* Animated background rays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 origin-bottom"
            style={{
              width: '2px',
              height: '50vh',
              background: 'linear-gradient(to top, transparent, rgba(201,168,76,0.15))',
              transform: `translateX(-50%) translateY(-100%) rotate(${i * 45}deg)`,
              animation: `rayPulse ${2 + i * 0.3}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* Gold ring */}
      <div className="relative mb-8">
        <div
          className="absolute inset-0 rounded-full border-2 border-gold opacity-30 animate-spin-slow"
          style={{ width: '160px', height: '160px', margin: '-10px' }}
        />
        <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-gold/50 shadow-2xl glow-gold animate-float">
          <Image
            src="/logo.png"
            alt="CLCC Logo"
            width={144}
            height={144}
            className="w-full h-full object-contain bg-forest-dark p-2"
            priority
          />
        </div>
      </div>

      {/* Title */}
      <h1
        className="font-cinzel text-5xl font-black tracking-wider mb-2"
        style={{
          background: 'linear-gradient(135deg, #E8C86A, #C9A84C, #E8C86A)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'fadeIn 0.8s ease-in-out 0.3s both',
        }}
      >
        Theo AI
      </h1>

      <p
        className="text-forest-light font-cinzel text-lg font-semibold tracking-[0.2em] uppercase mb-4"
        style={{ animation: 'fadeIn 0.8s ease-in-out 0.6s both' }}
      >
        CLCC Tech Disciples
      </p>

      <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold to-transparent mb-4" />

      <p
        className="text-cream/60 font-inter text-sm tracking-wide text-center max-w-xs"
        style={{ animation: 'fadeIn 0.8s ease-in-out 0.9s both' }}
      >
        Spreading God&apos;s Love Through Intelligent Worship
      </p>

      {/* Loading dots */}
      <div className="flex gap-2 mt-10">
        {[0, 1, 2].map(i => (
          <div key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  )
}
