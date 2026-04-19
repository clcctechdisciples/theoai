import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getData, saveData } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const data = getData((session.user as any).id)
  return NextResponse.json(data.backgrounds)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const backgrounds = await req.json()
  saveData((session.user as any).id, 'backgrounds', backgrounds)
  return NextResponse.json({ success: true })
}
