'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { Logo } from './Logo'
import { SearchAutocomplete } from './SearchAutocomplete'
import { track } from '@/lib/analytics'

const MOBILE_LINKS = [
  { label: 'Find Providers', href: '/vendors' },
  { label: 'Browse Cities', href: '/vendors' },
  { label: 'Blog', href: '/blog' },
  { label: 'Get a Quote', href: '/get-a-quote' },
  { label: 'List Your Clinic', href: '/list-your-clinic' },
]

const CITIES_BY_PROVINCE: { province: string; provinceSlug: string; cities: { name: string; slug: string }[] }[] = [
  {
    province: 'Ontario', provinceSlug: 'ontario',
    cities: [
      { name: 'Toronto', slug: 'toronto' },
      { name: 'Ottawa', slug: 'ottawa' },
      { name: 'Mississauga', slug: 'mississauga' },
      { name: 'Brampton', slug: 'brampton' },
      { name: 'Hamilton', slug: 'hamilton' },
    ],
  },
  {
    province: 'British Columbia', provinceSlug: 'british-columbia',
    cities: [
      { name: 'Vancouver', slug: 'vancouver' },
      { name: 'Surrey', slug: 'surrey' },
      { name: 'Burnaby', slug: 'burnaby' },
      { name: 'Victoria', slug: 'victoria' },
      { name: 'Kelowna', slug: 'kelowna' },
    ],
  },
  {
    province: 'Alberta', provinceSlug: 'alberta',
    cities: [
      { name: 'Calgary', slug: 'calgary' },
      { name: 'Edmonton', slug: 'edmonton' },
      { name: 'Red Deer', slug: 'red-deer' },
      { name: 'Lethbridge', slug: 'lethbridge' },
    ],
  },
  {
    province: 'Quebec', provinceSlug: 'quebec',
    cities: [
      { name: 'Montreal', slug: 'montreal' },
      { name: 'Quebec City', slug: 'quebec-city' },
      { name: 'Laval', slug: 'laval' },
    ],
  },
  {
    province: 'Manitoba', provinceSlug: 'manitoba',
    cities: [{ name: 'Winnipeg', slug: 'winnipeg' }],
  },
  {
    province: 'Saskatchewan', provinceSlug: 'saskatchewan',
    cities: [
      { name: 'Saskatoon', slug: 'saskatoon' },
      { name: 'Regina', slug: 'regina' },
    ],
  },
  {
    province: 'Nova Scotia', provinceSlug: 'nova-scotia',
    cities: [{ name: 'Halifax', slug: 'halifax' }],
  },
]

function CitiesDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { const next = !open; setOpen(next); if (next) track('cities_dropdown_open') }}
        className="flex items-center gap-1 hover:text-[#1E1E2C] transition-colors"
        style={{ color: open ? '#1E1E2C' : undefined }}
      >
        Browse Cities
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[560px] rounded-2xl border bg-white shadow-2xl z-[200] overflow-hidden"
          style={{ borderColor: '#E7E5E0' }}
        >
          {/* Header */}
          <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: '#E7E5E0' }}>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#A8A29E' }}>
              IV Therapy by City
            </span>
            <Link
              href="/vendors"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold hover:underline"
              style={{ color: '#1E1E2C' }}
            >
              View all →
            </Link>
          </div>

          {/* City grid */}
          <div className="p-5 grid grid-cols-3 gap-x-6 gap-y-4">
            {CITIES_BY_PROVINCE.map((group) => (
              <div key={group.provinceSlug}>
                <Link
                  href={`/${group.provinceSlug}`}
                  onClick={() => setOpen(false)}
                  className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block hover:text-[#E8624A] transition-colors"
                  style={{ color: '#A8A29E' }}
                >
                  {group.province}
                </Link>
                <ul className="space-y-1">
                  {group.cities.map((city) => (
                    <li key={city.slug}>
                      <Link
                        href={`/${group.provinceSlug}/${city.slug}`}
                        onClick={() => { setOpen(false); track('city_dropdown_click', { city: city.name, province: group.province }) }}
                        className="text-sm font-medium hover:text-[#E8624A] transition-colors"
                        style={{ color: '#1C1917' }}
                      >
                        {city.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ background: '#F4F8F7', borderColor: '#E2EDED' }}
    >
      <div className="max-w-6xl mx-auto px-4 h-[60px] flex items-center gap-3">
        {/* Mobile logo (< lg) */}
        <Link href="/" className="flex lg:hidden shrink-0 items-center gap-1">
          <Image src="/drip.svg" alt="" width={22} height={22} style={{ marginTop: '8px' }} />
          <div className="flex flex-col items-end leading-none">
            <Image src="/canada.svg" alt="Canada" width={38} height={7} className="-mb-1.5" />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.03em', color: '#1E1E2C', fontSize: '1.05rem' }}>Therapy</span>
          </div>
        </Link>

        {/* Desktop logo (lg+) */}
        <Link href="/" className="hidden lg:flex shrink-0 items-center gap-1 mr-6">
          <Image src="/drip.svg" alt="" width={26} height={26} style={{ marginTop: '10px' }} />
          <div className="flex flex-col items-end leading-none">
            <Image src="/canada.svg" alt="Canada" width={45} height={8} className="-mb-1.5" />
            <span
              className="text-[1.35rem]"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.03em', color: '#1E1E2C' }}
            >
              Therapy
            </span>
          </div>
        </Link>

        {/* Nav */}
        <nav
          className="hidden lg:flex items-center gap-5 text-sm font-medium"
          style={{ color: '#78716C', fontFamily: 'var(--font-body)' }}
        >
          <Link href="/vendors" className="hover:text-[#1E1E2C] transition-colors">Find Providers</Link>
          <CitiesDropdown />
        </nav>

        {/* Search with autocomplete */}
        <SearchAutocomplete
          size="sm"
          placeholder="Search city or service..."
          className="hidden md:block flex-1 max-w-sm ml-4"
        />

        {/* CTAs — desktop */}
        <div className="hidden lg:flex items-center gap-2 ml-8">
          <Link href="/blog" className="text-sm font-medium hover:text-[#1E1E2C] transition-colors mr-8" style={{ color: '#78716C', fontFamily: 'var(--font-body)' }}>Blog</Link>
          <Link
            href="/get-a-quote"
            className="inline-flex items-center text-xs font-semibold px-4 h-8 rounded-full border-2 border-[#1E1E2C] text-[#1E1E2C] transition-all hover:bg-[#1E1E2C] hover:text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Get a Quote
          </Link>
          <Link
            href="/list-your-clinic"
            className="inline-flex items-center text-xs font-bold px-4 h-8 rounded-full text-white transition-all hover:opacity-90"
            style={{ background: '#1E1E2C', fontFamily: 'var(--font-display)' }}
          >
            List Your Clinic
          </Link>
        </div>

        {/* Mobile quick links */}
        <div className="lg:hidden flex items-center gap-3 ml-auto mr-2">
          <Link href="/vendors" className="text-sm font-medium" style={{ color: '#44403C', fontFamily: 'var(--font-body)' }}>Find Providers</Link>
        </div>

        {/* Hamburger — mobile only */}
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="lg:hidden ml-auto p-2 rounded-lg hover:bg-black/5 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4l12 12M16 4L4 16" stroke="#1E1E2C" strokeWidth="2" strokeLinecap="round"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="#1E1E2C" strokeWidth="2" strokeLinecap="round"/></svg>
          )}
        </button>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-4 pb-2.5">
        <SearchAutocomplete size="sm" placeholder="Search city, province or service..." />
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t px-4 py-3 flex flex-col gap-1" style={{ background: '#F4F8F7', borderColor: '#E2EDED' }}>
          {MOBILE_LINKS.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="py-2.5 text-sm font-medium border-b last:border-0 hover:text-[#1E1E2C] transition-colors"
              style={{ color: '#44403C', borderColor: '#E2EDED', fontFamily: 'var(--font-body)' }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
