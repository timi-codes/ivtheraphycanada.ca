import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'dark' | 'white'
  href?: string
}

export function Logo({ className, size = 'md', variant = 'dark', href = '/' }: LogoProps) {
  const iconSize = { sm: 34, md: 42, lg: 54 }[size]
  const textSize = { sm: 'text-sm', md: 'text-base', lg: 'text-2xl' }[size]
  const subSize = { sm: 'text-[9px]', md: 'text-[10px]', lg: 'text-sm' }[size]
  const isDark = variant === 'dark'

  return (
    <Link href={href} className={cn('inline-flex items-center gap-2 hover:opacity-85 transition-opacity', className)}>
      {/* IV Drip Bag Icon */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Circle background */}
        <circle cx="22" cy="22" r="22" fill="#F5E8E5" />

        {/* Hanging loop */}
        <path
          d="M17.5 9 C17.5 6.5 22 5.5 22 5.5 C22 5.5 26.5 6.5 26.5 9"
          fill="none"
          stroke="#1E1E2C"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Bag body */}
        <rect x="12" y="8.5" width="20" height="17" rx="3" fill="white" stroke="#1E1E2C" strokeWidth="1.5" />

        {/* Liquid fill — bottom portion */}
        <rect x="13.75" y="17" width="16.5" height="7.75" rx="0" fill="#1E1E2C" opacity="0.12" />
        {/* Liquid level line */}
        <line x1="13.75" y1="17" x2="30.25" y2="17" stroke="#1E1E2C" strokeWidth="1" opacity="0.35" />

        {/* Measurement marks */}
        <line x1="14.5" y1="12.5" x2="17" y2="12.5" stroke="#1E1E2C" strokeWidth="1" opacity="0.4" />
        <line x1="14.5" y1="17" x2="17" y2="17" stroke="#1E1E2C" strokeWidth="1" opacity="0.4" />
        <line x1="14.5" y1="21.5" x2="17" y2="21.5" stroke="#1E1E2C" strokeWidth="1" opacity="0.4" />

        {/* Port connector */}
        <rect x="20" y="25.5" width="4" height="3" rx="1.5" fill="#1E1E2C" opacity="0.7" />

        {/* Drip tube */}
        <line x1="22" y1="28.5" x2="22" y2="33.5" stroke="#1E1E2C" strokeWidth="2" strokeLinecap="round" />

        {/* IV drop — accent green */}
        <path
          d="M22 33.5 C21.2 34.8 20 35.9 20 37 C20 38.1 20.9 39 22 39 C23.1 39 24 38.1 24 37 C24 35.9 22.8 34.8 22 33.5Z"
          fill="#E8624A"
        />
      </svg>

      {/* Wordmark */}
      <div className="leading-none" style={{ fontFamily: 'var(--font-display)' }}>
        <span
          className={cn('block tracking-tight', textSize, isDark ? 'text-[#1C1917]' : 'text-white')}
          style={{ fontWeight: 800 }}
        >
          IV Therapy
        </span>
        <div className={cn('flex items-center gap-0.5', subSize)}>
          <span aria-hidden="true">🍁</span>
          <span
            className="font-bold tracking-widest uppercase"
            style={{
              background: 'linear-gradient(90deg, #CC0000, #FF4444)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Canada
          </span>
        </div>
      </div>
    </Link>
  )
}
