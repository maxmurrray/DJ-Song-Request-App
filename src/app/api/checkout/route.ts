import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSchema } from '@/lib/validations'
import { createCheckoutSession } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = createCheckoutSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const event = await prisma.event.findUnique({ where: { id: parsed.data.eventId } })
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const url = await createCheckoutSession({
      amount: parsed.data.amount,
      eventCode: event.code,
      eventId: event.id,
      requestId: parsed.data.requestId,
    })

    if (!url) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
    }

    // Create tip record
    await prisma.tip.create({
      data: {
        eventId: event.id,
        requestId: parsed.data.requestId || null,
        amount: parsed.data.amount,
        provider: 'stripe',
        status: 'pending',
      },
    })

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
  }
}
