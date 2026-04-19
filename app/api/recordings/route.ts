import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const exportsDir = path.join(process.cwd(), 'exports', userId)
  
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
        duration: 'Unknown', 
        type: file.split('.').pop()?.toUpperCase() || 'Audio',
        filename: `${userId}/${file}`
      }
    })

    return NextResponse.json(recordings)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
