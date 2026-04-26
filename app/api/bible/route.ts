export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ref = searchParams.get('ref')
  const translation = (searchParams.get('translation') || 'kjv').toLowerCase()

  if (!ref) {
    return Response.json({ error: 'Missing scripture reference' }, { status: 400 })
  }

  const copyrightedVersions = ['nlt', 'niv', 'amp']
  
  if (copyrightedVersions.includes(translation)) {
    try {
      const apiKey = process.env.OPENROUTER_API_KEY
      if (!apiKey) throw new Error("API key missing for AI scripture retrieval")

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://clcctheoai.vercel.app',
          'X-Title': 'Theo AI'
        },
        body: JSON.stringify({
          model: 'google/gemini-pro-1.5', // Using Pro for better accuracy with verse lists
          messages: [
            { role: 'system', content: 'You are a Bible scholar. Provide the text for the requested reference. If it is a chapter, provide a list of verses.' },
            { role: 'user', content: `Provide the text for "${ref}" in the ${translation.toUpperCase()} translation. 
            If it is a single verse, respond with: { "reference": "...", "text": "..." }
            If it is a chapter or range, respond with: { "reference": "...", "verses": [{ "verse": 1, "text": "..." }, ...] }
            Respond ONLY with valid JSON.` }
          ],
          response_format: { type: 'json_object' }
        })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      
      const content = JSON.parse(data.choices[0].message.content)
      return Response.json(content)

    } catch (error: any) {
      console.error('AI Bible retrieval error:', error)
      return Response.json({ error: 'Failed to retrieve scripture via AI: ' + error.message }, { status: 500 })
    }
  }

  try {
    const res = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}?translation=${translation}`)
    const data = await res.json()

    if (data.error) {
      return Response.json({ error: data.error }, { status: 404 })
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
