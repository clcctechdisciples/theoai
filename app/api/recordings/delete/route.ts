import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { filename } = await req.json()
    if (!filename) return new NextResponse('Missing filename', { status: 400 })

    const session = await getServerSession(authOptions)
    if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })
    const userId = (session.user as any).id

    if (!filename.startsWith(`${userId}/`)) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const exportsDir = path.join(process.cwd(), 'exports')
    const filePath = path.join(exportsDir, filename)

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
