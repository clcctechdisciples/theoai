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
      
      // Handle image types
      if (file.type.startsWith('image/')) {
        const base64 = buffer.toString('base64')
        const dataUri = `data:${file.type};base64,${base64}`

        let isSlide = true // default to true

        if (backendUrl && backendUrl !== 'https://huggingface.co/spaces/your-space-url') {
          try {
            const res = await fetch(`${backendUrl}/api/filter-slide`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image_url: dataUri })
            })
            if (res.ok) {
              const data = await res.json()
              isSlide = data.is_slide
            }
          } catch (e) {
            console.error("Error calling filter-slide API", e)
          }
        }

        if (isSlide) {
          const slide = await saveData((session.user as any).id, 'slides' as any, {
            title: file.name,
            url: dataUri
          })
          validSlides.push(slide)
        }
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        // PPTX Handling - for now we just acknowledge we received it
        // In a full implementation, we'd use a library or service to convert to images
        // For now, we'll return an error explaining it should be converted to PDF
        return NextResponse.json({ 
          success: false, 
          error: 'PPTX files must be exported to PDF before uploading for proper slide rendering.' 
        })
      } else if (file.type === 'application/pdf') {
        // PDF should have been handled on the client, but if it reached here:
        return NextResponse.json({ 
          success: false, 
          error: 'PDF files should be processed on the client. Please check your browser support.' 
        })
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
