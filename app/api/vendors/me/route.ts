import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase-server'

async function getVendorForUser() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const vendorUser = await prisma.vendorUser.findFirst({
    where: { userId: session.user.id },
    include: { vendor: true },
  })
  return vendorUser?.vendor ?? null
}

export async function GET() {
  const vendor = await getVendorForUser()
  if (!vendor) return NextResponse.json(null, { status: 404 })
  return NextResponse.json(vendor)
}

export async function PATCH(req: NextRequest) {
  const vendor = await getVendorForUser()
  if (!vendor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const allowedFields = ['name', 'description', 'phone', 'website', 'email', 'address', 'instagram', 'facebook', 'bookingLink', 'hasBooking', 'services', 'dripPackages', 'addOnServices', 'providerType', 'clinicType']

  const data: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (field in body) data[field] = body[field]
  }

  const updated = await prisma.vendor.update({
    where: { id: vendor.id },
    data,
  })

  return NextResponse.json(updated)
}
