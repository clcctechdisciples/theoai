import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRecordingByFilename, addRecording, updateRecording } from '@/lib/db'

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
    const existing = await getRecordingByFilename(userId, filename)

    if (existing) {
      // Append to existing data
      let existingBuffer = Buffer.alloc(0)
      if (existing.data) {
        existingBuffer = Buffer.from(existing.data, 'base64')
      }
      const newData = Buffer.concat([existingBuffer, buffer])
      await updateRecording(existing.id, { data: newData })
    } else {
      // Create new recording
      await addRecording({
        title: filename.replace('.webm', ''),
        filename,
        type: mode,
        data: buffer,
        userId
      })
    }

    return NextResponse.json({ success: true, file: filename })
  } catch (err: any) {
    console.error('Recording upload error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
