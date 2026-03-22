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
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function main() {
  const csvPath = path.resolve(__dirname, '../../iv_theraphy/iv_theraphy_with_images.csv')
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const { data } = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
  })

  console.log(`Parsed ${data.length} rows`)

  const slugCounts: Record<string, number> = {}
  let updated = 0
  let skipped = 0

  for (const row of data) {
    const name = row.name?.trim()
    if (!name) { skipped++; continue }

    let baseSlug = slugify(name)
    slugCounts[baseSlug] = (slugCounts[baseSlug] || 0) + 1
    const slug = slugCounts[baseSlug] > 1 ? `${baseSlug}-${slugCounts[baseSlug]}` : baseSlug

    const image1Url = row.image_1_url?.trim() || null
    const image2Url = row.image_2_url?.trim() || null
    const image3Url = row.image_3_url?.trim() || null

    if (!image1Url && !image2Url && !image3Url) { skipped++; continue }

    try {
      await prisma.vendor.update({
        where: { slug },
        data: { image1Url, image2Url, image3Url },
      })
      updated++
      if (updated % 50 === 0) console.log(`  ${updated} updated...`)
    } catch (err: any) {
      if (err.code === 'P2025') {
        // Vendor not found by slug — skip silently
        skipped++
      } else {
        console.error(`Failed on "${name}":`, err.message)
        skipped++
      }
    }
  }

  console.log(`\nDone: ${updated} vendors updated with image URLs, ${skipped} skipped`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
