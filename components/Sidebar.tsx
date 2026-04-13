'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Music, MessageSquare, MonitorPlay, Mic, Settings, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/worship', label: 'Worship Mode', icon: Music },
  { href: '/sermon', label: 'Sermon Mode', icon: MessageSquare },
  { href: '/audio', label: 'Audio Engine', icon: Mic },
  { href: '/display', label: 'Display Output', icon: MonitorPlay, newTab: true },
]

export function Sidebar() {
  const pathname = usePathname()

  // Hide sidebar on the display output page
  if (pathname === '/display') return null

  return (
    <div className="w-64 h-full bg-dark-card border-r border-forest/30 flex flex-col pt-6">
      <div className="px-6 mb-8">
        <h2 className="font-cinzel text-2xl font-bold gold-text tracking-wider">Theo AI</h2>
        <p className="text-forest-light text-[10px] tracking-widest uppercase mt-1">CLCC Tech Disciples</p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map(item => {
          const isActive = pathname === item.href
          const Icon = item.icon
          const content = (
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'bg-forest/20 border border-forest/40 text-gold-light glow-green'
                  : 'text-cream/70 hover:bg-forest/10 hover:text-cream'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </div>
          )

          if (item.newTab) {
            return (
              <a key={item.href} href={item.href} target="_blank" rel="noreferrer">
                {content}
              </a>
            )
          }

          return (
            <Link key={item.href} href={item.href}>
              {content}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-forest/30 mt-auto space-y-2 px-4">
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-cream/70 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  )
}
