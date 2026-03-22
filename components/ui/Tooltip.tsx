'use client'

import { useState } from 'react'

interface Props {
  text: string
}

export function Tooltip({ text }: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="w-3.5 h-3.5 rounded-full bg-gray-200 text-gray-500 text-[9px] font-bold flex items-center justify-center hover:bg-gray-300 transition-colors focus:outline-none"
        aria-label="More info"
      >
        I
      </button>
      {visible && (
        <span className="absolute top-full right-0 mt-2 w-56 text-xs text-gray-700 bg-white border border-gray-200 rounded-xl shadow-xl px-3 py-2 leading-relaxed z-50 pointer-events-none">
          <span className="absolute bottom-full right-1 border-4 border-transparent border-b-white" />
          {text}
        </span>
      )}
    </span>
  )
}
