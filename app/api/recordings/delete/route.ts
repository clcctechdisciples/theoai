import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { filename } = await req.json()
    if (!filename) return new NextResponse('Missing filename', { status: 400 })

    const session = await getServerSession(authOptions)
    if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })
    const userId = (session.user as any).id

    await prisma.recording.deleteMany({
      where: { userId, filename }
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Delete recording error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

