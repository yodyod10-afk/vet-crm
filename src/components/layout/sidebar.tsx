'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types/database'
import {
  PawPrint, LayoutDashboard, Users, Heart, Calendar, FileText,
  CreditCard, DollarSign, Megaphone, BarChart3, Settings,
  UserCog, Link2, Shield, ChevronLeft, ChevronRight, Syringe
} from 'lucide-react'
import { useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles: Profile['role'][]
  badge?: number
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['owner', 'veterinarian', 'receptionist'] },
  { label: 'Clients', href: '/clients', icon: Users, roles: ['owner', 'veterinarian', 'receptionist'] },
  { label: 'Pets', href: '/pets', icon: Heart, roles: ['owner', 'veterinarian', 'receptionist'] },
  { label: 'Appointments', href: '/appointments', icon: Calendar, roles: ['owner', 'veterinarian', 'receptionist'] },
  { label: 'Medical Records', href: '/medical-records', icon: FileText, roles: ['owner', 'veterinarian'] },
  { label: 'Vaccinations', href: '/vaccinations', icon: Syringe, roles: ['owner', 'veterinarian', 'receptionist'] },
  { label: 'Billing', href: '/billing', icon: CreditCard, roles: ['owner', 'receptionist'] },
  { label: 'Payroll', href: '/payroll', icon: DollarSign, roles: ['owner'] },
  { label: 'CRM / Leads', href: '/crm', icon: Megaphone, roles: ['owner', 'receptionist'] },
  { label: 'Reports', href: '/reports', icon: BarChart3, roles: ['owner'] },
  { label: 'Communications', href: '/communications', icon: Megaphone, roles: ['owner', 'receptionist'] },
  { label: 'Staff', href: '/staff', icon: UserCog, roles: ['owner'] },
  { label: 'Integrations', href: '/integrations/quickbooks', icon: Link2, roles: ['owner'] },
  { label: 'Audit Logs', href: '/audit-logs', icon: Shield, roles: ['owner'] },
  { label: 'Settings', href: '/settings', icon: Settings, roles: ['owner', 'veterinarian', 'receptionist'] },
]

interface SidebarProps {
  profile: Profile & { organizations: { name: string; logo_url: string | null } }
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const filtered = NAV_ITEMS.filter(item => item.roles.includes(profile.role))

  return (
    <aside
      className={cn(
        'flex flex-col bg-white border-r border-gray-200 transition-all duration-300 relative',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-gray-100', collapsed && 'justify-center px-2')}>
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <PawPrint className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-sm text-gray-900 truncate">VetCRM</p>
            <p className="text-xs text-gray-500 truncate">{profile.organizations.name}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {filtered.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger
                  render={<Link href={item.href} />}
                  className={cn(
                    'flex items-center justify-center w-full h-10 rounded-lg transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="ml-auto text-xs bg-red-100 text-red-600 font-medium px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  )
}
