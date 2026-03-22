'use client'

import { useState, useRef, useEffect } from 'react'

interface Option {
  value: string
  label: string
}

interface Props {
  name: string
  options: Option[]
  defaultValue?: string
  placeholder?: string
  onChange?: (value: string) => void
}

export function CustomSelect({ name, options, defaultValue = '', placeholder, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(defaultValue)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectedLabel = options.find(o => o.value === selected)?.label ?? placeholder ?? options[0]?.label

  function select(value: string) {
    setSelected(value)
    setOpen(false)
    onChange?.(value)
  }

  return (
    <div ref={ref} className="relative">
      {/* Hidden input so the form value is submitted */}
      <input type="hidden" name={name} value={selected} />

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 h-12 px-4 rounded-xl border bg-white text-base font-medium transition-all hover:border-[#1E1E2C] focus:outline-none focus:border-[#1E1E2C]"
        style={{ borderColor: open ? '#1E1E2C' : '#D1D5DB', color: selected ? '#1C1917' : '#9CA3AF', width: '100%' }}
      >
        <span className="flex-1 text-left truncate">{selectedLabel}</span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          className={`flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          style={{ color: '#9CA3AF' }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <ul
          className="absolute z-[200] mt-1 w-full min-w-max rounded-lg border border-gray-100 bg-white shadow-xl overflow-y-auto max-h-60"
          style={{ top: '100%', left: 0 }}
        >
          {options.map(o => (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => select(o.value)}
                className="w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50"
                style={{
                  color: o.value === selected ? '#1E1E2C' : '#374151',
                  fontWeight: o.value === selected ? 600 : 400,
                  background: o.value === selected ? '#F3F3F5' : undefined,
                }}
              >
                {o.value === selected && (
                  <span className="mr-2 text-[#E8624A]">✓</span>
                )}
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
