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
        <header className="mb-10">
          <h1 className="text-3xl font-cinzel font-bold gold-text">Welcome, {session?.user?.name || 'Admin'}</h1>
          <p className="text-cream/60 mt-2">Theo AI is ready for the next service.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/worship" className="glass-card p-6 rounded-2xl hover:border-gold/50 transition-colors group">
            <div className="w-12 h-12 rounded-full bg-forest/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Music className="text-gold w-6 h-6" />
            </div>
            <h2 className="text-xl font-cinzel font-semibold mb-2">Worship Mode</h2>
            <p className="text-sm text-cream/70">Real-time lyric transcription, automatic formatting (Verse/Chorus), and scripture detection for live projection.</p>
          </Link>

          <Link href="/sermon" className="glass-card p-6 rounded-2xl hover:border-gold/50 transition-colors group">
            <div className="w-12 h-12 rounded-full bg-forest/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MessageSquare className="text-gold w-6 h-6" />
            </div>
            <h2 className="text-xl font-cinzel font-semibold mb-2">Sermon Mode</h2>
            <p className="text-sm text-cream/70">Live preaching transcription, key point extraction, and automatic PDF summary generation.</p>
          </Link>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-cinzel font-semibold mb-6">Recent Activity</h2>
          <div className="glass-card rounded-2xl p-8 text-center text-cream/50">
            No recent services recorded.
          </div>
        </div>
      </main>
    </div>
  )
}
