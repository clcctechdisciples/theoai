import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

const getSongsFile = () => {
  const dbPath = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true })
  const songsFile = path.join(dbPath, 'songs.json')
  if (!fs.existsSync(songsFile)) fs.writeFileSync(songsFile, JSON.stringify([]))
  return songsFile
}

export async function GET() {
  try {
    const file = getSongsFile()
    const data = JSON.parse(fs.readFileSync(file, 'utf8'))
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const song = await req.json()
    const file = getSongsFile()
    const songs = JSON.parse(fs.readFileSync(file, 'utf8'))
    
    // update if exists, otherwise push
    const existingIdx = songs.findIndex((s: any) => s.title === song.title)
    if (existingIdx > -1) {
      songs[existingIdx] = { ...songs[existingIdx], ...song, updatedAt: new Date().toISOString() }
    } else {
      songs.push({ ...song, id: Date.now().toString(), createdAt: new Date().toISOString() })
    }
    
    fs.writeFileSync(file, JSON.stringify(songs, null, 2))
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
