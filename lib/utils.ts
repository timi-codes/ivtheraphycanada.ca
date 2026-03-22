import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  return phone
}

export const PROVINCE_NAMES: Record<string, string> = {
  ab: 'Alberta',
  bc: 'British Columbia',
  mb: 'Manitoba',
  nb: 'New Brunswick',
  nl: 'Newfoundland and Labrador',
  ns: 'Nova Scotia',
  nt: 'Northwest Territories',
  nu: 'Nunavut',
  on: 'Ontario',
  pe: 'Prince Edward Island',
  qc: 'Quebec',
  sk: 'Saskatchewan',
  yt: 'Yukon',
}

export const PROVINCE_SLUGS: Record<string, string> = {
  Alberta: 'ab',
  'British Columbia': 'bc',
  Manitoba: 'mb',
  'New Brunswick': 'nb',
  'Newfoundland and Labrador': 'nl',
  'Nova Scotia': 'ns',
  'Northwest Territories': 'nt',
  Nunavut: 'nu',
  Ontario: 'on',
  'Prince Edward Island': 'pe',
  Quebec: 'qc',
  Saskatchewan: 'sk',
  Yukon: 'yt',
}

export const SERVICE_LABELS: Record<string, string> = {
  iv_therapy: 'IV Therapy',
  vitamin_iv: 'Vitamin IV',
  mobile_iv: 'Mobile IV',
  nad_plus: 'NAD+',
  chelation: 'Chelation',
  concierge: 'Concierge Medicine',
  myers_cocktail: "Myers' Cocktail",
  glutathione: 'Glutathione',
  hangover_iv: 'Hangover IV',
  immune_iv: 'Immune IV',
  hydration: 'Hydration IV',
}
