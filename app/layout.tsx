import type { Metadata, Viewport } from "next";
import { DM_Sans, Syne, Nunito } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/ui/Navbar";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
});

const syne = Syne({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-logo",
  weight: ["900"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ivtherapycanada.ca'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: "IV Therapy Canada — Find IV Therapy Clinics Near You",
    template: "%s | IV Therapy Canada",
  },
  description:
    "Find top-rated IV therapy, NAD+ therapy, chelation, and mobile IV clinics across Canada. Book appointments and get quotes from verified providers.",
  keywords: ["IV therapy Canada", "IV drip", "NAD+ therapy", "chelation therapy", "mobile IV", "IV therapy near me", "chelation Canada"],
  alternates: { canonical: SITE_URL },
  openGraph: {
    url: SITE_URL,
    siteName: "IV Therapy Canada",
    type: "website",
    locale: "en_CA",
    title: "IV Therapy Canada — Find IV Therapy Clinics Near You",
    description: "Find top-rated IV therapy, NAD+ therapy, chelation, and mobile IV clinics across Canada. Book appointments and get quotes from verified providers.",
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: "IV Therapy Canada" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "IV Therapy Canada — Find IV Therapy Clinics Near You",
    description: "Find top-rated IV therapy, NAD+ therapy, chelation, and mobile IV clinics across Canada.",
    images: [`${SITE_URL}/og-image.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-CA"
      className={`${dmSans.variable} ${syne.variable} ${nunito.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-white text-gray-900"
        suppressHydrationWarning
      >
        <div id="global-navbar"><Navbar /></div>
        {children}
      </body>
    </html>
  );
}
