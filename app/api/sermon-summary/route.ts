import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json()

    // Fallback to localhost if user has not yet set the backend URL
    const backendUrl = process.env.AI_BACKEND_URL || 'http://localhost:8000'

    const res = await fetch(`${backendUrl}/api/sermon-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ transcript })
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`AI Backend returned ${res.status}: ${err}`)
    }

    const data = await res.json()
    
    return NextResponse.json({ 
      summary: data.summary,
      pdfUrl: null
    })
  } catch (error: any) {
    console.error('Sermon summary proxy error:', error)
    return NextResponse.json({ error: 'Failed to generate summary: ' + error.message }, { status: 500 })
  }
}
