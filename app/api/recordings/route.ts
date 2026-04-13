import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

export async function GET() {
  const exportsDir = path.join(process.cwd(), 'exports')
  
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true })
  }

  try {
    const files = fs.readdirSync(exportsDir)
    
    const recordings = files.map((file, i) => {
      const stats = fs.statSync(path.join(exportsDir, file))
      return {
        id: i,
        title: file.replace(/\.(wav|mp3|webm)$/i, ''),
        date: stats.birthtime.toLocaleDateString(),
        // mock duration for now since reading deep audio metadata requires extra libs
        duration: 'Unknown', 
        type: file.split('.').pop()?.toUpperCase() || 'Audio',
        filename: file
      }
    })

    return NextResponse.json(recordings)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
