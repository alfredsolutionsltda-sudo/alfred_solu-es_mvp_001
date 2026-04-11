import { ButtonHTMLAttributes, ReactNode } from 'react'
import { Bot, Sparkles, Send, Plus, ArrowRight } from 'lucide-react'
import Image from 'next/image'

interface AlfredButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  iconName?: 'bot' | 'sparkles' | 'send' | 'plus' | 'arrow-right'
  children: ReactNode
}

const IconMap = {
  'bot': Bot,
  'sparkles': Sparkles,
  'send': Send,
  'plus': Plus,
  'arrow-right': ArrowRight
}

export default function AlfredButton({
  variant = 'primary',
  size = 'md',
  iconName,
  children,
  className = '',
  ...props
}: AlfredButtonProps) {
  const Icon = iconName ? IconMap[iconName] : null
  const base =
    'inline-flex items-center justify-center gap-2 font-bold transition-all duration-300 active:scale-95 disabled:opacity-60 disabled:pointer-events-none rounded-xl'

  const variants = {
    primary:
      'bg-[#1455CE] text-white shadow-lg shadow-[#1455CE]/20 hover:bg-[#114ab3] hover:-translate-y-0.5',
    ghost:
      'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
    outline:
      'border border-neutral-200 text-neutral-700 hover:border-[#1455CE]/30 hover:text-[#1455CE] hover:bg-[#1455CE]/5',
  }

  const sizes = {
    sm: 'px-5 py-2 text-xs',
    md: 'px-7 py-3.5 text-sm',
    lg: 'px-8 py-4 text-base',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {Icon && (
        iconName === 'bot' ? (
          <img 
            src="/images/alfred-avatar.png" 
            alt="Alfred" 
            className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} object-contain`}
          />
        ) : (
          <Icon 
            size={size === 'sm' ? 14 : 18} 
            className="leading-none stroke-[2.5px]"
          />
        )
      )}
      {children}
    </button>
  )
}
