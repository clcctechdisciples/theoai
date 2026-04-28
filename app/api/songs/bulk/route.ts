import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { saveData } from '@/lib/db'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { content } = await req.json()
    const backendUrl = process.env.AI_BACKEND_URL
    
    if (backendUrl) {
      const cleanUrl = backendUrl.replace(/\/$/, '')
      try {
        const res = await fetch(`${cleanUrl}/api/bulk-songs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        })
        
        if (res.ok) {
          const result = await res.json()
          console.log('AI Backend success:', result)
          const songs = result.songs || result || [] 
          if (Array.isArray(songs)) {
            for (const song of songs) {
              if (song.title && song.lyrics) {
                await saveData((session.user as any).id, 'songs', song)
              }
            }
            return NextResponse.json({ success: true, count: songs.length })
          }
        } else {
          const errText = await res.text()
          console.error(`AI Backend failed (${res.status}): ${errText}`)
        }
      } catch (e) { console.error('HF Backend bulk-songs error:', e) }
    }

    console.log('Falling back to OpenRouter for bulk song processing...')
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) throw new Error("AI Backend and API Key missing")

    const prompt = `You are a professional music librarian for a church. Analyze the following text which contains a list of songs, setlists, or raw lyrics.
    
    TASK:
    1. EXTRACT: Find each individual song in the text.
    2. IDENTIFY: Determine the correct title for each song.
    3. CLEAN: Provide the full, clean lyrics. Remove any chord notations (e.g., [C], G7, Am), speaker names (e.g., "Pastor:"), or irrelevant metadata.
    4. STRUCTURE: Break the lyrics into logical verses/choruses if possible, separated by single newlines.
    
    Return a JSON array of objects. Respond ONLY with the JSON array.
    
    Format:
    [
      { "title": "Song Title", "lyrics": "Full lyrics text..." },
      ...
    ]

    Content to process:
    "${content}"`

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://clcctheoai.vercel.app',
        'X-Title': 'Theo AI'
      },
      body: JSON.stringify({
        model: 'google/gemma-3-27b-it:free', 
        messages: [{ role: 'system', content: 'You are a professional music librarian.' }, { role: 'user', content: prompt }],
      })
    })

    const data = await res.json()
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('OpenRouter Error Data:', data)
      throw new Error(data.error?.message || "AI failed to process the request")
    }

    let rawContent = data.choices[0].message.content.trim()
    if (rawContent.startsWith('```')) {
      rawContent = rawContent.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim()
    }

    let songs = []
    try {
      songs = JSON.parse(rawContent)
      // Sometimes AI wraps it in an object like { "songs": [...] }
      if (!Array.isArray(songs) && songs.songs) songs = songs.songs
    } catch (e) {
      console.error('Failed to parse AI JSON:', rawContent)
      throw new Error("AI returned invalid JSON. Please try a smaller batch.")
    }

    if (Array.isArray(songs)) {
      for (const song of songs) {
        if (song.title && song.lyrics) {
          await saveData((session.user as any).id, 'songs', song)
        }
      }
      return NextResponse.json({ success: true, count: songs.length })
    }

    return NextResponse.json({ success: false, error: 'No songs found in the processed text.' })
  } catch (error: any) {
    console.error('Bulk Upload Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
