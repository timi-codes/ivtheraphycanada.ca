import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.redirect(new URL('/login', req.url))

  const vendorUser = await prisma.vendorUser.findFirst({
    where: { userId: session.user.id },
    include: { vendor: true },
  })

  const vendor = vendorUser?.vendor
  if (!vendor?.stripeCustomerId) {
    return NextResponse.redirect(new URL('/dashboard/billing', req.url))
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: vendor.stripeCustomerId,
    return_url: `${siteUrl}/dashboard/billing`,
  })

  return NextResponse.redirect(portalSession.url, 303)
}
