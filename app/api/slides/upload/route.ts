import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { saveData } from '@/lib/db'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUri = `data:${file.type};base64,${base64}`

    // Save to DB
    const slide = await saveData((session.user as any).id, 'slides' as any, {
      title: file.name,
      url: dataUri
    })

    return NextResponse.json({ success: true, slides: [slide] })
  } catch (error: any) {
    console.error('Slide upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
