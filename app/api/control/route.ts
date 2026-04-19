import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

let projectorStates: Record<string, any> = {}

const getInitialState = () => ({
  mode: 'idle',
  scripture: null,
  lyricLines: [],
  lyricSection: '',
  backgroundUrl: null,
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  
  if (!projectorStates[userId]) projectorStates[userId] = getInitialState()
  return NextResponse.json(projectorStates[userId])
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  
  if (!projectorStates[userId]) projectorStates[userId] = getInitialState()
  const state = projectorStates[userId]
  const data = await req.json()
  
  if (data.action === 'setMode') {
    state.mode = data.mode
    if (data.mode === 'idle') {
      state.lyricLines = []
      state.scripture = null
    }
  } else if (data.action === 'setScripture') {
    state.scripture = data.scripture
    state.mode = 'scripture'
  } else if (data.action === 'setLyrics') {
    state.lyricLines = data.lines
    state.lyricSection = data.section || ''
    state.mode = 'worship'
  } else if (data.action === 'setBackground') {
    state.backgroundUrl = data.url
  }

  return NextResponse.json({ success: true, state })
}
