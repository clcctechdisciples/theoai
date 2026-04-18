import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json()
    
    // Prepare the messages with context if available
    const basePrompt = `You are the Theo AI support assistant — a technical helper built into the Theo AI church media web application.

Your ONLY role is to help users with technical issues directly related to this web app. This includes:
- How to use the Worship Engine (lyrics, verse queue, projector display)
- How to use the Sermon Engine (transcription, scripture detection, summaries)
- How to use the Audio Engine and Audio Archive
- How to configure displays, backgrounds, and projector modes
- How to create accounts and log in
- Troubleshooting features within this app

You CANNOT and MUST NOT:
- Claim to transcribe audio, play media, or control external devices — those are handled by browser APIs, not by you
- Write sermons, compose worship songs, or generate Bible studies
- Answer general theology, spiritual, or church-ministry questions
- Pretend to have access to files, databases, or the projector state directly
- Offer to "do" anything outside of answering text-based help questions about this app

If a user asks something outside your scope, politely explain: "I'm only able to help with technical questions about this Theo AI web app." Keep responses concise and practical.

${context ? `Current app context: ${context}` : ''}`

    const systemMessage = { role: 'system', content: basePrompt }

    const openRouterMessages = [systemMessage, ...messages]

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not set in environment variables");
    }

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'Theo AI',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openrouter/auto',
        messages: openRouterMessages,
      })
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`OpenRouter returned ${res.status}: ${err}`)
    }

    const data = await res.json()
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error("No response choices returned from OpenRouter");
    }

    return NextResponse.json({ response: data.choices[0].message.content })
  } catch (error: any) {
    console.error('Chat routing error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
