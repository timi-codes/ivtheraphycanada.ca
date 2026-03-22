import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Pricing — List Your IV Therapy Business',
  description: 'Choose a plan to list your IV therapy clinic on IV Therapy Canada. Free to start, upgrade for more leads.',
}

const PLANS = [
  {
    name: 'Free',
    price: 0,
    description: 'Get discovered with a basic listing.',
    features: [
      'Name, city, and phone number',
      'Basic service tags',
      'Listed in city directory',
    ],
    cta: 'Get Started Free',
    highlight: false,
  },
  {
    name: 'Standard',
    price: 149,
    description: 'Full profile to showcase your practice.',
    features: [
      'Everything in Free',
      'Full description + website link',
      'Photos and logo',
      'Provider credentials listed',
      'Priority placement in city listings',
      'Booking link',
      'Social media links',
    ],
    cta: 'Get Standard',
    highlight: false,
  },
  {
    name: 'Premium',
    price: 299,
    description: 'Stand out with featured placement and lead alerts.',
    features: [
      'Everything in Standard',
      'Featured badge on listing',
      'Top placement in city results',
      'Instant email lead notifications',
      'Lead dashboard access',
      'Review management',
      'Priority customer support',
    ],
    cta: 'Get Premium',
    highlight: true,
  },
  {
    name: 'Exclusive',
    price: 499,
    description: 'Own your city — every lead goes to you.',
    features: [
      'Everything in Premium',
      'Only vendor shown in your city',
      'All city leads routed to you',
      'Exclusive badge on listing',
      'Monthly performance report',
      'Dedicated account manager',
    ],
    cta: 'Go Exclusive',
    highlight: false,
  },
]

export default function PricingPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-14">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-[#1E1E2C]">Home</Link>
        {' / '}
        <Link href="/for-vendors" className="hover:text-[#1E1E2C]">For Vendors</Link>
        {' / '}
        <span className="text-gray-900">Pricing</span>
      </nav>

      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h1>
        <p className="text-gray-500 text-lg">All prices in CAD. Cancel anytime.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl border p-6 flex flex-col ${plan.highlight ? 'border-[#1E1E2C] ring-2 ring-[#1E1E2C]/30 bg-white shadow-lg' : 'border-gray-200 bg-white'}`}
          >
            {plan.highlight && (
              <div className="text-center mb-3">
                <span className="bg-[#1E1E2C] text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}
            <h2 className="text-lg font-bold text-gray-900">{plan.name}</h2>
            <div className="my-3">
              {plan.price === 0 ? (
                <p className="text-3xl font-bold text-gray-900">Free</p>
              ) : (
                <p className="text-3xl font-bold text-gray-900">
                  ${plan.price}<span className="text-base font-normal text-gray-500">/mo</span>
                </p>
              )}
            </div>
            <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
            <ul className="space-y-2 mb-6 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-[#E8624A] mt-0.5 flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/dashboard">
              <Button
                size="md"
                variant={plan.highlight ? 'primary' : 'outline'}
                className="w-full"
              >
                {plan.cta}
              </Button>
            </Link>
          </div>
        ))}
      </div>

      {/* Pay-per-lead section */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Pay-Per-Lead Pricing</h2>
        <p className="text-gray-500 mb-6 text-sm">
          On certain plans, leads are billed individually based on service type. You only pay when you receive a qualified lead.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { service: 'IV Therapy / Vitamin IV / Hydration', price: '$20–$40' },
            { service: 'NAD+ Therapy', price: '$40–$80' },
            { service: 'Chelation Therapy', price: '$80–$150' },
            { service: 'Concierge Medicine', price: '$100–$200' },
          ].map((item) => (
            <div key={item.service} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">{item.service}</p>
              <p className="text-lg font-bold text-[#1E1E2C]">{item.price}</p>
              <p className="text-xs text-gray-400">per lead</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
