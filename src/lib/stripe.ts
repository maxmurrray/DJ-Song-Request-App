import Stripe from 'stripe'

interface CreateCheckoutParams {
  amount: number
  eventCode: string
  eventId: string
  requestId?: string
}

export async function createCheckoutSession(params: CreateCheckoutParams): Promise<string | null> {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000'

  if (!secretKey) {
    console.warn('STRIPE_SECRET_KEY not set — skipping checkout')
    return null
  }

  try {
    const stripe = new Stripe(secretKey)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'DJ Tip' },
            unit_amount: params.amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        eventId: params.eventId,
        ...(params.requestId ? { requestId: params.requestId } : {}),
      },
      success_url: `${baseUrl}/e/${params.eventCode}?tipped=1`,
      cancel_url: `${baseUrl}/e/${params.eventCode}`,
    })
    return session.url
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return null
  }
}
