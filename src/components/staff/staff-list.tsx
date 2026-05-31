'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getInitials, formatRelative } from '@/lib/utils'
import { ROLE_LABELS } from '@/types/roles'
import { Plus, Mail, UserX, UserCheck, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-50 text-purple-700',
  veterinarian: 'bg-blue-50 text-blue-700',
  receptionist: 'bg-green-50 text-green-700',
}

export function StaffList({ staff }: { staff: any[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteFirstName, setInviteFirstName] = useState('')
  const [inviteLastName, setInviteLastName] = useState('')
  const [inviteRole, setInviteRole] = useState('receptionist')
  const [inviting, setInviting] = useState(false)

  async function handleInvite() {
    if (!inviteEmail || !inviteFirstName || !inviteLastName) {
      toast.error('Fill in all required fields')
      return
    }
    setInviting(true)
    try {
      const res = await fetch('/api/auth/invite-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          first_name: inviteFirstName,
          last_name: inviteLastName,
          role: inviteRole,
        }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Failed to send invite'); return }
      toast.success(`Invite sent to ${inviteEmail}`)
      setInviteOpen(false)
      setInviteEmail('')
      setInviteFirstName('')
      setInviteLastName('')
      router.refresh()
    } finally {
      setInviting(false)
    }
  }

  async function toggleActive(id: string, currentlyActive: boolean) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !currentlyActive } as never)
      .eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success(currentlyActive ? 'Staff member deactivated' : 'Staff member activated')
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setInviteOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />Invite Staff Member
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {staff.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">No staff members found</td>
              </tr>
            ) : staff.map(member => (
              <tr key={member.id} className={`hover:bg-gray-50 ${!member.is_active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={member.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                        {getInitials(member.first_name, member.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-gray-900">
                      {member.first_name} {member.last_name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[member.role] ?? 'bg-gray-100 text-gray-600'}`}>
                    {ROLE_LABELS[member.role as keyof typeof ROLE_LABELS] ?? member.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{member.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${member.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {member.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">{formatRelative(member.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(member.id, member.is_active)}
                    className="text-gray-500"
                  >
                    {member.is_active
                      ? <><UserX className="w-4 h-4 mr-1" />Deactivate</>
                      : <><UserCheck className="w-4 h-4 mr-1" />Activate</>}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="inv_first">First Name *</Label>
                <Input id="inv_first" value={inviteFirstName} onChange={e => setInviteFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv_last">Last Name *</Label>
                <Input id="inv_last" value={inviteLastName} onChange={e => setInviteLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv_email">Email Address *</Label>
              <Input id="inv_email" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select defaultValue="receptionist" onValueChange={v => setInviteRole(v ?? 'receptionist')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="veterinarian">Veterinarian</SelectItem>
                  <SelectItem value="receptionist">Receptionist</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviting}>
              {inviting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : <><Mail className="w-4 h-4 mr-2" />Send Invite</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
