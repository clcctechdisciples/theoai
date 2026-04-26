import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  try {
    const records = await prisma.recording.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
    
    const recordings = records.map((rec) => ({
      id: rec.id,
      title: rec.title,
      date: rec.createdAt.toLocaleDateString(),
      duration: 'Unknown', 
      type: rec.type.toUpperCase(),
      filename: rec.filename
    }))

    return NextResponse.json(recordings)
  } catch (err: any) {
    console.error('List recordings error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

