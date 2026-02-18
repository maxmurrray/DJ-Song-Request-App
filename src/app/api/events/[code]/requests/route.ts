import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { createRequestSchema } from '@/lib/validations'
import { checkRateLimit } from '@/lib/rate-limit'
import { sendSMS } from '@/lib/twilio'

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    // Rate limit
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { allowed } = checkRateLimit(ip)
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
    }

    // Validate
    const body = await req.json()
    const parsed = createRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    // Check event
    const event = await prisma.event.findUnique({ where: { code: params.code } })
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    if (!event.acceptingRequests) {
      return NextResponse.json({ error: 'This event is not accepting requests right now.' }, { status: 403 })
    }

    // Duplicate check (same song + event within 2 minutes)
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000)
    const duplicate = await prisma.request.findFirst({
      where: {
        eventId: event.id,
        songTitle: parsed.data.songTitle,
        createdAt: { gte: twoMinAgo },
      },
    })
    if (duplicate) {
      return NextResponse.json({ error: 'This song was just requested. Try again shortly.' }, { status: 409 })
    }

    // Create request
    const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 16)
    const songRequest = await prisma.request.create({
      data: {
        eventId: event.id,
        songTitle: parsed.data.songTitle,
        artistName: parsed.data.artistName,
        spotifyTrackId: parsed.data.spotifyTrackId || null,
        note: parsed.data.note || null,
        ipHash,
      },
    })

    // Send SMS (non-blocking — don't fail the request if SMS fails)
    const smsBody = `🎧 New request for ${event.djName}: ${parsed.data.songTitle} — ${parsed.data.artistName} | Note: ${parsed.data.note || 'none'}`
    sendSMS(event.djPhone, smsBody).catch(() => {})

    return NextResponse.json(songRequest, { status: 201 })
  } catch (error) {
    console.error('Create request error:', error)
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const password = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const event = await prisma.event.findUnique({ where: { code: params.code } })
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const requests = await prisma.request.findMany({
      where: { eventId: event.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error('List requests error:', error)
    return NextResponse.json({ error: 'Failed to list requests' }, { status: 500 })
  }
}
