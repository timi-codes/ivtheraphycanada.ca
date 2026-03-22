export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { SERVICE_LABELS } from '@/lib/utils'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)

export default async function AdminLeadsPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session || !ADMIN_EMAILS.includes(session.user.email ?? '')) {
    redirect('/login')
  }

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: 'desc' },
    include: { vendor: { select: { name: true, slug: true } } },
  })

  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    sent: 'bg-gray-100 text-gray-600',
    converted: 'bg-green-100 text-green-700',
    spam: 'bg-red-100 text-red-600',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Leads</h1>
            <p className="text-sm text-gray-500 mt-1">{leads.length} total submissions</p>
          </div>
          <span className="text-xs text-gray-400 bg-white border border-gray-200 px-3 py-1.5 rounded-full">
            Admin · {session.user.email}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Service</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">City</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Vendor</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-400">No leads yet.</td>
                  </tr>
                )}
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{lead.name}</td>
                    <td className="px-4 py-3">
                      <a href={`mailto:${lead.email}`} className="text-[#1E1E2C] hover:underline">{lead.email}</a>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{lead.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {lead.serviceType ? (SERVICE_LABELS[lead.serviceType] ?? lead.serviceType) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {lead.city}{lead.province ? `, ${lead.province}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      {lead.vendor
                        ? <a href={`/vendors/${lead.vendor.slug}`} className="text-[#1E1E2C] hover:underline">{lead.vendor.name}</a>
                        : <span className="text-gray-400 italic">General</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[lead.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(lead.createdAt).toLocaleDateString('en-CA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Messages section */}
          {leads.some(l => l.message) && (
            <div className="border-t border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-4">Messages</h2>
              <div className="space-y-3">
                {leads.filter(l => l.message).map(lead => (
                  <div key={lead.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 text-sm">{lead.name}</span>
                      <span className="text-xs text-gray-400">{new Date(lead.createdAt).toLocaleDateString('en-CA')}</span>
                    </div>
                    <p className="text-sm text-gray-600">{lead.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
