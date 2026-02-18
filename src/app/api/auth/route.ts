import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    if (password === process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ authenticated: true })
    }
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
