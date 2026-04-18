'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Music, MessageSquare, MonitorPlay, Mic, Settings, LogOut, UploadCloud, Monitor, LayoutDashboard, History } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Sermon Engine', href: '/sermon', icon: MessageSquare },
  { label: 'Worship Engine', href: '/worship', icon: Music },
  { label: 'Audio Engine', href: '/audio-engine', icon: Settings },
  { label: 'Audio Archive', href: '/audio', icon: History }
]

export function Sidebar() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [currentMode, setCurrentMode] = useState('idle')
  const [backgroundUrl, setBackgroundUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Background Library State
  const [backgrounds, setBackgrounds] = useState<{ id: string, url: string }[]>([])
  const [defaultBgId, setDefaultBgId] = useState<string | null>(null)

  useEffect(() => {
    // Load backgrounds on mount
    const savedBgs = localStorage.getItem('theoai_backgrounds')
    if (savedBgs) {
      try { setBackgrounds(JSON.parse(savedBgs)) } catch (e) { }
    }
    const defBg = localStorage.getItem('theoai_default_bg')
    if (defBg) setDefaultBgId(defBg)

    // Poll the active background
    const int = setInterval(async () => {
      try {
        const res = await fetch('/api/control')
        const data = await res.json()
        setBackgroundUrl(data.backgroundUrl || '')
      } catch (e) { }
    }, 2000)
    return () => clearInterval(int)
  }, [])

  // Auto-apply default bg if currently empty
  useEffect(() => {
    if (defaultBgId && !backgroundUrl) {
      const target = backgrounds.find(b => b.id === defaultBgId)
      if (target) handleSetBackground(target.url)
    }
  }, [defaultBgId, backgrounds])

  const setMode = async (mode: string) => {
    setLoading(true)
    setCurrentMode(mode) // Optimistic update
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
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("File too large. Please use an image under 2MB.")

      const reader = new FileReader()
      reader.onload = async (ev) => {
        const b64 = ev.target?.result as string
        const newBg = { id: Date.now().toString(), url: b64 }
        const updated = [...backgrounds, newBg]
        setBackgrounds(updated)
        localStorage.setItem('theoai_backgrounds', JSON.stringify(updated))
        await handleSetBackground(b64)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeBackground = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = backgrounds.filter(b => b.id !== id)
    setBackgrounds(updated)
    localStorage.setItem('theoai_backgrounds', JSON.stringify(updated))
    if (defaultBgId === id) {
      setDefaultBgId(null)
      localStorage.removeItem('theoai_default_bg')
    }
    if (backgroundUrl === backgrounds.find(b => b.id === id)?.url) {
      handleSetBackground('')
    }
  }

  const toggleDefaultBg = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (defaultBgId === id) {
      setDefaultBgId(null)
      localStorage.removeItem('theoai_default_bg')
    } else {
      setDefaultBgId(id)
      localStorage.setItem('theoai_default_bg', id)
    }
  }

  return (
    <div className="w-64 h-full bg-dark-950 border-r border-forest-700/30 flex flex-col pt-8">
      <div className="px-8 mb-10 group cursor-default">
        <h2 className="font-cinzel text-2xl font-black tracking-tighter text-cream group-hover:text-gold transition-colors">THEO AI</h2>
        <div className="h-0.5 w-8 bg-gold/70 mt-1 transition-all group-hover:w-16"></div>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {navItems.map(item => {
          const isActive = pathname === item.href
          const Icon = item.icon
          const content = (
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
                isActive
                  ? 'bg-cream/10 border border-cream/20 text-cream glow-accent'
                  : 'text-cream/40 hover:bg-white/5 hover:text-cream/80'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-gold' : ''}`} />
              <span className="font-semibold text-sm tracking-tight">{item.label}</span>
            </div>
          )

          return (
            <Link key={item.href} href={item.href}>
              {content}
            </Link>
          )
        })}

        {/* Projector Controls Section */}
        <div className="mt-8 pt-6 border-t border-forest-700/30 px-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cream/30 flex items-center gap-2 mb-3">
            <Monitor className="w-3 h-3" /> System Mode
          </label>
          
          <div className="flex bg-dark-950 rounded-lg p-1 border border-white/5 mb-4">
            {['idle', 'worship', 'sermon'].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                disabled={loading}
                className={`flex-1 py-1.5 rounded-md font-bold text-[10px] uppercase tracking-wider transition-all ${
                  currentMode === m 
                  ? 'bg-forest text-cream shadow-md glow-forest' 
                  : 'text-cream/40 hover:text-cream/80 hover:bg-white/5'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 px-4 mb-4 z-50">
          <h3 className="text-xs font-bold text-cream/40 uppercase tracking-widest pl-2 mb-3 max-w-[200px]">Backgrounds</h3>
          <div className="space-y-2 relative h-48 overflow-visible">
            <button 
              onClick={() => handleSetBackground('')}
              className={`w-full py-2 rounded-lg border text-[10px] font-bold transition-all flex items-center justify-center gap-2 ${!backgroundUrl ? 'border-cream/50 bg-cream/10 text-cream' : 'border-white/5 text-cream/40 hover:border-white/20'}`}
            >
              <div className="w-2 h-2 bg-black border border-white/20 rounded-sm"></div> Default Black
            </button>
            
            <div className="max-h-32 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
               {backgrounds.map(bg => {
                 const isActive = backgroundUrl === bg.url;
                 const isDefault = defaultBgId === bg.id;
                 return (
                   <div 
                     key={bg.id} 
                     onClick={() => handleSetBackground(bg.url)}
                     className={`w-full relative py-2 px-3 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-2 cursor-pointer group ${isActive ? 'border-gold bg-gold/5 text-gold' : 'border-white/5 text-cream/40 hover:border-white/20'}`}
                   >
                     <div className="w-4 h-4 rounded-[2px] bg-cover bg-center shrink-0 border border-white/20" style={{ backgroundImage: `url(${bg.url})` }} />
                     <span className="truncate flex-1 text-left">Custom Image</span>
                     
                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2">
                       <button onClick={(e) => toggleDefaultBg(bg.id, e)} className={`p-1 rounded hover:bg-white/10 ${isDefault ? 'text-gold opacity-100' : 'text-cream/40'}`} title={isDefault ? "Set as Idle Default" : "Set as Default"}>
                         ★
                       </button>
                       <button onClick={(e) => removeBackground(bg.id, e)} className="p-1 rounded hover:bg-red-500/20 text-red-500" title="Delete">
                         ✕
                       </button>
                     </div>
                   </div>
                 )
               })}
            </div>

            <div className="relative mt-2">
              <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <button className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] font-bold text-cream/60 transition-all flex items-center justify-center gap-2 truncate px-2">
                <UploadCloud className="w-3 h-3 shrink-0" />
                Upload Image
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-6 border-t border-forest-700/30 shrink-0">
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-cream/30 hover:bg-red-500/5 hover:text-red-400 transition-all duration-300 group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold text-sm tracking-tight">Sign Out</span>
        </button>
      </div>
    </div>
  )
}
