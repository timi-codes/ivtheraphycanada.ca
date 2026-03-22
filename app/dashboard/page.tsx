export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  // Find vendor linked to this user
  const vendorUser = session ? await prisma.vendorUser.findFirst({
    where: { userId: session.user.id },
    include: {
      vendor: {
        include: {
          leads: { orderBy: { createdAt: 'desc' }, take: 5 },
          _count: { select: { leads: true } },
        },
      },
    },
  }) : null

  const vendor = vendorUser?.vendor

  if (!vendor) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🏥</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">No listing found</h1>
        <p className="text-gray-500 mb-6">Your account isn&apos;t linked to a vendor listing yet.</p>
        <p className="text-sm text-gray-400 mb-8">
          If you recently signed up, contact us at{' '}
          <a href="mailto:hello@ivtherapycanada.ca" className="text-[#1E1E2C]">hello@ivtherapycanada.ca</a>{' '}
          to get your listing connected.
        </p>
        <Link href="/for-vendors">
          <Button>List Your Business →</Button>
        </Link>
      </div>
    )
  }

  const newLeads = vendor.leads.filter((l) => l.status === 'new').length
  const planLabel = { free: 'Free', standard: 'Standard', premium: 'Premium', exclusive: 'Exclusive' }[vendor.plan] ?? vendor.plan

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{vendor.name}</h1>
          <p className="text-gray-500">{vendor.city}, {vendor.province}</p>
        </div>
        <Badge variant={vendor.plan === 'premium' || vendor.plan === 'exclusive' ? 'premium' : vendor.plan === 'standard' ? 'teal' : 'gray'}>
          {planLabel} Plan
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Leads', value: vendor._count.leads, link: '/dashboard/leads' },
          { label: 'New Leads', value: newLeads, link: '/dashboard/leads' },
          { label: 'Rating', value: vendor.rating ? `${vendor.rating.toFixed(1)} ★` : 'N/A', link: null },
          { label: 'Plan', value: planLabel, link: '/dashboard/billing' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{stat.label}</p>
            {stat.link ? (
              <Link href={stat.link} className="text-2xl font-bold text-[#1E1E2C] hover:underline">{stat.value}</Link>
            ) : (
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Recent leads */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Recent Leads</h2>
          <Link href="/dashboard/leads" className="text-sm text-[#1E1E2C] hover:underline">View all →</Link>
        </div>
        {vendor.leads.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No leads yet. Upgrade your plan to get more visibility.</p>
        ) : (
          <div className="space-y-3">
            {vendor.leads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{lead.name}</p>
                  <p className="text-sm text-gray-500">{lead.email} · {lead.city}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={lead.status === 'new' ? 'teal' : 'gray'}>{lead.status}</Badge>
                  <span className="text-xs text-gray-400">{new Date(lead.createdAt).toLocaleDateString('en-CA')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/profile">
          <Button variant="outline">Edit Profile</Button>
        </Link>
        <Link href={`/vendors/${vendor.slug}`} target="_blank">
          <Button variant="ghost">View Public Listing →</Button>
        </Link>
        {vendor.plan === 'free' && (
          <Link href="/dashboard/billing">
            <Button variant="secondary">Upgrade Plan ↑</Button>
          </Link>
        )}
      </div>
    </div>
  )
}
