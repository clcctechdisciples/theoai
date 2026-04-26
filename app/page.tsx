import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import { Music, MessageSquare, History, MonitorPlay, Presentation } from 'lucide-react'
import Link from 'next/link'

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-10">
        <header className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-forest animate-pulse shadow-[0_0_10px_var(--forest)]"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-forest">System Online</span>
          </div>
          <h1 className="text-6xl font-cinzel font-black text-cream tracking-tighter">Welcome, {session?.user?.name || 'Admin'}</h1>
          <p className="text-cream/40 mt-4 text-sm max-w-lg leading-relaxed font-medium">Theo AI is engaged and ready to assist with today's church experience. Select an engine to begin.</p>
          
          {process.env.VERCEL === '1' && !process.env.DATABASE_URL && (
            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl max-w-lg">
              <p className="text-[10px] text-amber-200 uppercase font-black tracking-widest mb-1">⚠️ Storage Warning</p>
              <p className="text-[10px] text-amber-200/60 leading-relaxed font-bold">
                Running in ephemeral mode. On Vercel, your library and recordings will be cleared periodically. To enable permanent storage, please connect a database.
              </p>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/sermon" className="glass-card p-6 rounded-2xl border border-cream/20 hover:border-gold/50 transition-all group hover:-translate-y-1 block bg-forest-dark/30 hover:bg-forest/30">
            <div className="w-12 h-12 rounded-xl bg-forest border border-gold/30 flex items-center justify-center mb-4 transition-all group-hover:bg-gold/20 group-hover:border-gold glow-forest">
              <MessageSquare className="w-6 h-6 text-gold" />
            </div>
            <h2 className="font-cinzel text-xl font-bold text-cream mb-2">Sermon Engine</h2>
            <p className="text-sm text-cream/60 leading-relaxed group-hover:text-cream transition-colors">
              Capture preaching in real-time. AI auto-detects scriptures, generates notes, and drives the projector.
            </p>
          </Link>

          <Link href="/worship" className="glass-card p-6 rounded-2xl border border-cream/20 hover:border-gold/50 transition-all group hover:-translate-y-1 block bg-forest-dark/30 hover:bg-forest/30">
            <div className="w-12 h-12 rounded-xl bg-forest border border-gold/30 flex items-center justify-center mb-4 transition-all group-hover:bg-gold/20 group-hover:border-gold glow-forest">
              <Music className="w-6 h-6 text-gold" />
            </div>
            <h2 className="font-cinzel text-xl font-bold text-cream mb-2">Worship Engine</h2>
            <p className="text-sm text-cream/60 leading-relaxed group-hover:text-cream transition-colors">
              Send live lyrics to the projector. Click any verse block to instantly project it to the display screen.
            </p>
          </Link>

          <Link href="/audio" className="glass-card p-6 rounded-2xl border border-cream/20 hover:border-gold/50 transition-all group hover:-translate-y-1 block bg-forest-dark/30 hover:bg-forest/30">
            <div className="w-12 h-12 rounded-xl bg-forest border border-gold/30 flex items-center justify-center mb-4 transition-all group-hover:bg-gold/20 group-hover:border-gold glow-forest">
              <History className="w-6 h-6 text-gold" />
            </div>
            <h2 className="font-cinzel text-xl font-bold text-cream mb-2">Audio Archive</h2>
            <p className="text-sm text-cream/60 leading-relaxed group-hover:text-cream transition-colors">
              Access and manage your high-fidelity service recordings. Review past sermons, download audio, or manage your media library.
            </p>
          </Link>

          <Link href="/display" className="glass-card p-6 rounded-2xl border border-cream/20 hover:border-gold/50 transition-all group hover:-translate-y-1 block bg-forest-dark/30 hover:bg-forest/30">
            <div className="w-12 h-12 rounded-xl bg-forest border border-gold/30 flex items-center justify-center mb-4 transition-all group-hover:bg-gold/20 group-hover:border-gold glow-forest">
              <MonitorPlay className="w-6 h-6 text-gold" />
            </div>
            <h2 className="font-cinzel text-xl font-bold text-cream mb-2">Live Projection</h2>
            <p className="text-sm text-cream/60 leading-relaxed group-hover:text-cream transition-colors">
              Direct and monitor the live projector output. Manage connected displays and visual backgrounds in real-time.
            </p>
          </Link>

          <Link href="/slides" className="glass-card p-6 rounded-2xl border border-cream/20 hover:border-gold/50 transition-all group hover:-translate-y-1 block bg-forest-dark/30 hover:bg-forest/30">
            <div className="w-12 h-12 rounded-xl bg-forest border border-gold/30 flex items-center justify-center mb-4 transition-all group-hover:bg-gold/20 group-hover:border-gold glow-forest">
              <Presentation className="w-6 h-6 text-gold" />
            </div>
            <h2 className="font-cinzel text-xl font-bold text-cream mb-2">Slides Display</h2>
            <p className="text-sm text-cream/60 leading-relaxed group-hover:text-cream transition-colors">
              Upload and display PDF/PowerPoint slides. Manage your slide deck and project them sequentially.
            </p>
          </Link>
        </div>

        <div className="mt-20">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-cream/30">System Status</h2>
          </div>
          <div className="glass-card rounded-[2.5rem] p-20 text-center text-cream/10 font-black uppercase tracking-[0.4em] text-sm border border-white/5">
            Logs Clear
          </div>
        </div>
      </main>
    </div>
  )
}
