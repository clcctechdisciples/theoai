'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, LogIn } from 'lucide-react'

export default function SignupPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return setError('Passwords do not match.')
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
        setError(data.error || 'Failed to register. Please try again.')
      } else {
        setSuccess('Account created successfully! Redirecting to login...')
        setTimeout(() => router.push('/login'), 2000)
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 relative overflow-hidden font-inter">
      {/* Background glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1A3316_0%,_#0A0F0A_70%)]" />
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-forest-700/20 rounded-full blur-[140px]" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-gold/5 rounded-full blur-[100px]" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="glass-card p-10 rounded-[2.5rem] shadow-2xl border border-cream/10">
          {/* Header */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-forest border border-gold/30 flex items-center justify-center mb-6 shadow-xl">
              <UserPlus className="w-7 h-7 text-gold" />
            </div>
            <h1 className="font-cinzel text-4xl font-black text-cream tracking-tighter">Join THEO</h1>
            <p className="text-cream/40 text-xs uppercase tracking-[0.2em] mt-2 font-bold">Create Your Account</p>
            <div className="h-0.5 w-12 bg-gold/60 mt-4 rounded-full" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-xl text-sm text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-forest/20 border border-forest/40 text-cream p-3 rounded-xl text-sm text-center">
                {success}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-cream/50 text-[10px] font-black uppercase tracking-[0.2em] ml-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full bg-white/5 border border-cream/10 rounded-2xl px-5 py-4 text-cream placeholder:text-cream/20 focus:outline-none focus:border-forest/60 transition-all font-medium"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-cream/50 text-[10px] font-black uppercase tracking-[0.2em] ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Choose a strong password"
                className="w-full bg-white/5 border border-cream/10 rounded-2xl px-5 py-4 text-cream placeholder:text-cream/20 focus:outline-none focus:border-forest/60 transition-all font-medium"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-cream/50 text-[10px] font-black uppercase tracking-[0.2em] ml-1">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                className="w-full bg-white/5 border border-cream/10 rounded-2xl px-5 py-4 text-cream placeholder:text-cream/20 focus:outline-none focus:border-forest/60 transition-all font-medium"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-forest border border-forest-700/50 text-cream font-black uppercase tracking-[0.2em] text-xs py-5 rounded-2xl hover:brightness-125 active:scale-[0.98] transition-all shadow-xl shadow-forest/20 flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
                : <><UserPlus className="w-4 h-4" /> Create Account</>
              }
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-cream/10" />
            <span className="text-cream/30 text-[10px] font-black uppercase tracking-widest">already have an account?</span>
            <div className="flex-1 h-px bg-cream/10" />
          </div>

          {/* Sign In CTA */}
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-cream/20 bg-cream/5 text-cream hover:bg-cream/10 hover:border-cream/30 transition-all font-bold text-sm"
          >
            <LogIn className="w-4 h-4 text-cream" />
            Sign In Instead
          </Link>
        </div>
      </div>
    </div>
  )
}
