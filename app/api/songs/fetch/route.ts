import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { title } = await req.json()
    if (!title) throw new Error("Title is required")

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey || apiKey === 'sk-or-v1-placeholder') {
      throw new Error("OpenRouter API Key missing or not configured. Please add OPENROUTER_API_KEY to your environment variables.")
    }

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://clcctheoai.vercel.app',
        'X-Title': 'Theo AI'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001', // Using a newer, faster model
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional church music librarian and lyrics database. Provide the full, accurate lyrics for the requested song. Do not include chords, metadata, or any conversational text. Return ONLY the lyrics, formatted with clear stanzas (Verse, Chorus, etc.).' 
          },
          { role: 'user', content: `Please provide the full lyrics for the song titled "${title}".` }
        ],
        temperature: 0.3
      })
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenRouter API returned ${res.status}`);
    }

    const data = await res.json()
    if (!data.choices?.[0]?.message?.content) {
      throw new Error("AI failed to find lyrics for this song.")
    }

    let lyrics = data.choices[0].message.content.trim()
    
    // Remove potential markdown code blocks if the AI included them
    if (lyrics.startsWith('```')) {
      lyrics = lyrics.replace(/^```(?:text|lyrics|markdown)?\n?/, '').replace(/\n?```$/, '').trim()
    }

    return NextResponse.json({ success: true, lyrics })
  } catch (error: any) {
    console.error('Fetch Lyrics Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
