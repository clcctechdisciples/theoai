import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const filename = url.searchParams.get('file')
  
  if (!filename) {
    return new NextResponse('Missing file parameter', { status: 400 })
  }

  const session = await getServerSession(authOptions)
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })
  const userId = (session.user as any).id

  try {
    const record = await prisma.recording.findFirst({
      where: { userId, filename }
    })

    if (!record || !record.data) {
      return new NextResponse('File not found', { status: 404 })
    }

    // Determine mime
    const ext = filename.split('.').pop()?.toLowerCase()
    let mimeType = 'audio/webm'
    if (ext === 'mp3') mimeType = 'audio/mpeg'
    if (ext === 'wav') mimeType = 'audio/wav'

    const headers = new Headers()
    headers.set('Content-Type', mimeType)
    headers.set('Content-Length', record.data.length.toString())
    
    if (url.searchParams.get('download')) {
       headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    }

    return new NextResponse(record.data, { headers })

  } catch (err: any) {
    return new NextResponse(err.message, { status: 500 })
  }
}

