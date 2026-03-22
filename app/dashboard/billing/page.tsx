export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const PLANS = [
  { key: 'free', name: 'Free', price: 0, priceId: null },
  { key: 'standard', name: 'Standard', price: 149, priceId: process.env.STRIPE_STANDARD_PRICE_ID },
  { key: 'premium', name: 'Premium', price: 299, priceId: process.env.STRIPE_PREMIUM_PRICE_ID },
  { key: 'exclusive', name: 'Exclusive', price: 499, priceId: process.env.STRIPE_EXCLUSIVE_PRICE_ID },
]

export default async function BillingPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  const vendorUser = session ? await prisma.vendorUser.findFirst({
    where: { userId: session.user.id },
    include: { vendor: true },
  }) : null

  const vendor = vendorUser?.vendor
  const currentPlan = PLANS.find((p) => p.key === vendor?.plan) ?? PLANS[0]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Billing & Plan</h1>

      {/* Current plan */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Current Plan</p>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{currentPlan.name}</h2>
              <Badge variant={vendor?.plan === 'premium' || vendor?.plan === 'exclusive' ? 'premium' : vendor?.plan === 'standard' ? 'teal' : 'gray'}>
                Active
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">
              {currentPlan.price === 0 ? 'Free forever' : `$${currentPlan.price}/mo CAD`}
            </p>
          </div>
          {vendor?.stripeSubscriptionId && (
            <form action="/api/stripe/portal" method="post">
              <Button variant="outline" type="submit">Manage Subscription</Button>
            </form>
          )}
        </div>
      </div>

      {/* Upgrade options */}
      <h2 className="font-bold text-gray-900 mb-4">
        {vendor?.plan === 'free' ? 'Upgrade Your Plan' : 'Change Plan'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLANS.filter((p) => p.key !== vendor?.plan).map((plan) => (
          <div key={plan.key} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-gray-900">{plan.name}</p>
                <p className="text-[#1E1E2C] font-semibold">
                  {plan.price === 0 ? 'Free' : `$${plan.price}/mo`}
                </p>
              </div>
              {plan.priceId ? (
                <form action="/api/stripe/checkout" method="post">
                  <input type="hidden" name="priceId" value={plan.priceId} />
                  <Button size="sm" type="submit">
                    {(plan.price > (currentPlan.price)) ? 'Upgrade' : 'Downgrade'}
                  </Button>
                </form>
              ) : (
                <Badge variant="gray">Current</Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-500">
        <p>Stripe integration will be activated in Phase 8. Contact{' '}
          <a href="mailto:hello@ivtherapycanada.ca" className="text-[#1E1E2C]">hello@ivtherapycanada.ca</a>{' '}
          to manually upgrade your plan.
        </p>
      </div>
    </div>
  )
}
