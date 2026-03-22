import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const priceId = formData.get('priceId') as string

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID required' }, { status: 400 })
    }

    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const vendorUser = await prisma.vendorUser.findFirst({
      where: { userId: session.user.id },
      include: { vendor: true },
    })

    const vendor = vendorUser?.vendor
    if (!vendor) {
      return NextResponse.json({ error: 'No vendor found' }, { status: 404 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

    // Create or use existing Stripe customer
    let customerId = vendor.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: vendor.email ?? session.user.email ?? undefined,
        name: vendor.name,
        metadata: { vendorId: vendor.id },
      })
      customerId = customer.id
      await prisma.vendor.update({
        where: { id: vendor.id },
        data: { stripeCustomerId: customerId },
      })
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/dashboard/billing?success=1`,
      cancel_url: `${siteUrl}/dashboard/billing`,
      metadata: { vendorId: vendor.id },
    })

    return NextResponse.redirect(checkoutSession.url!, 303)
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
