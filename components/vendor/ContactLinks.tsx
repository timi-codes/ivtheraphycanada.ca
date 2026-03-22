'use client'

import { track } from '@/lib/analytics'
import { formatPhone } from '@/lib/utils'

interface Props {
  vendorId: string
  vendorName: string
  vendorSlug: string
  vendorPlan: string
  city: string
  province: string
  phone: string | null
  website: string | null
  email: string | null
  instagram: string | null
}

export function ContactLinks({ vendorId, vendorName, vendorSlug, vendorPlan, city, province, phone, website, email, instagram }: Props) {
  const ctx = { vendorId, vendorName, vendorSlug, vendorPlan, city, province }

  return (
    <div className="space-y-3 text-sm">
      {phone && (
        <div>
          <p className="text-gray-500 text-xs mb-0.5">Phone</p>
          <a
            href={`tel:${phone}`}
            onClick={() => track('phone_click', ctx)}
            className="text-[#1E1E2C] font-medium hover:underline"
          >
            {formatPhone(phone)}
          </a>
        </div>
      )}
      {website && (
        <div>
          <p className="text-gray-500 text-xs mb-0.5">Website</p>
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('website_click', ctx)}
            className="text-[#1E1E2C] hover:underline break-all"
          >
            {website.replace(/^https?:\/\//, '')}
          </a>
        </div>
      )}
      {email && (
        <div>
          <p className="text-gray-500 text-xs mb-0.5">Email</p>
          <a
            href={`mailto:${email}`}
            onClick={() => track('email_click', ctx)}
            className="text-[#1E1E2C] hover:underline"
          >
            {email}
          </a>
        </div>
      )}
      {instagram && (
        <div>
          <p className="text-gray-500 text-xs mb-0.5">Instagram</p>
          <a
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('instagram_click', ctx)}
            className="text-[#1E1E2C] hover:underline"
          >
            Instagram →
          </a>
        </div>
      )}
    </div>
  )
}
