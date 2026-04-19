import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { saveData } from '@/lib/db'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { content } = await req.json()
    const apiKey = process.env.OPENROUTER_API_KEY

    if (!apiKey) {
      throw new Error("AI API Key missing")
    }

    const prompt = `You are a music library assistant. Analyze the following text which contains a list of songs and their lyrics.
    
    TASK:
    - Extract each song individually.
    - For each song, provide a "title" and "lyrics" (the full text).
    - Return a JSON array of objects.

    Content:
    "${content}"

    Respond ONLY with a JSON array:
    [
      { "title": "Song Title", "lyrics": "Full lyrics text..." },
      ...
    ]`

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-flash-1.5',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    })

    const data = await res.json()
    const songs = JSON.parse(data.choices[0].message.content)

    if (Array.isArray(songs)) {
      for (const song of songs) {
        saveData((session.user as any).id, 'songs', song)
      }
    }

    return NextResponse.json({ success: true, count: songs.length })
  } catch (error: any) {
    console.error('Bulk Upload Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
