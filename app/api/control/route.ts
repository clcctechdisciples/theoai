let globalState = {
  mode: 'idle', // idle | worship | sermon
  scripture: null as { reference: string, text: string } | null,
  lyricLines: [] as string[],
  lyricSection: '', // Verse, Chorus, etc.
  backgroundUrl: null as string | null,
}

export async function GET() {
  return Response.json(globalState)
}

export async function POST(req: Request) {
  const data = await req.json()
  
  if (data.action === 'setMode') {
    globalState.mode = data.mode
    // Clear display stuff when switching to idle
    if (data.mode === 'idle') {
      globalState.lyricLines = []
      globalState.scripture = null
    }
  } else if (data.action === 'setScripture') {
    globalState.scripture = data.scripture
    globalState.mode = 'scripture'
  } else if (data.action === 'setLyrics') {
    globalState.lyricLines = data.lines
    globalState.lyricSection = data.section || ''
    globalState.mode = 'worship'
  } else if (data.action === 'setBackground') {
    globalState.backgroundUrl = data.url
  }

  return Response.json({ success: true, state: globalState })
}
