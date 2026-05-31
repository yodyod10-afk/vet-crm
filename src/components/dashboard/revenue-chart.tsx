'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

const MOCK_DATA = [
  { month: 'Dec', revenue: 32400 },
  { month: 'Jan', revenue: 38200 },
  { month: 'Feb', revenue: 35100 },
  { month: 'Mar', revenue: 41800 },
  { month: 'Apr', revenue: 44200 },
  { month: 'May', revenue: 48290 },
]

export function RevenueChart({ orgId }: { orgId: string }) {
  // In production, fetch real monthly revenue data
  void orgId

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={MOCK_DATA} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `$${(v/1000).toFixed(0)}k`}
          width={40}
        />
        <Tooltip
          formatter={(v) => [formatCurrency(Number(v)), 'Revenue']}
          contentStyle={{ border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: 12 }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#revenueGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
