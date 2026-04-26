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
          model: 'google/gemini-flash-1.5',
          messages: [
            { role: 'system', content: 'You are a Bible scholar. Provide the exact text for the requested reference and translation.' },
            { role: 'user', content: `Provide the text for "${ref}" in the ${translation.toUpperCase()} translation. Respond ONLY with valid JSON: { "reference": "${ref}", "text": "..." }` }
          ],
          response_format: { type: 'json_object' }
        })
      })

      const data = await res.json()
      const content = JSON.parse(data.choices[0].message.content)
      
      return Response.json({
        reference: content.reference || ref,
        text: content.text.trim(),
      })
    } catch (error: any) {
      console.error('AI Bible retrieval error:', error)
      return Response.json({ error: 'Failed to retrieve scripture via AI' }, { status: 500 })
    }
  }

  try {
    const res = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}?translation=${translation}`)
    const data = await res.json()

    if (data.error) {
      return Response.json({ error: data.error }, { status: 404 })
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
