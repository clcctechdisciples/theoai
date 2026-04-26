import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save the file
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'slides')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (e) {}

    const filename = `${uuidv4()}-${file.name}`
    const path = join(uploadDir, filename)
    await writeFile(path, buffer)

    const publicUrl = `/uploads/slides/${filename}`

    // For a real production app, we would use a library like 'pdf-img-convert' 
    // to turn PDF pages into images. For now, we will return the PDF as a single "slide"
    // or a set of slides if we could parse it.
    
    // Placeholder: Return a single slide for the uploaded file
    const slides = [
      {
        id: uuidv4(),
        url: publicUrl,
        title: file.name,
        type: file.type
      }
    ]

    return NextResponse.json({ success: true, slides })
  } catch (error: any) {
    console.error('Slide upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
