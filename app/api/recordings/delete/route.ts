import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { filename } = await req.json()
    if (!filename) return new NextResponse('Missing filename', { status: 400 })

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
