'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export default function FilterPeriod() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentPeriod = searchParams.get('period') || 'mes'

  const periods = [
    { value: 'mes', label: 'Mês' },
    { value: 'trimestre', label: 'Trimestre' },
    { value: 'ano', label: 'Ano' },
  ]

  const handleChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', val)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex bg-white rounded-xl p-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-neutral-100">
      {periods.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => handleChange(value)}
          className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${
            currentPeriod === value
              ? 'bg-neutral-100 text-neutral-900'
              : 'text-neutral-400 hover:text-neutral-900'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
