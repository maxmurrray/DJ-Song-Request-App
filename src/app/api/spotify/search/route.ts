import { NextRequest, NextResponse } from 'next/server'
import { searchSpotify } from '@/lib/spotify'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  try {
    const tracks = await searchSpotify(q)
    return NextResponse.json(tracks)
  } catch {
    return NextResponse.json([])
  }
}
