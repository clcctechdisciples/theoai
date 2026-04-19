import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { transcript, mode } = await req.json();
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ type: 'none', error: 'API key missing' });
    }

    const prompt = `You are an AI church media assistant. Analyze the following transcript from a live church service ${mode === 'sermon' ? '(during a sermon)' : '(during worship)'}.
    
    TASK:
    1. If the speaker is quoting a Bible verse (e.g., "John 3:16" or "The Lord is my shepherd"), identify it.
    2. If the speaker is singing or reciting worship lyrics, format them into 2-4 clean lines.
    3. If it's just general speaking/filler, return type "none".

    Transcript: "${transcript}"

    Respond ONLY with a JSON object:
    {
      "type": "scripture" | "lyrics" | "none",
      "content": {
        "reference": "Reference string (e.g. Genesis 1:1) if scripture",
        "text": "Full verse text if scripture",
        "lines": ["Array of formatted lines if lyrics"]
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
        model: 'google/gemini-flash-1.5', // Faster and cheaper for this task
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
