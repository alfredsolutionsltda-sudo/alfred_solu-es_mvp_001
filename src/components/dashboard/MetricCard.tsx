import { Calendar, TrendingUp, DollarSign, Users, FileText, AlertCircle } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle: string
  iconName: 'calendar' | 'trending-up' | 'dollar-sign' | 'users' | 'file-text' | 'alert'
  colorTheme?: 'primary' | 'green'
  variation?: number
}

const IconMap = {
  'calendar': Calendar,
  'trending-up': TrendingUp,
  'dollar-sign': DollarSign,
  'users': Users,
  'file-text': FileText,
  'alert': AlertCircle
}

export default function MetricCard({ title, value, subtitle, iconName, colorTheme = 'green', variation }: MetricCardProps) {
  const Icon = IconMap[iconName] || AlertCircle
  
  const isPrimary = colorTheme === 'primary'
  
  // Cores dinâmicas para o dot matrix animado
  const dotColorActive = isPrimary ? 'bg-[#1455CE] shadow-sm shadow-[#1455CE]/20' : 'bg-green-500 shadow-sm shadow-green-500/20'
  const dotColorHover = isPrimary ? 'bg-[#1455CE]/30 group-hover:h-8' : 'bg-green-50 group-hover:h-8'
  const dotColorIdle = isPrimary ? 'bg-[#1455CE]/10' : 'bg-green-100'

  return (
    <div className="lg:col-span-4 bg-surface-container-lowest rounded-2xl p-6 md:p-8 shadow-premium flex flex-col justify-between hover:shadow-premium-hover transition-all duration-500 group h-full relative">
      <div className="flex justify-between items-start">
        <h3 className="text-[9px] md:text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">
          {title}
        </h3>
        {variation !== undefined && (
          <div 
            className={`px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold ${variation >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
            aria-label={`Variação de ${variation.toFixed(1)}%`}
          >
            {variation > 0 ? '+' : ''}{variation.toFixed(1)}%
          </div>
        )}
      </div>

      <div className="flex items-end justify-between mt-auto pt-4 md:pt-6">
        <div className="min-w-0">
          <h2 className="text-3xl md:text-4xl font-headline font-black tracking-tighter text-neutral-900 truncate">
            {value}
          </h2>
          <p className={`text-[10px] md:text-[11px] font-bold mt-1.5 md:mt-2 flex items-center gap-1.5 ${isPrimary ? 'text-[#1455CE]' : 'text-neutral-400'}`}>
            <Icon size={14} className="font-bold flex-shrink-0" />
            <span className="truncate">{subtitle}</span>
          </p>
        </div>
        <div className="flex gap-1 md:gap-1.5 items-end relative h-10 md:h-12 shrink-0">
          {/* Dot matrix animado */}
          {[4, 7, 3, 10, 6].map((h, i) => (
            <div
              key={i}
              className={`w-2 md:w-2.5 rounded-md transition-all duration-300 ${i === 3 || (variation && i === 4) ? dotColorActive : i % 2 === 0 ? dotColorHover : dotColorIdle}`}
              style={{ height: `${h * 4}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
