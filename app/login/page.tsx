'use client'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogIn, UserPlus, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { redirect: false, username, password })
    setLoading(false)
    if (res?.error) {
      setError('Invalid username or password. Please try again.')
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 relative overflow-hidden font-inter">
      {/* Background glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1A3316_0%,_#0A0F0A_70%)]" />
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-forest-700/20 rounded-full blur-[140px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gold/5 rounded-full blur-[100px]" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="glass-card p-10 rounded-[2.5rem] shadow-2xl border border-cream/10">
          {/* Header */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-forest border border-gold/30 flex items-center justify-center mb-6 shadow-xl">
              <LogIn className="w-7 h-7 text-gold" />
            </div>
            <h1 className="font-cinzel text-4xl font-black text-cream tracking-tighter">THEO AI</h1>
            <p className="text-cream/40 text-xs uppercase tracking-[0.2em] mt-2 font-bold">Church Media Assistant</p>
            <div className="h-0.5 w-12 bg-gold/60 mt-4 rounded-full" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-cream/50 text-[10px] font-black uppercase tracking-[0.2em] ml-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full bg-white/5 border border-cream/10 rounded-2xl px-5 py-4 text-cream placeholder:text-cream/20 focus:outline-none focus:border-forest/60 focus:bg-white/8 transition-all font-medium"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-cream/50 text-[10px] font-black uppercase tracking-[0.2em] ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-white/5 border border-cream/10 rounded-2xl px-5 py-4 text-cream placeholder:text-cream/20 focus:outline-none focus:border-forest/60 transition-all font-medium pr-12"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-cream/30 hover:text-gold transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-forest border border-forest-700/50 text-cream font-black uppercase tracking-[0.2em] text-xs py-5 rounded-2xl hover:brightness-125 active:scale-[0.98] transition-all shadow-xl shadow-forest/20 flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
                : <><LogIn className="w-4 h-4" /> Sign In</>
              }
            </button>
            <div className="text-center">
              <Link href="/login/forgot-password" data-testid="forgot-password"
                className="text-[10px] font-black uppercase tracking-widest text-cream/30 hover:text-gold transition-colors">
                Forgot Password?
              </Link>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-cream/10" />
            <span className="text-cream/30 text-[10px] font-black uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-cream/10" />
          </div>

          {/* Create Account CTA */}
          <Link
            href="/signup"
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-gold/30 bg-gold/5 text-cream hover:bg-gold/10 hover:border-gold/60 transition-all font-bold text-sm"
          >
            <UserPlus className="w-4 h-4 text-gold" />
            Create a New Account
          </Link>
        </div>
      </div>
    </div>
  )
}
