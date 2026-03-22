export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { HideGlobalNav } from '@/components/ui/HideGlobalNav'
import { AdminUserMenu } from '@/components/admin/AdminUserMenu'
import { VendorMapLayout } from '@/components/admin/VendorMapLayout'
import Link from 'next/link'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)

export default async function AdminVendorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !ADMIN_EMAILS.includes(session.user.email ?? '')) redirect('/login')

  const sp = await searchParams
  const search = sp.search ?? ''
  const province = sp.province ?? ''
  const city = sp.city ?? ''
  const plans = sp.plan ? sp.plan.split(',').filter(Boolean) : []
  const services = sp.services ? sp.services.split(',').filter(Boolean) : []
  const clinicType = sp.clinicType ?? ''
  const status = sp.status ?? ''
  const verified = sp.verified === '1'
  const featured = sp.featured === '1'

  // Build WHERE clause
  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (province) where.province = province
  if (city) where.city = { contains: city, mode: 'insensitive' }
  if (plans.length > 0) where.plan = { in: plans }
  if (services.length > 0) where.services = { hasSome: services }
  if (clinicType) where.clinicType = clinicType
  if (status) where.businessStatus = status
  if (verified) where.isVerified = true
  if (featured) where.isFeatured = true

  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        province: true,
        plan: true,
        isVerified: true,
        isFeatured: true,
        businessStatus: true,
        services: true,
        clinicType: true,
        lat: true,
        lng: true,
        rating: true,
        reviewCount: true,
        phone: true,
        website: true,
      },
      orderBy: [
        { plan: 'desc' },
        { isFeatured: 'desc' },
        { name: 'asc' },
      ],
    }),
    prisma.vendor.count(),
  ])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HideGlobalNav />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-full flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Vendor Directory</h1>
            <p className="text-xs text-gray-400">ivtherapycanada.ca · Admin</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Nav to analytics */}
            <Link
              href="/admin"
              className="text-sm text-gray-500 hover:text-gray-800 font-medium"
            >
              ← Analytics
            </Link>
            <AdminUserMenu email={session.user.email ?? ''} />
          </div>
        </div>
      </div>

      {/* Split layout */}
      <VendorMapLayout vendors={vendors} total={total} />
    </div>
  )
}
