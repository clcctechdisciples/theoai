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
    <div className="w-64 h-full bg-dark-950 border-r border-dark-800 flex flex-col pt-8">
      <div className="px-8 mb-10 group cursor-default">
        <h2 className="font-cinzel text-2xl font-black tracking-tighter text-white group-hover:text-blue-400 transition-colors">THEO AI</h2>
        <div className="h-0.5 w-8 bg-blue-500 mt-1 transition-all group-hover:w-16"></div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map(item => {
          const isActive = pathname === item.href
          const Icon = item.icon
          const content = (
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
                isActive
                  ? 'bg-blue-500/10 border border-blue-500/20 text-white glow-blue'
                  : 'text-white/40 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : ''}`} />
              <span className="font-semibold text-sm tracking-tight">{item.label}</span>
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

      <div className="p-6 border-t border-dark-800 mt-auto px-6">
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-white/30 hover:bg-red-500/5 hover:text-red-400 transition-all duration-300 group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold text-sm tracking-tight">Sign Out</span>
        </button>
      </div>
    </div>
  )
}
