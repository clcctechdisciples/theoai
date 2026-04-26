import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const audioChunk = formData.get('audio') as Blob
    const sessionId = formData.get('sessionId') as string
    const mode = formData.get('mode') as string

    if (!audioChunk || !sessionId) {
      return NextResponse.json({ error: 'Missing audio or session ID' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as any).id

    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `${dateStr}-${mode}-${sessionId}.webm`

    const arrayBuffer = await audioChunk.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Find existing recording for this session or create new one
    const existing = await prisma.recording.findFirst({
      where: { userId, filename }
    })

    if (existing) {
      // Append to existing data
      const newData = existing.data ? Buffer.concat([existing.data, buffer]) : buffer
      await prisma.recording.update({
        where: { id: existing.id },
        data: { data: newData }
      })
    } else {
      // Create new recording
      await prisma.recording.create({
        data: {
          title: filename.replace('.webm', ''),
          filename,
          type: mode,
          data: buffer,
          userId
        }
      })
    }

    return NextResponse.json({ success: true, file: filename })
  } catch (err: any) {
    console.error('Recording upload error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

