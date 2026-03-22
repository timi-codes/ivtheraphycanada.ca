import { config } from 'dotenv'
config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
})

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseArray(val: string | undefined): string[] {
  if (!val || val.trim() === '') return []
  return val.split(',').map((s) => s.trim()).filter(Boolean)
}

const PROVINCE_MAP: Record<string, string> = {
  Alberta: 'Alberta',
  'British Columbia': 'British Columbia',
  Manitoba: 'Manitoba',
  'New Brunswick': 'New Brunswick',
  'Newfoundland and Labrador': 'Newfoundland and Labrador',
  'Nova Scotia': 'Nova Scotia',
  'Northwest Territories': 'Northwest Territories',
  Nunavut: 'Nunavut',
  Ontario: 'Ontario',
  'Prince Edward Island': 'Prince Edward Island',
  Quebec: 'Quebec',
  Saskatchewan: 'Saskatchewan',
  Yukon: 'Yukon',
}

async function main() {
  const csvPath = path.resolve(__dirname, '../../iv_theraphy/iv_theraphy_with_images.csv')
  const csvContent = fs.readFileSync(csvPath, 'utf-8')

  const { data } = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
  })

  console.log(`Parsed ${data.length} rows from CSV`)

  const slugCounts: Record<string, number> = {}

  let created = 0
  let skipped = 0

  for (const row of data) {
    const name = row.name?.trim()
    if (!name) { skipped++; continue }

    let baseSlug = slugify(name)
    slugCounts[baseSlug] = (slugCounts[baseSlug] || 0) + 1
    const slug = slugCounts[baseSlug] > 1 ? `${baseSlug}-${slugCounts[baseSlug]}` : baseSlug

    const province = PROVINCE_MAP[row.state?.trim()] ?? row.state?.trim() ?? ''

    try {
      await prisma.vendor.upsert({
        where: { slug },
        update: {},
        create: {
          name,
          slug,
          description: row.description?.trim() || null,
          phone: row.phone?.trim() || null,
          website: row.website?.trim() || null,
          email: row.email?.trim() || null,
          address: row.address?.trim() || null,
          street: row.street?.trim() || null,
          city: row.city?.trim() || '',
          province,
          postalCode: row.postal_code?.trim() || null,
          lat: row.latitude ? parseFloat(row.latitude) : null,
          lng: row.longitude ? parseFloat(row.longitude) : null,
          rating: row.rating ? parseFloat(row.rating) : null,
          reviewCount: row.reviews ? parseInt(row.reviews) : 0,
          services: parseArray(row.services),
          providerType: parseArray(row.provider_type),
          clinicType: row.clinic_type?.trim() || 'clinic',
          dripPackages: parseArray(row.drip_packages),
          addOnServices: parseArray(row.add_on_services),
          hasBooking: row.has_booking?.toLowerCase() === 'true',
          bookingLink: row.booking_appointment_link?.trim() || null,
          instagram: row.company_instagram?.trim() || null,
          facebook: row.company_facebook?.trim() || null,
          businessStatus: row.business_status?.trim() || 'OPERATIONAL',
          workingHours: row.working_hours?.trim() || null,
          googlePlaceId: row.place_id?.trim() || null,
          photosCount: row.photos_count ? parseInt(row.photos_count) : 0,
          isVerified: row.verified?.toLowerCase() === 'true',
          image1Url: row.image_1_url?.trim() || null,
          image2Url: row.image_2_url?.trim() || null,
          image3Url: row.image_3_url?.trim() || null,
        },
      })
      created++
    } catch (err) {
      console.error(`Failed on "${name}" (slug: ${slug}):`, err)
      skipped++
    }
  }

  console.log(`Done: ${created} vendors created/upserted, ${skipped} skipped`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
