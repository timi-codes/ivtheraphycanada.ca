import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'teal' | 'green' | 'gray' | 'premium' | 'featured' | 'amber'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide',
        {
          'bg-stone-100 text-stone-600 border border-stone-200':        variant === 'default',
          'bg-teal-50  text-teal-800  border border-teal-100':          variant === 'teal',
          'bg-green-50 text-green-800 border border-green-100':         variant === 'green',
          'bg-white text-stone-500 border border-stone-200':            variant === 'gray',
          'bg-violet-50 text-violet-700 border border-violet-200':      variant === 'premium',
          'bg-amber-50  text-amber-700  border border-amber-200':       variant === 'featured',
          'bg-amber-50  text-amber-800  border border-amber-200':       variant === 'amber',
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
