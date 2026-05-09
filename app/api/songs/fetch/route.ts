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
    if (!apiKey) throw new Error("API Key missing")

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://clcctheoai.vercel.app',
        'X-Title': 'Theo AI'
      },
      body: JSON.stringify({
        model: 'google/gemini-pro-1.5',
        messages: [
          { role: 'system', content: 'You are a lyrics database. Provide the full, accurate lyrics for the requested song. Do not include chords or any conversational text. Return ONLY the lyrics.' },
          { role: 'user', content: `Lyrics for "${title}"` }
        ]
      })
    })

    const data = await res.json()
    if (!data.choices?.[0]?.message?.content) {
      throw new Error("AI failed to find lyrics")
    }

    let lyrics = data.choices[0].message.content.trim()
    return NextResponse.json({ success: true, lyrics })
  } catch (error: any) {
    console.error('Fetch Lyrics Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
