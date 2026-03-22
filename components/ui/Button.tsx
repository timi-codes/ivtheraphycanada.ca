import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'amber'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none',
          {
            // Primary — deep teal, pill shape, slight shadow
            'bg-[#1E1E2C] text-white hover:bg-[#141420] rounded-full shadow-sm hover:shadow-md active:scale-[.98] focus-visible:ring-[#1E1E2C]':
              variant === 'primary',
            // Secondary — amber
            'bg-[#D97706] text-white hover:bg-[#b45309] rounded-full shadow-sm hover:shadow-md active:scale-[.98] focus-visible:ring-[#D97706]':
              variant === 'amber',
            // Coral accent
            'bg-[#E8624A] text-white hover:bg-[#d4533b] rounded-full shadow-sm hover:shadow-md active:scale-[.98]':
              variant === 'secondary',
            // Outline — teal border, cream fill on hover
            'border-2 border-[#1E1E2C] text-[#1E1E2C] bg-transparent hover:bg-[#1E1E2C] hover:text-white rounded-full active:scale-[.98] focus-visible:ring-[#1E1E2C]':
              variant === 'outline',
            // Ghost — text only
            'text-[#1E1E2C] hover:bg-[#F3F3F5] rounded-lg active:scale-[.98] focus-visible:ring-[#1E1E2C]':
              variant === 'ghost',
          },
          {
            'h-8 px-4 text-xs tracking-wide': size === 'sm',
            'h-10 px-5 text-sm': size === 'md',
            'h-12 px-7 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export { Button }
