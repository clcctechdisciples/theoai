import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const filename = url.searchParams.get('file')
  
  if (!filename) {
    return new NextResponse('Missing file parameter', { status: 400 })
  }

  const exportsDir = path.join(process.cwd(), 'exports')
  const filePath = path.join(exportsDir, filename)

  if (!fs.existsSync(filePath)) {
    return new NextResponse('File not found', { status: 404 })
  }

  try {
    const fileBuffer = fs.readFileSync(filePath)
    
    // Determine mime
    const ext = filename.split('.').pop()?.toLowerCase()
    let mimeType = 'audio/webm'
    if (ext === 'mp3') mimeType = 'audio/mpeg'
    if (ext === 'wav') mimeType = 'audio/wav'

    const headers = new Headers()
    headers.set('Content-Type', mimeType)
    headers.set('Content-Length', fileBuffer.length.toString())
    
    if (url.searchParams.get('download')) {
       headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    }

    return new NextResponse(fileBuffer, { headers })

  } catch (err: any) {
    return new NextResponse(err.message, { status: 500 })
  }
}
