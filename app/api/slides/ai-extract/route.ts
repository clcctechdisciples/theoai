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
    
    CRITICAL INSTRUCTIONS:
    1. PRESERVE STRUCTURE: The text contains "--- PAGE X ---" markers. Treat each page marker as a potential new slide. Do not skip pages that contain useful information.
    2. TITLIZE: Every slide MUST have a clear, concise title at the top.
    3. EXTRACT CONTENT: Extract the core bullet points or main text from each page. 
    4. NO OVER-SUMMARIZATION: Do not merge 5 pages into 1 slide. Aim for a 1:1 or near 1:1 mapping between PDF pages and generated slides, unless a page is clearly just a duplicate or empty.
    5. CLEANUP: Remove any artifacts from text extraction like page numbers in corners or repetitive headers/footers.
    
    Return a JSON object with a "slides" array. Respond ONLY with the JSON.
    
    Format:
    {
      "slides": [
        { "title": "Slide Title", "content": "Bullet point 1\nBullet point 2\nBullet point 3" },
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
