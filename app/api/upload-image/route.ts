import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('image') as File | null
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Convert directly to base64 Data URI to solve Next.js hot-serving public cache issues
    const mimeType = file.type || 'image/png'
    const base64Data = buffer.toString('base64')
    const dataUri = `data:${mimeType};base64,${base64Data}`

    return NextResponse.json({ url: dataUri })

  } catch (error: any) {
    console.error('Image upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
