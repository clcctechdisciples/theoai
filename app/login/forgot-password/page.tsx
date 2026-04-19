'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { KeyRound, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1) // 1: username, 2: answer + new pass
  const [username, setUsername] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleGetQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getQuestion', username })
      })
      const data = await res.json()
      if (res.ok) {
        setQuestion(data.question)
        setStep(2)
      } else {
        setError(data.error)
      }
    } catch (e) { setError('Connection error') }
    setLoading(false)
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', username, recoveryAnswer: answer, newPassword })
      })
      const data = await res.json()
      if (res.ok) {
        setStep(3) // success
        setTimeout(() => router.push('/login'), 3000)
      } else {
        setError(data.error)
      }
    } catch (e) { setError('Connection error') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 relative overflow-hidden font-inter text-cream">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1A3316_0%,_#0A0F0A_70%)]" />
      
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="glass-card p-10 rounded-[2.5rem] shadow-2xl border border-cream/10">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-forest border border-gold/30 flex items-center justify-center mb-6 shadow-xl">
              <KeyRound className="w-7 h-7 text-gold" />
            </div>
            <h1 className="font-cinzel text-3xl font-black tracking-tighter">Account Recovery</h1>
            <div className="h-0.5 w-12 bg-gold/60 mt-4 rounded-full" />
          </div>

          {step === 1 && (
            <form onSubmit={handleGetQuestion} className="space-y-6">
              <p className="text-cream/40 text-xs text-center uppercase tracking-widest font-bold">Step 1: Identity</p>
              {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-xl text-xs text-center">{error}</div>}
              <div className="space-y-2">
                <label className="block text-cream/50 text-[10px] font-black uppercase tracking-[0.2em] ml-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full bg-white/5 border border-cream/10 rounded-2xl px-5 py-4 text-cream placeholder:text-cream/20 focus:outline-none focus:border-forest/60 transition-all font-medium"
                  required
                />
              </div>
              <button disabled={loading} className="w-full bg-forest text-cream font-black uppercase tracking-widest text-xs py-5 rounded-2xl hover:brightness-110 transition-all">
                {loading ? 'Searching...' : 'Find Account'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleReset} className="space-y-6">
               <p className="text-cream/40 text-xs text-center uppercase tracking-widest font-bold">Step 2: Verification</p>
               {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-xl text-xs text-center">{error}</div>}
               
               <div className="space-y-2">
                <label className="block text-cream/50 text-[10px] font-black uppercase tracking-[0.2em] ml-1">Your Question</label>
                <div className="p-4 bg-white/5 border border-cream/5 rounded-2xl text-sm italic text-cream/80">
                  {question}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-cream/50 text-[10px] font-black uppercase tracking-[0.2em] ml-1">Security Answer</label>
                <input
                  type="text"
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Enter the answer"
                  className="w-full bg-white/5 border border-cream/10 rounded-2xl px-5 py-4 text-cream placeholder:text-cream/20 focus:outline-none focus:border-forest/60 transition-all font-medium"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-cream/50 text-[10px] font-black uppercase tracking-[0.2em] ml-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-white/5 border border-cream/10 rounded-2xl px-5 py-4 text-cream placeholder:text-cream/20 focus:outline-none focus:border-forest/60 transition-all font-medium pr-12"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-forest/60 hover:text-forest transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button disabled={loading} className="w-full bg-forest text-cream font-black uppercase tracking-widest text-xs py-5 rounded-2xl hover:brightness-110 transition-all">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center space-y-6 py-4">
              <div className="flex justify-center">
                <CheckCircle2 className="w-16 h-16 text-forest animate-bounce" />
              </div>
              <h2 className="font-cinzel text-xl font-black text-cream">Password Reset Successful!</h2>
              <p className="text-cream/40 text-sm">You can now sign in with your new password. Redirecting...</p>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cream/30 hover:text-cream transition-all">
              <ArrowLeft className="w-3 h-3" /> Back to Sign In
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
