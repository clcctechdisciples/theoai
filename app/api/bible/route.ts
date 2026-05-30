export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ref = searchParams.get('ref')
  const translation = (searchParams.get('translation') || 'kjv').toLowerCase()

  if (!ref) {
    return Response.json({ error: 'Missing scripture reference' }, { status: 400 })
  }

  // List of versions that bible-api.com supports (public domain)
  const publicDomainVersions = ['kjv', 'asv', 'web', 'bbe', 'almeida']
  
  if (!publicDomainVersions.includes(translation)) {
    try {
      const apiKey = process.env.OPENROUTER_API_KEY
      if (!apiKey || apiKey === 'sk-or-v1-placeholder') {
        throw new Error("OpenRouter API key missing. Please configure OPENROUTER_API_KEY for non-KJV versions.")
      }

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
            { 
              role: 'system', 
              content: 'You are a professional Bible scholar. Provide the exact text for the requested Bible reference in the specified translation. Respond ONLY with valid JSON and no markdown formatting.' 
            },
            { 
              role: 'user', 
              content: `Provide the text for "${ref}" in the ${translation.toUpperCase()} translation. 
              If it is a single verse, respond with exactly: { "reference": "...", "text": "..." }
              If it is a chapter or range, respond with exactly: { "reference": "...", "verses": [{ "verse": 1, "text": "..." }, ...] }` 
            }
          ],
          response_format: { type: "json_object" }
        })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenRouter API returned ${res.status}`);
      }

      const data = await res.json()
      let contentString = data.choices[0].message.content.trim()
      
      // Remove potential markdown code blocks
      if (contentString.startsWith('```')) {
        contentString = contentString.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      }
      
      try {
        const content = JSON.parse(contentString)
        return Response.json(content)
      } catch (parseError) {
        console.error('Failed to parse AI response:', contentString)
        throw new Error('Invalid JSON received from AI')
      }

    } catch (error: any) {
      console.error('AI Bible retrieval error:', error)
      // Fallback: If AI fails, try to see if bible-api.com can handle it anyway (sometimes it supports more)
    }
  }

  try {
    const res = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}?translation=${translation}`)
    const data = await res.json()

    if (data.error) {
      // If we already tried AI and failed, and now bible-api.com also fails
      return Response.json({ error: `Version ${translation.toUpperCase()} is not available or the reference is invalid.` }, { status: 404 })
    }

    if (data.verses && data.verses.length > 1) {
      return Response.json({
        reference: data.reference,
        verses: data.verses.map((v: any) => ({
          verse: v.verse,
          text: v.text.trim()
        }))
      })
    }

    return Response.json({
      reference: data.reference,
      text: data.text.trim(),
    })
  } catch (error: any) {
    console.error('Bible API error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
