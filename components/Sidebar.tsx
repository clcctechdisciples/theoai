'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Music, MessageSquare, Settings, LogOut, UploadCloud, Monitor, Maximize, LayoutDashboard, History, MonitorPlay, ChevronDown } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Worship Engine', href: '/worship', icon: Music },
  { label: 'Sermon Engine', href: '/sermon', icon: MessageSquare },
  { label: 'Audio Engine', href: '/audio-engine', icon: Settings },
  { label: 'Audio Archive', href: '/audio', icon: History },
]

export function Sidebar() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [currentMode, setCurrentMode] = useState('idle')
  const [backgroundUrl, setBackgroundUrl] = useState('')
  const [projState, setProjState] = useState<any>({ mode: 'idle', lyricLines: [], scripture: null })
  const [backgrounds, setBackgrounds] = useState<{ id: string, url: string }[]>([])
  const [defaultBgId, setDefaultBgId] = useState<string | null>(null)
  const [screens, setScreens] = useState<any[]>([])
  const [showProjection, setShowProjection] = useState(true)
  const [activeScreenId, setActiveScreenId] = useState<string | null>(null)

  const { data: session } = useSession()

  useEffect(() => {
    fetch('/api/backgrounds').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setBackgrounds(d)
    }).catch(() => {})
    
    const defBg = localStorage.getItem('theoai_default_bg')
    if (defBg) setDefaultBgId(defBg)

    const int = setInterval(async () => {
      try {
        const res = await fetch('/api/control')
        const data = await res.json()
        setCurrentMode(data.mode)
        setBackgroundUrl(data.backgroundUrl || '')
        setProjState(data)
      } catch (e) {}
    }, 2000)
    return () => clearInterval(int)
  }, [])

  useEffect(() => {
    if (defaultBgId && !backgroundUrl) {
      const target = backgrounds.find(b => b.id === defaultBgId)
      if (target) handleSetBackground(target.url)
    }
  }, [defaultBgId, backgrounds])

  const setMode = async (mode: string) => {
    setLoading(true)
    setCurrentMode(mode)
    await fetch('/api/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setMode', mode })
    })
    setLoading(false)
  }

  const handleSetBackground = async (val: string) => {
    setLoading(true)
    try {
      await fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setBackground', url: val })
      })
      setBackgroundUrl(val)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const saveBgs = async (newBgs: any[]) => {
    setBackgrounds(newBgs)
    try {
      await fetch('/api/backgrounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBgs)
      })
    } catch (e) {}
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert('File too large. Use an image under 2MB.')
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const b64 = ev.target?.result as string
        const newBg = { id: Date.now().toString(), url: b64 }
        const updated = [...backgrounds, newBg]
        await saveBgs(updated)
        await handleSetBackground(b64)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeBackground = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const bg = backgrounds.find(b => b.id === id)
    const updated = backgrounds.filter(b => b.id !== id)
    await saveBgs(updated)
    if (defaultBgId === id) { setDefaultBgId(null); localStorage.removeItem('theoai_default_bg') }
    if (bg && backgroundUrl === bg.url) handleSetBackground('')
  }

  const toggleDefaultBg = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (defaultBgId === id) { setDefaultBgId(null); localStorage.removeItem('theoai_default_bg') }
    else { setDefaultBgId(id); localStorage.setItem('theoai_default_bg', id) }
  }

  const detectDisplays = async () => {
    if (!('getScreenDetails' in window)) return alert('Window Management API not supported. Use Chrome 100+ on desktop.')
    try {
      const details = await (window as any).getScreenDetails()
      setScreens([...details.screens])
      details.addEventListener('screenschange', () => setScreens([...details.screens]))
    } catch (e) { alert('Permission denied to access connected displays.') }
  }

  const projectOnScreen = (screen: any) => {
    setActiveScreenId(screen.id || screen.label || 'primary')
    // Open /display in a new window sized and positioned to exactly fill the target screen
    const w = window.open(
      '/display',
      `display_${screen.id || 0}`,
      `left=${screen.availLeft},top=${screen.availTop},width=${screen.availWidth},height=${screen.availHeight},menubar=no,toolbar=no,location=no,status=no`
    )
    if (w) {
      // After the window opens, attempt to fullscreen it
      setTimeout(() => {
        try { w.document.documentElement.requestFullscreen?.() } catch (e) {}
      }, 1000)
    }
  }

  return (
    <div className="w-64 h-full bg-dark-950 border-r border-forest-700/30 flex flex-col pt-8 shrink-0">
      {/* Logo & User */}
      <div className="px-8 mb-8 group cursor-default">
        <h2 className="font-cinzel text-2xl font-black tracking-tighter text-cream group-hover:text-gold transition-colors">THEO AI</h2>
        <div className="h-0.5 w-8 bg-gold/70 mt-1 transition-all group-hover:w-16" />
        {session?.user && (
          <p className="text-[10px] text-cream/30 uppercase font-black tracking-widest mt-2">Member: {session.user.name}</p>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-4">
        {/* Nav Links — all 5 */}
        {navItems.map(item => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-cream/10 border border-cream/15 text-cream'
                  : 'text-cream/40 hover:bg-white/5 hover:text-cream/80'
              }`}>
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-gold' : ''}`} />
                <span className="font-semibold text-sm tracking-tight">{item.label}</span>
              </div>
            </Link>
          )
        })}
        
        {/* ─── Backgrounds (Global) ─── */}
        <div className="pt-3 px-1 border-t border-forest-700/20 mt-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cream/30 flex items-center gap-2 mb-2 px-3">Backgrounds</label>
          <div className="space-y-1.5 px-1">
            <button
              onClick={() => handleSetBackground('')}
              className={`w-full py-1.5 rounded-lg border text-[10px] font-bold transition-all flex items-center justify-center gap-2 ${!backgroundUrl ? 'border-cream/40 bg-cream/10 text-cream' : 'border-white/5 text-cream/40 hover:border-white/15'}`}
            >
              <div className="w-2 h-2 bg-black border border-white/20 rounded-sm" /> Default Black
            </button>
            <div className="max-h-24 overflow-y-auto space-y-1 pr-0.5 custom-scrollbar">
              {backgrounds.map(bg => {
                const isActive = backgroundUrl === bg.url
                const isDefault = defaultBgId === bg.id
                return (
                  <div key={bg.id} onClick={() => handleSetBackground(bg.url)}
                    className={`w-full relative py-1.5 px-2 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-2 cursor-pointer group ${isActive ? 'border-gold/60 bg-gold/5 text-gold' : 'border-white/5 text-cream/40 hover:border-white/15'}`}>
                    <div className="w-4 h-4 rounded-sm bg-cover bg-center shrink-0 border border-white/20" style={{ backgroundImage: `url(${bg.url})` }} />
                    <span className="truncate flex-1 text-left">Custom Image</span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => toggleDefaultBg(bg.id, e)} className={`p-1 rounded hover:bg-white/10 ${isDefault ? 'text-gold' : 'text-cream/30'}`}>★</button>
                      <button onClick={(e) => removeBackground(bg.id, e)} className="p-1 rounded hover:bg-red-500/20 text-red-500">✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="relative">
              <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <button className="w-full py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] font-bold text-cream/50 flex items-center justify-center gap-1.5 transition-all">
                <UploadCloud className="w-3 h-3 shrink-0" /> Upload Image
              </button>
            </div>
          </div>
        </div>

        {/* ─── Live Projection (directly below Backgrounds) ─── */}
        <div className="pt-2 mb-2 border-b border-forest-700/20 pb-4">
          <button
            onClick={() => setShowProjection(!showProjection)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-cream/40 hover:text-cream/80 hover:bg-white/5 transition-all"
          >
            <span className="flex items-center gap-3 text-sm font-semibold">
              <MonitorPlay className={`w-5 h-5 shrink-0 ${showProjection ? 'text-gold' : ''}`} />
              Live Projection
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showProjection ? 'rotate-180' : ''}`} />
          </button>

          {showProjection && (
            <div className="mt-2 px-2 space-y-3">
              {/* Mini 16:9 Preview */}
              <div className="w-full bg-black rounded-xl border border-white/5 overflow-hidden relative" style={{ aspectRatio: '16/9' }}>
                {projState.backgroundUrl && (
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${projState.backgroundUrl})` }}>
                    <div className="absolute inset-0 bg-black/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-forest-700/30 to-black pointer-events-none" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                  {projState.mode === 'worship' && projState.lyricLines?.length > 0 ? (
                    <div>{projState.lyricLines.map((l: string, i: number) => <p key={i} className="text-[9px] font-bold text-white">{l}</p>)}</div>
                  ) : projState.mode === 'scripture' && projState.scripture ? (
                    <div>
                      <p className="text-[8px] text-white/80 line-clamp-2">{projState.scripture.text}</p>
                      <p className="text-[8px] font-black text-gold uppercase mt-1">{projState.scripture.reference}</p>
                    </div>
                  ) : (
                    <p className="text-[8px] text-cream/20 font-black uppercase tracking-widest">System Idle</p>
                  )}
                </div>
                <div className="absolute top-1.5 right-1.5">
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase ${currentMode === 'idle' ? 'bg-white/10 text-cream/40' : 'bg-red-500/20 text-red-400 animate-pulse'}`}>{currentMode}</span>
                </div>
              </div>

              {/* Mode Switcher */}
              <div className="flex bg-black/30 rounded-lg p-1 border border-white/5">
                {['idle', 'worship', 'sermon'].map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    disabled={loading}
                    className={`flex-1 py-1.5 rounded-md font-bold text-[9px] uppercase tracking-wider transition-all ${
                      currentMode === m ? 'bg-forest text-cream shadow-md' : 'text-cream/40 hover:text-cream/80 hover:bg-white/5'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Display Detection */}
              <button
                onClick={detectDisplays}
                className="w-full py-2 bg-forest/20 border border-forest/30 hover:bg-forest/40 text-cream text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition-all"
              >
                <Monitor className="w-3 h-3 text-gold" /> Detect Displays
              </button>

              {screens.length > 0 && (
                <div className="space-y-1">
                  {screens.map((screen, i) => {
                    const isId = screen.id || screen.label || `Display ${i + 1}`
                    const isActive = activeScreenId === isId
                    return (
                      <button
                        key={isId}
                        onClick={() => projectOnScreen(screen)}
                        className={`w-full py-2 px-3 border rounded-lg text-[10px] font-bold flex items-center justify-between transition-all ${
                          isActive 
                            ? 'bg-gold/10 border-gold text-gold shadow-[0_0_10px_rgba(201,168,76,0.1)]' 
                            : 'bg-cream/5 border-cream/10 hover:border-gold/40 hover:bg-cream/10 text-cream'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Monitor className={`w-3 h-3 ${isActive ? 'text-gold' : 'text-gold/40'}`} />
                          {screen.label || `Display ${i + 1}`}
                        </span>
                        {isActive ? (
                          <span className="text-[8px] bg-gold text-dark-950 px-1.5 py-0.5 rounded-full font-black uppercase">Active</span>
                        ) : (
                          <Maximize className="w-3 h-3 text-cream/40" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* System Mode moved into Live Projection for better context */}

      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-forest-700/20 shrink-0">
        <button onClick={() => signOut()} className="flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-cream/30 hover:bg-red-500/5 hover:text-red-400 transition-all group">
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold text-sm tracking-tight">Sign Out</span>
        </button>
      </div>
    </div>
  )
}
