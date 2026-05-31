'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatPhone, formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Phone, Mail, MapPin, User, Calendar, Heart, CreditCard,
  Edit, PawPrint, AlertTriangle, Plus
} from 'lucide-react'
import { PetCard } from '@/components/pets/pet-card'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  lead: 'bg-blue-50 text-blue-700',
}

const INVOICE_STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-50 text-green-700',
  sent: 'bg-blue-50 text-blue-700',
  overdue: 'bg-red-50 text-red-700',
  partial: 'bg-yellow-50 text-yellow-700',
  draft: 'bg-gray-100 text-gray-600',
  void: 'bg-gray-100 text-gray-400',
}

export function ClientProfile({ client, vets }: { client: any; vets: any[] }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xl font-bold">
              {getInitials(client.first_name, client.last_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {client.first_name} {client.last_name}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[client.status] ?? ''}`}>
                {client.status}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500">
              {client.email && (
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{client.email}</span>
              )}
              {client.phone_primary && (
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{formatPhone(client.phone_primary)}</span>
              )}
            </div>
            {client.primary_vet && (
              <p className="text-sm text-gray-500 mt-1">
                Primary vet: Dr. {client.primary_vet.first_name} {client.primary_vet.last_name}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <ButtonLink href={`/appointments/new?client_id=${client.id}`} variant="outline">
            <Calendar className="w-4 h-4 mr-2" />New Appointment
          </ButtonLink>
          <ButtonLink href={`/clients/${client.id}/edit`}>
            <Edit className="w-4 h-4 mr-2" />Edit
          </ButtonLink>
        </div>
      </div>

      {/* Balance alert */}
      {client.balance_due > 0 && (
        <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
          <p className="text-sm text-orange-800 font-medium">
            Outstanding balance: {formatCurrency(client.balance_due)}
          </p>
          <ButtonLink href={`/clients/${client.id}/billing`} variant="outline" size="sm" className="ml-auto border-orange-300 text-orange-700 hover:bg-orange-100">
            View Invoices
          </ButtonLink>
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pets">
            Pets <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{client.pets?.length ?? 0}</span>
          </TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-sm font-semibold text-gray-700">Contact Information</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow icon={Mail} label="Email" value={client.email} />
                <InfoRow icon={Phone} label="Primary Phone" value={formatPhone(client.phone_primary)} />
                <InfoRow icon={Phone} label="Secondary Phone" value={formatPhone(client.phone_secondary)} />
                {client.address_line1 && (
                  <div className="flex gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-500 text-xs">Address</p>
                      <p className="text-gray-900">{client.address_line1}</p>
                      {client.address_line2 && <p className="text-gray-900">{client.address_line2}</p>}
                      <p className="text-gray-900">{[client.city, client.state, client.zip].filter(Boolean).join(', ')}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm font-semibold text-gray-700">Emergency Contact</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow icon={User} label="Name" value={client.emergency_contact_name} />
                <InfoRow icon={Phone} label="Phone" value={formatPhone(client.emergency_contact_phone)} />
                <Separator />
                <InfoRow icon={PawPrint} label="Lead Source" value={client.lead_source} />
                <InfoRow icon={Calendar} label="Client Since" value={formatDate(client.created_at)} />
                {client.notes && (
                  <div className="pt-2">
                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                    <p className="text-gray-700 text-sm">{client.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pets" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-900">Pets</h2>
            <ButtonLink href={`/pets/new?client_id=${client.id}`} size="sm"><Plus className="w-4 h-4 mr-2" />Add Pet</ButtonLink>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {client.pets?.map((pet: any) => <PetCard key={pet.id} pet={pet} />)}
            {!client.pets?.length && (
              <p className="text-gray-400 text-sm col-span-3 py-8 text-center">No pets added yet</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-900">Invoices</h2>
            <ButtonLink href={`/billing/invoices/new?client_id=${client.id}`} size="sm">
              <Plus className="w-4 h-4 mr-2" />New Invoice
            </ButtonLink>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {!client.invoices?.length ? (
              <div className="py-12 text-center text-gray-400 text-sm">No invoices yet</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Invoice #</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {client.invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/billing/invoices/${inv.id}`} className="text-blue-600 hover:underline font-medium">
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(inv.issue_date)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${INVOICE_STATUS_COLORS[inv.status] ?? ''}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(inv.total_amount)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={inv.balance_due > 0 ? 'text-orange-600 font-medium' : 'text-gray-400'}>
                          {formatCurrency(inv.balance_due)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-gray-900">{value}</p>
      </div>
    </div>
  )
}
