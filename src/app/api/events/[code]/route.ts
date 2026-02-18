import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { code: params.code },
      include: { _count: { select: { requests: true } } },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Return public info only — no djPhone
    return NextResponse.json({
      id: event.id,
      code: event.code,
      djName: event.djName,
      venmoUsername: event.venmoUsername,
      acceptingRequests: event.acceptingRequests,
      tipAmounts: event.tipAmounts,
      _count: event._count,
    })
  } catch (error) {
    console.error('Get event error:', error)
    return NextResponse.json({ error: 'Failed to get event' }, { status: 500 })
  }
}

export async function PATCH(
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

    const updated = await prisma.event.update({
      where: { code: params.code },
      data: { acceptingRequests: !event.acceptingRequests },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Toggle event error:', error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}
