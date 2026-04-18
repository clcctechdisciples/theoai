import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import { Music, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-10">
        <header className="mb-12">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400/80">System Online</span>
          </div>
          <h1 className="text-4xl font-cinzel font-black text-white tracking-tight">Welcome, {session?.user?.name || 'Admin'}</h1>
          <p className="text-white/40 mt-3 text-sm max-w-md">Theo AI is engaged and ready to assist with today's worship experience.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link href="/worship" className="glass-card p-8 rounded-3xl group relative overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors"></div>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <Music className="text-blue-400 w-7 h-7" />
            </div>
            <h2 className="text-2xl font-cinzel font-bold mb-3 text-white">Worship Mode</h2>
            <p className="text-sm text-white/50 leading-relaxed font-medium">Real-time lyric transcription, automatic Verse/Chorus detection, and instant scripture projection.</p>
          </Link>

          <Link href="/sermon" className="glass-card p-8 rounded-3xl group relative overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors"></div>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <MessageSquare className="text-blue-400 w-7 h-7" />
            </div>
            <h2 className="text-2xl font-cinzel font-bold mb-3 text-white">Sermon Mode</h2>
            <p className="text-sm text-white/50 leading-relaxed font-medium">Capture preaching in real-time. Automatically extract key points and generate theological summaries.</p>
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
