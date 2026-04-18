'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function SignupPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || 'Failed to register')
      } else {
        setSuccess('Account created! Returning to login...')
        setTimeout(() => router.push('/login'), 2000)
      }
    } catch(err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden font-inter">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40 bg-[radial-gradient(circle_at_center,_#047361_0%,_transparent_70%)]" />
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-forest/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-forest/10 rounded-full blur-[120px]" />

      <div className="glass-card w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl relative z-10 border border-white/10">
        <div className="flex flex-col items-center mb-10">
          <h1 className="font-cinzel text-5xl font-black text-white tracking-tighter text-center">JOIN THEO</h1>
          <div className="h-1 w-12 bg-cream mt-2 rounded-full shadow-[0_0_15px_rgba(242,236,225,0.3)]"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm text-center">{error}</div>}
          {success && <div className="bg-forest/20 border border-forest/50 text-cream p-3 rounded-lg text-sm text-center">{success}</div>}
          
          <div className="space-y-2">
            <label className="block text-white/40 text-[10px] font-black uppercase tracking-[0.2em] ml-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-forest/50 focus:bg-white/10 transition-all font-medium"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-white/40 text-[10px] font-black uppercase tracking-[0.2em] ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-forest/50 focus:bg-white/10 transition-all font-medium"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest text-cream font-black uppercase tracking-[0.2em] text-xs py-5 rounded-2xl hover:bg-forest-light active:scale-[0.98] transition-all shadow-xl shadow-forest/20 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-[10px] font-bold text-white/20 uppercase tracking-widest mt-10">
          Already have an account? <Link href="/login" className="text-forest-light hover:text-cream transition-colors">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
