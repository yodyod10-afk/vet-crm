'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { addDays, format } from 'date-fns'

interface LineItem {
  description: string
  item_type: string
  quantity: number
  unit_price: number
  discount_percent: number
}

const ITEM_TYPES = ['exam', 'service', 'medication', 'vaccine', 'lab', 'surgery', 'product', 'other']

interface InvoiceBuilderProps {
  clients: { id: string; first_name: string; last_name: string; email: string | null }[]
  defaultClientId?: string
  appointmentId?: string
}

export function InvoiceBuilder({ clients, defaultClientId, appointmentId }: InvoiceBuilderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [clientId, setClientId] = useState(defaultClientId ?? '')
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'))
  const [taxRate, setTaxRate] = useState(0)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([
    { description: '', item_type: 'exam', quantity: 1, unit_price: 0, discount_percent: 0 }
  ])
  const [saving, setSaving] = useState(false)

  const addItem = () => setItems(prev => [
    ...prev,
    { description: '', item_type: 'service', quantity: 1, unit_price: 0, discount_percent: 0 }
  ])

  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))

  const updateItem = (i: number, field: keyof LineItem, value: string | number) => {
    setItems(prev => prev.map((item, idx) =>
      idx === i ? { ...item, [field]: value } : item
    ))
  }

  const itemTotal = (item: LineItem) =>
    item.quantity * item.unit_price * (1 - item.discount_percent / 100)

  const subtotal = items.reduce((s, item) => s + itemTotal(item), 0)
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  async function handleSave(status: 'draft' | 'sent') {
    if (!clientId) { toast.error('Select a client'); return }
    if (items.some(i => !i.description)) { toast.error('All line items need a description'); return }

    setSaving(true)
    const { data: invoiceRaw, error: invError } = await supabase
      .from('invoices')
      .insert({
        client_id: clientId,
        appointment_id: appointmentId || null,
        status,
        issue_date: issueDate,
        due_date: dueDate,
        tax_rate: taxRate / 100,
        notes: notes || null,
      } as any)
      .select()
      .single()

    if (invError) { setSaving(false); toast.error(invError.message); return }
    const invoice = invoiceRaw as any

    const { error: itemsError } = await supabase.from('invoice_items').insert(
      items.map((item, i) => ({
        invoice_id: invoice.id,
        description: item.description,
        item_type: item.item_type,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent,
        total_price: itemTotal(item),
        sort_order: i,
      })) as any
    )

    setSaving(false)
    if (itemsError) { toast.error(itemsError.message); return }

    toast.success(status === 'sent' ? 'Invoice created and sent' : 'Invoice saved as draft')
    router.push(`/billing/invoices/${invoice.id}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label>Client *</Label>
          <Select value={clientId} onValueChange={(v) => setClientId(v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="Select client..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.first_name} {c.last_name} {c.email ? `(${c.email})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tax_rate">Tax Rate (%)</Label>
          <Input
            id="tax_rate"
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={taxRate}
            onChange={e => setTaxRate(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="issue_date">Issue Date</Label>
          <Input id="issue_date" type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="due_date">Due Date</Label>
          <Input id="due_date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
      </div>

      {/* Line items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Line Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-2" />Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Header row */}
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 pb-1 border-b">
              <span className="col-span-4">Description</span>
              <span className="col-span-2">Type</span>
              <span className="col-span-1 text-center">Qty</span>
              <span className="col-span-2 text-right">Unit Price</span>
              <span className="col-span-1 text-center">Disc%</span>
              <span className="col-span-2 text-right">Total</span>
            </div>

            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <Input
                  className="col-span-4 h-8 text-sm"
                  placeholder="Service description..."
                  value={item.description}
                  onChange={e => updateItem(i, 'description', e.target.value)}
                />
                <Select value={item.item_type} onValueChange={(v) => updateItem(i, 'item_type', v ?? '')}>
                  <SelectTrigger className="col-span-2 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  className="col-span-1 h-8 text-sm text-center"
                  type="number" min={0} step={0.5}
                  value={item.quantity}
                  onChange={e => updateItem(i, 'quantity', Number(e.target.value))}
                />
                <div className="col-span-2 relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <Input
                    className="h-8 text-sm pl-5 text-right"
                    type="number" min={0} step={0.01}
                    value={item.unit_price}
                    onChange={e => updateItem(i, 'unit_price', Number(e.target.value))}
                  />
                </div>
                <Input
                  className="col-span-1 h-8 text-sm text-center"
                  type="number" min={0} max={100} step={1}
                  value={item.discount_percent}
                  onChange={e => updateItem(i, 'discount_percent', Number(e.target.value))}
                />
                <div className="col-span-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-right flex-1">
                    {formatCurrency(itemTotal(item))}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="ml-2 text-gray-400 hover:text-red-500"
                    disabled={items.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax ({taxRate}%)</span>
                  <span className="font-medium">{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes for client</Label>
        <Textarea id="notes" rows={3} placeholder="Payment terms, instructions..." value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      <div className="flex items-center gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="button" variant="outline" onClick={() => handleSave('draft')} disabled={saving}>
          Save Draft
        </Button>
        <Button type="button" onClick={() => handleSave('sent')} disabled={saving}>
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Create & Send'}
        </Button>
      </div>
    </div>
  )
}
