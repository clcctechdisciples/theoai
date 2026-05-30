import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { saveData } from '@/lib/db'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as any
  const userId = user.id === 'admin' ? '00000000-0000-0000-0000-000000000000' : user.id

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
                await saveData(userId, 'songs', song)
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

    const prompt = `You are a professional music librarian for a church. Analyze the following text extracted from a file (likely a .txt or .pdf) which contains multiple songs, setlists, or raw lyrics.
    
    TASK:
    1. EXTRACT: Find every distinct song within the text.
    2. TITLE: Identify the official title for each song. If no title is clear, use the first unique line.
    3. LYRICS: Provide the full, clean lyrics for each song. 
       - REMOVE: Chord symbols (e.g. [C], G, Am7), guitar tabs, or metadata like "Intro", "Outro", "Chorus x2".
       - CLEAN: Remove speaker names (e.g., "Pastor:", "Choir:").
    4. VALIDATE: Ensure every song has both a title and non-empty lyrics.
    
    Return a JSON array of objects. Respond ONLY with the JSON array.
    
    Format:
    [
      { "title": "Song Title", "lyrics": "Full clean lyrics text..." },
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
        model: 'google/gemini-2.0-flash-001', // Upgraded model for better extraction
        messages: [
          { role: 'system', content: 'You are a professional music librarian. You respond ONLY with a valid JSON array of song objects. No markdown, no explanations.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      })
    })

    const data = await res.json()
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('OpenRouter Error Data:', data)
      throw new Error(data.error?.message || "AI failed to process the request")
    }

    let rawContent = data.choices[0].message.content.trim()
    // Handle potential markdown blocks
    if (rawContent.includes('```')) {
      rawContent = rawContent.replace(/```json\s?/, '').replace(/```\s?/, '').trim()
    }

    let songs = []
    try {
      const parsed = JSON.parse(rawContent)
      songs = Array.isArray(parsed) ? parsed : (parsed.songs || [])
    } catch (e) {
      console.error('Failed to parse AI JSON:', rawContent)
      throw new Error("AI returned invalid JSON. Please try a smaller batch or check the file format.")
    }

    if (!Array.isArray(songs) || songs.length === 0) {
      return NextResponse.json({ success: false, error: "No songs could be extracted from this file." })
    }

    let savedCount = 0
    let failedCount = 0

    for (const song of songs) {
      if (song.title && song.lyrics && song.lyrics.trim().length > 10) {
        try {
          await saveData(userId, 'songs', song)
          savedCount++
        } catch (saveErr) {
          console.error(`Failed to save song "${song.title}":`, saveErr)
          failedCount++
        }
      } else {
        failedCount++
      }
    }

    return NextResponse.json({ 
      success: savedCount > 0, 
      count: savedCount,
      failed: failedCount,
      total: songs.length,
      message: savedCount > 0 ? `Successfully added ${savedCount} songs.` : "Failed to extract any valid songs."
    })
  } catch (error: any) {
    console.error('Bulk Upload Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
