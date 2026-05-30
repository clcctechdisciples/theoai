import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { text, fileName } = await req.json()
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) throw new Error("AI API Key missing")

    const prompt = `You are an AI presentation expert. Analyze the following text extracted from a PDF presentation file: "${fileName}".
    
    TASK:
    1. SEGMENT: Break the text into individual, logical slides.
    2. TITLIZE: Create a clear, bold title for each slide.
    3. CONDENSE: Summarize the main points for each slide into 2-4 clean, readable lines.
    4. STYLE: Ensure the content is suitable for a large church projector screen.
    
    Return a JSON object with a "slides" array. Respond ONLY with the JSON.
    
    Format:
    {
      "slides": [
        { "title": "Slide Title", "content": "Point 1\nPoint 2\nPoint 3" },
        ...
      ]
    }

    Text to process:
    "${text}"`

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://clcctheoai.vercel.app',
        'X-Title': 'Theo AI'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: 'You are a professional presentation designer. Respond ONLY with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      })
    })

    const data = await res.json()
    let rawContent = data.choices[0].message.content.trim()
    
    if (rawContent.includes('```')) {
      rawContent = rawContent.replace(/```json\s?/, '').replace(/```\s?/, '').trim()
    }

    const result = JSON.parse(rawContent)
    return NextResponse.json({ success: true, slides: result.slides || [] })

  } catch (error: any) {
    console.error('AI Slide Extraction Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
