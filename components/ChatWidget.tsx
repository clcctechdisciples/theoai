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
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full forest-gradient shadow-xl glow-green flex items-center justify-center transition-transform hover:scale-110 z-40 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <MessageCircle className="w-6 h-6 text-cream" />
      </button>

      <div className={`fixed bottom-6 right-6 w-80 sm:w-96 glass-card rounded-2xl shadow-2xl flex flex-col transition-all duration-500 origin-bottom-right z-50 ${isOpen ? 'scale-100 opacity-100' : 'scale-75 opacity-0 pointer-events-none'}`} style={{ height: '500px' }}>
        <div className="flex items-center justify-between p-4 border-b border-forest/30 bg-forest-dark/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-gold/40 bg-dark flex items-center justify-center glow-gold">
              <img src="/logo.png" alt="Theo" className="w-5 h-5 object-contain" />
            </div>
            <div>
              <h3 className="font-cinzel font-bold text-gold-light text-sm">Theo AI</h3>
              <p className="text-[10px] text-cream/50 uppercase tracking-widest">System Assistant</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-cream/50 hover:text-cream transition-colors">
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
              <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                m.role === 'user' 
                ? 'bg-forest/40 border border-forest-light/30 rounded-br-none' 
                : 'bg-dark/60 border border-gold/20 rounded-bl-none text-cream/90'
              }`}>
                {/* Remove system commands from UI display */}
                {m.content.replace(/YES_SWITCH_[A-Z]+|YES_SHOW_SCRIPTURE_[^\s]+/g, '').trim()}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-dark/60 border border-gold/20 rounded-xl rounded-bl-none p-4 flex gap-1 items-center">
                <div className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="p-3 border-t border-forest/30 bg-dark/40 rounded-b-2xl">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type a command or question..."
              className="w-full bg-dark border border-forest/50 rounded-lg pl-4 pr-10 py-2.5 text-sm text-cream focus:outline-none focus:border-gold transition-colors"
            />
            <button type="submit" disabled={!input.trim() || loading} className="absolute right-2 top-1/2 -translate-y-1/2 text-forest-light hover:text-gold transition-colors disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
