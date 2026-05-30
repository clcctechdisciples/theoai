import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { saveData } from '@/lib/db'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as any
  const userId = user.id === 'admin' ? '00000000-0000-0000-0000-000000000000' : user.id

  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    if (files.length === 0) return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })

    const validSlides = []
    const backendUrl = process.env.AI_BACKEND_URL?.replace(/\/$/, '')

    for (const file of files) {
      console.log('Processing file:', file.name, 'Type:', file.type)
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      const isImage = file.type.startsWith('image/') || file.name.match(/\.(png|jpg|jpeg|gif|webp)$/i)
      
      if (isImage) {
        const base64 = buffer.toString('base64')
        const mimeType = file.type || 'image/png'
        const dataUri = `data:${mimeType};base64,${base64}`

        // AI SLIDE ANALYSIS:
        // We'll use AI to determine if this image is actually a presentation slide
        // This prevents "picking" random pictures from a PDF that aren't slides
        let isActuallyASlide = true 

        if (backendUrl && backendUrl !== 'https://huggingface.co/spaces/your-space-url') {
          try {
            console.log('Calling AI Vision to verify slide:', file.name)
            const res = await fetch(`${backendUrl}/api/verify-slide`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: dataUri })
            })
            if (res.ok) {
              const analysis = await res.json()
              isActuallyASlide = analysis.is_slide
              console.log(`AI Analysis for ${file.name}: ${isActuallyASlide ? 'SLIDE' : 'NOT A SLIDE'}`)
            }
          } catch (e) {
            console.error("AI Slide Analysis error", e)
          }
        }

        if (isActuallyASlide) {
          const slide = await saveData(userId, 'slides' as any, {
            title: file.name,
            url: dataUri
          })
          validSlides.push(slide)
        }
      } else {
        // Fallback for non-image files
        console.log('Saving non-image file:', file.name)
        const slide = await saveData(userId, 'slides' as any, {
          title: file.name,
          url: `data:application/octet-stream;base64,${buffer.toString('base64')}`
        })
        validSlides.push(slide)
      }
    }

    if (validSlides.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid slides were processed.' })
    }

    return NextResponse.json({ success: true, slides: validSlides })
  } catch (error: any) {
    console.error('Slide upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
