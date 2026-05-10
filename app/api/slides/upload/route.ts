import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { saveData } from '@/lib/db'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    if (files.length === 0) return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })

    const validSlides = []
    const backendUrl = process.env.AI_BACKEND_URL?.replace(/\/$/, '')

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64 = buffer.toString('base64')
      const dataUri = `data:${file.type};base64,${base64}`

      let isSlide = true // default to true if AI filtering fails

      if (backendUrl) {
        try {
          const res = await fetch(`${backendUrl}/api/filter-slide`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_url: dataUri })
          })
          if (res.ok) {
            const data = await res.json()
            isSlide = data.is_slide
          } else {
            console.error("Failed to filter slide via HF backend:", await res.text())
          }
        } catch (e) {
          console.error("Error calling filter-slide API", e)
        }
      }

      if (isSlide) {
        // Save to DB
        const slide = await saveData((session.user as any).id, 'slides' as any, {
          title: file.name,
          url: dataUri
        })
        validSlides.push(slide)
      }
    }

    if (validSlides.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid presentation slides detected.' })
    }

    return NextResponse.json({ success: true, slides: validSlides })
  } catch (error: any) {
    console.error('Slide upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
