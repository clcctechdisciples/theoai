'use client'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', {
      redirect: false,
      username,
      password,
    })
    setLoading(false)
    if (res?.error) {
      setError('Invalid credentials. Please try again.')
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-forest/10 rounded-full blur-[120px]" />

      <div className="glass-card w-full max-w-md p-8 rounded-2xl shadow-2xl relative z-10 border border-gold/20">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full border border-gold/40 mb-4 p-1 overflow-hidden bg-forest-dark flex items-center justify-center shadow-lg glow-gold">
            <Image src="/logo.png" alt="Logo" width={64} height={64} className="object-contain" />
          </div>
          <h1 className="font-cinzel text-3xl font-bold gold-text tracking-wide">Theo AI</h1>
          <p className="text-forest-light text-xs tracking-widest mt-1 uppercase font-semibold">CLCC Tech Disciples</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-cream/70 text-xs uppercase tracking-wider mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-dark border border-forest/40 rounded-lg px-4 py-3 text-cream focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-cream/70 text-xs uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-dark border border-forest/40 rounded-lg px-4 py-3 text-cream focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full forest-gradient text-cream font-medium py-3 rounded-lg hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-forest-light/50 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-5 h-5 border-2 border-cream/30 border-t-cream rounded-full animate-spin" /> : 'Enter System'}
          </button>
        </form>

        <p className="text-center text-xs text-cream/50 mt-8">
          Don't have an account? <a href="/signup" className="text-gold hover:underline">Create Account</a>
        </p>
      </div>
    </div>
  )
}
