import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const PLAN_BY_PRICE: Record<string, string> = {
  [process.env.STRIPE_STANDARD_PRICE_ID ?? '']: 'standard',
  [process.env.STRIPE_PREMIUM_PRICE_ID ?? '']: 'premium',
  [process.env.STRIPE_EXCLUSIVE_PRICE_ID ?? '']: 'exclusive',
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const vendorId = session.metadata?.vendorId
      const subscriptionId = session.subscription as string

      if (vendorId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id
        const plan = PLAN_BY_PRICE[priceId] ?? 'standard'

        await prisma.vendor.update({
          where: { id: vendorId },
          data: { plan, stripeSubscriptionId: subscriptionId },
        })
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await prisma.vendor.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { plan: 'free', stripeSubscriptionId: null },
      })
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      console.log('Payment failed for customer:', invoice.customer)
      // TODO: send email notification via Resend
      break
    }
  }

  return NextResponse.json({ received: true })
}
