import { config } from 'dotenv'
config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'

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

const cities = [
  // Ontario
  { name: 'Toronto', province: 'Ontario', provinceSlug: 'ontario', population: 2930000, lat: 43.6532, lng: -79.3832, nearbyCities: ['Mississauga', 'Brampton', 'Vaughan', 'Markham'] },
  { name: 'Ottawa', province: 'Ontario', provinceSlug: 'ontario', population: 1017000, lat: 45.4215, lng: -75.6972, nearbyCities: ['Gatineau', 'Kanata', 'Orleans'] },
  { name: 'Mississauga', province: 'Ontario', provinceSlug: 'ontario', population: 721599, lat: 43.5890, lng: -79.6441, nearbyCities: ['Toronto', 'Brampton', 'Oakville'] },
  { name: 'Brampton', province: 'Ontario', provinceSlug: 'ontario', population: 656480, lat: 43.7315, lng: -79.7624, nearbyCities: ['Mississauga', 'Toronto', 'Vaughan'] },
  { name: 'Hamilton', province: 'Ontario', provinceSlug: 'ontario', population: 569353, lat: 43.2557, lng: -79.8711, nearbyCities: ['Burlington', 'Oakville', 'Toronto'] },
  { name: 'London', province: 'Ontario', provinceSlug: 'ontario', population: 422324, lat: 42.9849, lng: -81.2453, nearbyCities: ['Kitchener', 'Windsor', 'Sarnia'] },
  { name: 'Markham', province: 'Ontario', provinceSlug: 'ontario', population: 352000, lat: 43.8561, lng: -79.3370, nearbyCities: ['Toronto', 'Richmond Hill', 'Vaughan'] },
  { name: 'Vaughan', province: 'Ontario', provinceSlug: 'ontario', population: 344000, lat: 43.8361, lng: -79.4980, nearbyCities: ['Toronto', 'Brampton', 'Richmond Hill'] },
  { name: 'Kitchener', province: 'Ontario', provinceSlug: 'ontario', population: 256885, lat: 43.4516, lng: -80.4925, nearbyCities: ['Waterloo', 'Cambridge', 'Guelph'] },
  { name: 'Windsor', province: 'Ontario', provinceSlug: 'ontario', population: 229660, lat: 42.3149, lng: -83.0364, nearbyCities: ['Leamington', 'Chatham', 'London'] },
  { name: 'Richmond Hill', province: 'Ontario', provinceSlug: 'ontario', population: 202022, lat: 43.8828, lng: -79.4403, nearbyCities: ['Markham', 'Vaughan', 'Toronto'] },
  { name: 'Oakville', province: 'Ontario', provinceSlug: 'ontario', population: 213759, lat: 43.4675, lng: -79.6877, nearbyCities: ['Mississauga', 'Burlington', 'Hamilton'] },
  { name: 'Burlington', province: 'Ontario', provinceSlug: 'ontario', population: 206366, lat: 43.3255, lng: -79.7990, nearbyCities: ['Oakville', 'Hamilton', 'Mississauga'] },
  { name: 'Oshawa', province: 'Ontario', provinceSlug: 'ontario', population: 166000, lat: 43.8971, lng: -78.8658, nearbyCities: ['Whitby', 'Ajax', 'Toronto'] },
  { name: 'Barrie', province: 'Ontario', provinceSlug: 'ontario', population: 153356, lat: 44.3894, lng: -79.6903, nearbyCities: ['Innisfil', 'Collingwood', 'Orillia'] },
  { name: 'Sudbury', province: 'Ontario', provinceSlug: 'ontario', population: 164689, lat: 46.4917, lng: -80.9930, nearbyCities: ['North Bay', 'Sault Ste. Marie'] },
  { name: 'Kingston', province: 'Ontario', provinceSlug: 'ontario', population: 136685, lat: 44.2312, lng: -76.4860, nearbyCities: ['Belleville', 'Ottawa', 'Brockville'] },
  { name: 'Guelph', province: 'Ontario', provinceSlug: 'ontario', population: 143740, lat: 43.5448, lng: -80.2482, nearbyCities: ['Kitchener', 'Cambridge', 'Hamilton'] },
  { name: 'Cambridge', province: 'Ontario', provinceSlug: 'ontario', population: 138479, lat: 43.3601, lng: -80.3126, nearbyCities: ['Kitchener', 'Guelph', 'Waterloo'] },
  { name: 'Whitby', province: 'Ontario', provinceSlug: 'ontario', population: 138501, lat: 43.8975, lng: -78.9429, nearbyCities: ['Oshawa', 'Ajax', 'Toronto'] },

  // British Columbia
  { name: 'Vancouver', province: 'British Columbia', provinceSlug: 'british-columbia', population: 662248, lat: 49.2827, lng: -123.1207, nearbyCities: ['Burnaby', 'Surrey', 'Richmond'] },
  { name: 'Surrey', province: 'British Columbia', provinceSlug: 'british-columbia', population: 568322, lat: 49.1913, lng: -122.8490, nearbyCities: ['Vancouver', 'Burnaby', 'Delta'] },
  { name: 'Burnaby', province: 'British Columbia', provinceSlug: 'british-columbia', population: 249125, lat: 49.2488, lng: -122.9805, nearbyCities: ['Vancouver', 'New Westminster', 'Coquitlam'] },
  { name: 'Richmond', province: 'British Columbia', provinceSlug: 'british-columbia', population: 220180, lat: 49.1666, lng: -123.1336, nearbyCities: ['Vancouver', 'Delta', 'Burnaby'] },
  { name: 'Kelowna', province: 'British Columbia', provinceSlug: 'british-columbia', population: 150000, lat: 49.8880, lng: -119.4960, nearbyCities: ['West Kelowna', 'Penticton', 'Vernon'] },
  { name: 'Abbotsford', province: 'British Columbia', provinceSlug: 'british-columbia', population: 161000, lat: 49.0504, lng: -122.3045, nearbyCities: ['Chilliwack', 'Mission', 'Langley'] },
  { name: 'Coquitlam', province: 'British Columbia', provinceSlug: 'british-columbia', population: 148625, lat: 49.2838, lng: -122.7932, nearbyCities: ['Burnaby', 'Port Moody', 'New Westminster'] },
  { name: 'Victoria', province: 'British Columbia', provinceSlug: 'british-columbia', population: 92141, lat: 48.4284, lng: -123.3656, nearbyCities: ['Saanich', 'Oak Bay', 'Langford'] },
  { name: 'Langley', province: 'British Columbia', provinceSlug: 'british-columbia', population: 132603, lat: 49.1044, lng: -122.6604, nearbyCities: ['Surrey', 'Abbotsford', 'Delta'] },

  // Alberta
  { name: 'Calgary', province: 'Alberta', provinceSlug: 'alberta', population: 1336000, lat: 51.0447, lng: -114.0719, nearbyCities: ['Airdrie', 'Cochrane', 'Okotoks'] },
  { name: 'Edmonton', province: 'Alberta', provinceSlug: 'alberta', population: 1010000, lat: 53.5461, lng: -113.4938, nearbyCities: ['St. Albert', 'Sherwood Park', 'Leduc'] },
  { name: 'Red Deer', province: 'Alberta', provinceSlug: 'alberta', population: 108265, lat: 52.2681, lng: -113.8112, nearbyCities: ['Lacombe', 'Ponoka', 'Innisfail'] },
  { name: 'Lethbridge', province: 'Alberta', provinceSlug: 'alberta', population: 101482, lat: 49.6956, lng: -112.8451, nearbyCities: ['Taber', 'Coaldale', 'Fort Macleod'] },
  { name: 'Airdrie', province: 'Alberta', provinceSlug: 'alberta', population: 76581, lat: 51.2917, lng: -114.0144, nearbyCities: ['Calgary', 'Cochrane', 'Olds'] },

  // Quebec
  { name: 'Montreal', province: 'Quebec', provinceSlug: 'quebec', population: 2037000, lat: 45.5017, lng: -73.5673, nearbyCities: ['Laval', 'Longueuil', 'Brossard'] },
  { name: 'Quebec City', province: 'Quebec', provinceSlug: 'quebec', population: 549459, lat: 46.8139, lng: -71.2080, nearbyCities: ['Levis', 'Sainte-Foy', 'Charlesbourg'] },
  { name: 'Laval', province: 'Quebec', provinceSlug: 'quebec', population: 440000, lat: 45.6066, lng: -73.7124, nearbyCities: ['Montreal', 'Terrebonne', 'Repentigny'] },
  { name: 'Gatineau', province: 'Quebec', provinceSlug: 'quebec', population: 291041, lat: 45.4765, lng: -75.7013, nearbyCities: ['Ottawa', 'Kanata', 'Hull'] },
  { name: 'Longueuil', province: 'Quebec', provinceSlug: 'quebec', population: 261699, lat: 45.5312, lng: -73.5185, nearbyCities: ['Montreal', 'Brossard', 'Saint-Lambert'] },

  // Manitoba
  { name: 'Winnipeg', province: 'Manitoba', provinceSlug: 'manitoba', population: 778489, lat: 49.8951, lng: -97.1384, nearbyCities: ['Steinbach', 'Portage la Prairie', 'Selkirk'] },
  { name: 'Brandon', province: 'Manitoba', provinceSlug: 'manitoba', population: 51313, lat: 49.8485, lng: -99.9501, nearbyCities: ['Portage la Prairie', 'Dauphin'] },

  // Saskatchewan
  { name: 'Saskatoon', province: 'Saskatchewan', provinceSlug: 'saskatchewan', population: 317480, lat: 52.1332, lng: -106.6700, nearbyCities: ['Warman', 'Martensville', 'Osler'] },
  { name: 'Regina', province: 'Saskatchewan', provinceSlug: 'saskatchewan', population: 236481, lat: 50.4452, lng: -104.6189, nearbyCities: ['Moose Jaw', 'White City', 'Lumsden'] },

  // Nova Scotia
  { name: 'Halifax', province: 'Nova Scotia', provinceSlug: 'nova-scotia', population: 465703, lat: 44.6488, lng: -63.5752, nearbyCities: ['Dartmouth', 'Bedford', 'Lower Sackville'] },

  // New Brunswick
  { name: 'Moncton', province: 'New Brunswick', provinceSlug: 'new-brunswick', population: 144810, lat: 46.0878, lng: -64.7782, nearbyCities: ['Dieppe', 'Riverview', 'Shediac'] },
  { name: 'Fredericton', province: 'New Brunswick', provinceSlug: 'new-brunswick', population: 63116, lat: 45.9636, lng: -66.6431, nearbyCities: ['Oromocto', 'Lincoln', 'Devon'] },
  { name: 'Saint John', province: 'New Brunswick', provinceSlug: 'new-brunswick', population: 67575, lat: 45.2733, lng: -66.0633, nearbyCities: ['Quispamsis', 'Rothesay', 'Grand Bay-Westfield'] },

  // Newfoundland
  { name: "St. John's", province: 'Newfoundland and Labrador', provinceSlug: 'newfoundland-and-labrador', population: 110525, lat: 47.5615, lng: -52.7126, nearbyCities: ['Mount Pearl', 'Conception Bay South', 'Paradise'] },
]

async function main() {
  let created = 0
  let skipped = 0

  for (const city of cities) {
    const slug = slugify(city.name)
    try {
      await prisma.city.upsert({
        where: { slug },
        update: {},
        create: {
          name: city.name,
          slug,
          province: city.province,
          provinceSlug: city.provinceSlug,
          population: city.population,
          lat: city.lat,
          lng: city.lng,
          nearbyCities: city.nearbyCities,
          metaTitle: `IV Therapy in ${city.name}, ${city.province} | IV Therapy Canada`,
          metaDescription: `Find top-rated IV therapy, NAD+ therapy, and mobile IV clinics in ${city.name}, ${city.province}. Compare providers and get a free quote.`,
          introContent: `Looking for IV therapy in ${city.name}? Browse our directory of ${city.name}'s top-rated IV therapy clinics and mobile IV services. Whether you need hydration, vitamin infusions, NAD+ therapy, or hangover recovery, find a trusted provider near you.`,
        },
      })
      created++
    } catch (err) {
      console.error(`Failed on "${city.name}":`, err)
      skipped++
    }
  }

  console.log(`Done: ${created} cities created/upserted, ${skipped} skipped`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
