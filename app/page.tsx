import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import { Music, MessageSquare, Mic, History } from 'lucide-react'
import Link from 'next/link'

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-10">
        <header className="mb-12">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-forest animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-forest-light/80">System Online</span>
          </div>
          <h1 className="text-4xl font-cinzel font-black text-white tracking-tight">Welcome, {session?.user?.name || 'Admin'}</h1>
          <p className="text-white/40 mt-3 text-sm max-w-md">Theo AI is engaged and ready to assist with today's worship experience.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/sermon" className="glass-card p-6 rounded-2xl border border-cream/20 hover:border-cream/50 transition-all group hover:-translate-y-1 block bg-forest-dark/30 hover:bg-forest/50">
            <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center mb-4 transition-all">
              <MessageSquare className="w-6 h-6 text-forest-dark" />
            </div>
            <h2 className="font-cinzel text-xl font-bold text-cream mb-2">Sermon Engine</h2>
            <p className="text-sm text-cream/70 leading-relaxed group-hover:text-cream transition-colors">
              Capture preaching in real-time. Automatically extract key points and generate theological summaries.
            </p>
          </Link>

          <Link href="/worship" className="glass-card p-6 rounded-2xl border border-cream/20 hover:border-cream/50 transition-all group hover:-translate-y-1 block bg-forest-dark/30 hover:bg-forest/50">
            <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center mb-4 transition-all">
              <Mic className="w-6 h-6 text-forest-dark" />
            </div>
            <h2 className="font-cinzel text-xl font-bold text-cream mb-2">Worship Engine</h2>
            <p className="text-sm text-cream/70 leading-relaxed group-hover:text-cream transition-colors">
              Send live lyrics to the projector and automate scripture display explicitly mapped to the live band.
            </p>
          </Link>

          <Link href="/audio" className="glass-card p-6 rounded-2xl border border-cream/20 hover:border-cream/50 transition-all group hover:-translate-y-1 block bg-forest-dark/30 hover:bg-forest/50">
            <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center mb-4 transition-all">
              <History className="w-6 h-6 text-forest-dark" />
            </div>
            <h2 className="font-cinzel text-xl font-bold text-cream mb-2">Audio Archive</h2>
            <p className="text-sm text-cream/70 leading-relaxed group-hover:text-cream transition-colors">
              Manage saved audio recordings, download full MP4 files directly from the local OS storage.
            </p>
          </Link>
        </div>

        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-cinzel font-bold text-white/80">Recent Activity</h2>
            <div className="h-px flex-1 mx-8 bg-white/5"></div>
          </div>
          <div className="glass-card rounded-3xl p-12 text-center text-white/20 font-bold tracking-tight">
            SYSTEM LOGS EMPTY
          </div>
        </div>
      </main>
    </div>
  )
}
