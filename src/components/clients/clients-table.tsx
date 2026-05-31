'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { formatPhone, formatCurrency, formatRelative } from '@/lib/utils'
import { Search, ChevronLeft, ChevronRight, Heart } from 'lucide-react'
import { useCallback } from 'react'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border-green-100',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  lead: 'bg-blue-50 text-blue-700 border-blue-100',
  deceased: 'bg-red-50 text-red-600 border-red-100',
}

interface Client {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone_primary: string | null
  status: string
  balance_due: number
  created_at: string
  pets: { id: string }[]
  profiles: { first_name: string; last_name: string } | null
}

interface ClientsTableProps {
  clients: Client[]
  total: number
  page: number
  pageSize: number
}

export function ClientsTable({ clients, total, page, pageSize }: ClientsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')

  const updateSearch = useCallback((val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (val) params.set('q', val); else params.delete('q')
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  const updateFilter = (key: string, val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (val && val !== 'all') params.set(key, val); else params.delete(key)
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search name, email, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && updateSearch(search)}
            className="pl-9"
          />
        </div>
        <Select
          defaultValue={(searchParams.get('status') || 'all') as string}
          onValueChange={v => updateFilter('status', v ?? '')}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-center">Pets</TableHead>
              <TableHead>Primary Vet</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                  No clients found
                </TableCell>
              </TableRow>
            ) : clients.map(client => (
              <TableRow key={client.id} className="hover:bg-gray-50 cursor-pointer">
                <TableCell>
                  <Link href={`/clients/${client.id}`} className="block">
                    <p className="font-medium text-gray-900 hover:text-blue-600">
                      {client.first_name} {client.last_name}
                    </p>
                    {client.email && (
                      <p className="text-xs text-gray-500 mt-0.5">{client.email}</p>
                    )}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {formatPhone(client.phone_primary)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-sm font-medium">{client.pets?.length ?? 0}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {client.profiles
                    ? `Dr. ${client.profiles.first_name} ${client.profiles.last_name}`
                    : <span className="text-gray-400">Unassigned</span>
                  }
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[client.status] ?? ''}`}>
                    {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell className="text-right text-sm font-medium">
                  <span className={client.balance_due > 0 ? 'text-orange-600' : 'text-gray-500'}>
                    {formatCurrency(client.balance_due)}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-gray-400">
                  {formatRelative(client.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              disabled={page <= 1}
              onClick={() => updateFilter('page', String(page - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={page >= totalPages}
              onClick={() => updateFilter('page', String(page + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
