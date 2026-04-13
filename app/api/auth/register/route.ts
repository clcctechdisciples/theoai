import { NextResponse } from 'next/server'
import { getUsers, addUser } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()
    
    if (!username || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const users = getUsers()
    if (users.find((u: any) => u.username === username)) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    addUser({ id: Date.now().toString(), username, password: hashedPassword })
    
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
