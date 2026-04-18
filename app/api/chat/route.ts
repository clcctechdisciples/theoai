import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json()
    
    // Prepare the messages with context if available
    const systemMessage = context 
      ? { role: 'system', content: `You are Theo AI, a helpful church media assistant. Context for this request: ${context}` }
      : { role: 'system', content: 'You are Theo AI, a helpful church media assistant.' }

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
