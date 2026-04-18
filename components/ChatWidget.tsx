'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<{role: string, content: string}[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const newMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, newMsg])
    setInput('')
    setLoading(true)

    // Fetch system state to inject
    let state = { mode: 'idle', audioStatus: 'offline', transcriptionStatus: 'idle' }
    try {
      const stateRes = await fetch('/api/control')
      const stateData = await stateRes.json()
      state.mode = stateData.mode || 'idle'
      // We'd infer audio/transcription status from more complex state in a real build
    } catch(e) {}

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, newMsg],
          context: state
        })
      })
      const data = await res.json()
      
      const assistantMsg = data.response || "I encountered an error."
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMsg }])

      // Look for hidden commands in the response
      if (assistantMsg.includes('YES_SWITCH_SERMON')) {
        await fetch('/api/control', { method: 'POST', body: JSON.stringify({ action: 'setMode', mode: 'sermon' })})
      } else if (assistantMsg.includes('YES_SWITCH_WORSHIP')) {
        await fetch('/api/control', { method: 'POST', body: JSON.stringify({ action: 'setMode', mode: 'worship' })})
      }

    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection failed.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 w-16 h-16 rounded-2xl bg-forest shadow-2xl shadow-forest/20 flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 group z-40 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <MessageCircle className="w-7 h-7 text-cream group-hover:rotate-12 transition-transform" />
      </button>

      <div className={`fixed bottom-8 right-8 w-80 sm:w-96 glass-card rounded-3xl shadow-2xl flex flex-col transition-all duration-700 origin-bottom-right z-50 ${isOpen ? 'scale-100 opacity-100' : 'scale-75 opacity-0 pointer-events-none'}`} style={{ height: '600px' }}>
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5 rounded-t-3xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-forest/10 flex items-center justify-center border border-forest/20">
              <img src="/logo.png" alt="Theo" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base tracking-tight">Theo AI</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-forest animate-pulse"></div>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Active Assistant</p>
              </div>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="text-center text-sm text-cream/40 mt-10">
              <p>How can I assist with the service today?</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                m.role === 'user' 
                ? 'bg-forest text-cream rounded-br-none shadow-lg shadow-forest/10' 
                : 'bg-white/5 border border-white/10 rounded-bl-none text-white/90'
              }`}>
                {/* Remove system commands from UI display */}
                {m.content.replace(/YES_SWITCH_[A-Z]+|YES_SHOW_SCRIPTURE_[^\s]+/g, '').trim()}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-none p-4 flex gap-1.5 items-center">
                <div className="w-2 h-2 bg-forest/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-forest/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-forest/40 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="p-4 bg-white/5 border-t border-white/10 rounded-b-3xl">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="How can I help today?"
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-5 pr-12 py-4 text-sm text-white focus:outline-none focus:border-forest/50 focus:bg-white/10 transition-all placeholder:text-white/20"
            />
            <button type="submit" disabled={!input.trim() || loading} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-forest-light hover:text-cream disabled:opacity-30 disabled:grayscale transition-all">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
