import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ivtherapycanada.ca'

export const metadata: Metadata = {
  title: 'List Your IV Therapy Clinic — Get Found by Patients',
  description: "Get your IV therapy clinic listed on Canada's largest IV therapy directory. Reach patients searching for IV therapy near you. Free to get started.",
  alternates: { canonical: `${SITE_URL}/list-your-clinic` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/list-your-clinic`,
    title: 'List Your IV Therapy Clinic on IV Therapy Canada',
    description: "Get your IV therapy clinic listed on Canada's largest IV therapy directory.",
    siteName: 'IV Therapy Canada',
  },
  twitter: { card: 'summary', title: 'List Your IV Therapy Clinic', description: "Get listed on Canada's largest IV therapy directory." },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
