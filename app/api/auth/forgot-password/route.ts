import { NextResponse } from 'next/server'
import { getUsers, resetPassword } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { action, username, recoveryAnswer, newPassword } = await req.json()

    if (action === 'getQuestion') {
      const users = await getUsers()
      const user = users.find((u: any) => u.username === username)
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      return NextResponse.json({ question: user.securityQuestion })
    }

    if (action === 'reset') {
      const users = await getUsers()
      const user = users.find((u: any) => u.username === username)
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

      const isAnswerCorrect = user.securityAnswer 
        ? await bcrypt.compare(recoveryAnswer.toLowerCase().trim(), user.securityAnswer)
        : false
        
      if (!isAnswerCorrect) return NextResponse.json({ error: 'Incorrect recovery answer' }, { status: 401 })

      const hashedNewPassword = await bcrypt.hash(newPassword, 10)
      await resetPassword(username, hashedNewPassword)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
