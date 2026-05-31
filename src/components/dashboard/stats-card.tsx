import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  iconColor?: string
  description?: string
}

export function StatsCard({
  title, value, change, changeType = 'neutral',
  icon: Icon, iconColor = 'text-blue-600', description,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={cn('p-2.5 rounded-lg bg-gray-50', iconColor.replace('text-', 'bg-').replace('-600', '-50'))}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
      </div>
      {(change || description) && (
        <div className="flex items-center gap-1.5">
          {change && (
            <span className={cn(
              'text-xs font-medium',
              changeType === 'positive' && 'text-green-600',
              changeType === 'negative' && 'text-red-600',
              changeType === 'neutral' && 'text-gray-500',
            )}>
              {change}
            </span>
          )}
          {description && <span className="text-xs text-gray-400">{description}</span>}
        </div>
      )}
    </div>
  )
}
