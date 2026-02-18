import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createEventSchema } from '@/lib/validations'
import { nanoid } from 'nanoid'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = createEventSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const event = await prisma.event.create({
      data: {
        code: nanoid(8),
        djName: parsed.data.djName,
        djPhone: parsed.data.djPhone,
        venmoUsername: parsed.data.venmoUsername || null,
        spotifyPlaylistId: parsed.data.spotifyPlaylistId || null,
        tipAmounts: parsed.data.tipAmounts || '2,5,10',
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Create event error:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const password = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const events = await prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { requests: true } } },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('List events error:', error)
    return NextResponse.json({ error: 'Failed to list events' }, { status: 500 })
  }
}
