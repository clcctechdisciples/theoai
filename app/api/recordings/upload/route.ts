import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  const exportsDir = path.join(process.cwd(), 'exports')
  if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true })

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
    const userDir = path.join(exportsDir, userId)
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true })
    
    const filename = `${dateStr}-${mode}-${sessionId}.webm`
    const filePath = path.join(userDir, filename)

    // Convert Blob to Buffer and append to file
    const arrayBuffer = await audioChunk.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    fs.appendFileSync(filePath, buffer)

    return NextResponse.json({ success: true, file: filename })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
