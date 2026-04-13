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
    <div className="min-h-screen flex items-center justify-center bg-dark relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-forest/10 rounded-full blur-[120px]" />

      <div className="glass-card w-full max-w-md p-8 rounded-2xl shadow-2xl relative z-10 border border-gold/20">
        <div className="flex flex-col items-center mb-8">
          <h1 className="font-cinzel text-3xl font-bold text-cream tracking-wide">Register Account</h1>
          <p className="text-forest-light text-xs tracking-widest mt-2 uppercase font-semibold">Theo AI System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm text-center">{error}</div>}
          {success && <div className="bg-forest/20 border border-forest/50 text-cream p-3 rounded-lg text-sm text-center">{success}</div>}
          
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
            {loading ? <div className="w-5 h-5 border-2 border-cream/30 border-t-cream rounded-full animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-cream/50 mt-8">
          Already have an account? <Link href="/login" className="text-gold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
