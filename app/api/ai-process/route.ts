import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { transcript, mode } = await req.json();
    const backendUrl = process.env.AI_BACKEND_URL;

    if (backendUrl) {
      const cleanUrl = backendUrl.replace(/\/$/, '')
      try {
        const res = await fetch(`${cleanUrl}/api/ai-process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript, mode })
        })
        if (res.ok) {
          const result = await res.json()
          return NextResponse.json(result)
        }
      } catch (e) { console.error('HF Backend ai-process error:', e) }
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ type: 'none', error: 'AI Backend and API Key missing' });
    }

    const prompt = `You are an elite AI church media assistant specializing in real-time lyric and scripture detection. 
    
    ANALYSIS MODE: ${mode === 'sermon' ? 'SERMON' : 'WORSHIP'}
    
    TASK:
    1. SCRIPTURE: Identify ANY quoted Bible verses. Even if only part of a verse is spoken (e.g., "The Lord is my shepherd"), find the full verse and reference.
    2. LYRICS: If worship music is detected, extract the lyrics. 
       - Clean up any repetition or filler words (e.g., "Oh", "Yeah", "Praise the Lord").
       - Format into exactly 2-4 lines suitable for a projector screen.
       - Use proper capitalization and punctuation.
    3. REJECTION: If it's general speaking, announcements, or noise, return type "none".

    TRANSCRIPT: "${transcript}"

    Respond ONLY with a valid JSON object:
    {
      "type": "scripture" | "lyrics" | "none",
      "content": {
        "reference": "Reference string (e.g. Romans 8:28) [Empty if not scripture]",
        "text": "Full authoritative verse text [Empty if not scripture]",
        "lines": ["Clean line 1", "Clean line 2"] // [Empty if not lyrics]
      }
    }`;

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'Theo AI',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemma-3-27b-it:free',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter error: ${err}`);
    }

    const data = await res.json();
    const content = data.choices[0].message.content;
    const result = JSON.parse(content);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI Process Route Error:', error);
    return NextResponse.json({ type: 'none', error: error.message }, { status: 500 });
  }
}
