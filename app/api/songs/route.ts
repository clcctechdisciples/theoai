import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getData, saveData } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  try {
    const data = await getData((session.user as any).id)
    return NextResponse.json(data.songs)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const song = await req.json()
    console.log('API: Saving song for user:', (session.user as any).id, song.title)
    const result = await saveData((session.user as any).id, 'songs', song)
    console.log('API: Song saved successfully:', result.id)
    return NextResponse.json({ success: true, id: result.id })
  } catch (err: any) {
    console.error('API: Song save error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
