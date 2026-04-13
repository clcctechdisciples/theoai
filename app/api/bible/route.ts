export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ref = searchParams.get('ref')

  if (!ref) {
    return Response.json({ error: 'Missing scripture reference' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}`)
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
