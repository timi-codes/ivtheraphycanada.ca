export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/Badge'
import { SERVICE_LABELS } from '@/lib/utils'

export default async function LeadsPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  const vendorUser = session ? await prisma.vendorUser.findFirst({
    where: { userId: session.user.id },
    select: { vendorId: true },
  }) : null

  if (!vendorUser) {
    return <p className="text-gray-500">No vendor linked to your account.</p>
  }

  const leads = await prisma.lead.findMany({
    where: { vendorId: vendorUser.vendorId },
    orderBy: { createdAt: 'desc' },
  })

  const statusColors: Record<string, 'teal' | 'green' | 'gray' | 'default'> = {
    new: 'teal',
    sent: 'default',
    converted: 'green',
    spam: 'gray',
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Lead Inbox</h1>
        <p className="text-gray-500 text-sm mt-1">{leads.length} total leads</p>
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500">No leads yet.</p>
          <p className="text-sm text-gray-400 mt-1">Upgrade your plan to get featured placement and more leads.</p>
          <Link href="/dashboard/billing" className="text-[#1E1E2C] text-sm hover:underline mt-3 inline-block">
            View Plans →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Service</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">City</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{lead.name}</td>
                    <td className="px-4 py-3">
                      <div>
                        <a href={`mailto:${lead.email}`} className="text-[#1E1E2C] hover:underline">{lead.email}</a>
                        {lead.phone && <p className="text-gray-400 text-xs">{lead.phone}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {lead.serviceType ? SERVICE_LABELS[lead.serviceType] ?? lead.serviceType : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{lead.city}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusColors[lead.status] ?? 'default'}>{lead.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(lead.createdAt).toLocaleDateString('en-CA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {leads.some((l) => l.message) && (
        <div className="mt-6">
          <h2 className="font-bold text-gray-900 mb-3">Lead Messages</h2>
          <div className="space-y-3">
            {leads.filter((l) => l.message).map((lead) => (
              <div key={lead.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{lead.name}</span>
                  <span className="text-xs text-gray-400">{new Date(lead.createdAt).toLocaleDateString('en-CA')}</span>
                </div>
                <p className="text-sm text-gray-600">{lead.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
