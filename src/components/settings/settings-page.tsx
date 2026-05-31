'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Loader2, User, Building2, Lock } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { ROLE_LABELS } from '@/types/roles'

const profileSchema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
})

const orgSchema = z.object({
  name: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  address_line1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  website: z.string().optional(),
  timezone: z.string().optional(),
})

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Required'),
  new_password: z.string().min(8, 'Minimum 8 characters'),
  confirm_password: z.string().min(1, 'Required'),
}).refine(d => d.new_password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

type ProfileData = z.infer<typeof profileSchema>
type OrgData = z.infer<typeof orgSchema>
type PasswordData = z.infer<typeof passwordSchema>

export function SettingsPage({ profile }: { profile: any }) {
  const supabase = createClient()
  const isOwner = profile?.role === 'owner'

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema) as any,
    defaultValues: {
      first_name: profile?.first_name ?? '',
      last_name: profile?.last_name ?? '',
      email: profile?.email ?? '',
      phone: profile?.phone ?? '',
    },
  })

  const orgForm = useForm<OrgData>({
    resolver: zodResolver(orgSchema) as any,
    defaultValues: {
      name: profile?.organizations?.name ?? '',
      phone: profile?.organizations?.phone ?? '',
      email: profile?.organizations?.email ?? '',
      address_line1: profile?.organizations?.address_line1 ?? '',
      city: profile?.organizations?.city ?? '',
      state: profile?.organizations?.state ?? '',
      zip: profile?.organizations?.zip ?? '',
      website: profile?.organizations?.website ?? '',
      timezone: profile?.organizations?.timezone ?? 'America/New_York',
    },
  })

  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema) as any,
  })

  async function saveProfile(data: ProfileData) {
    const { error } = await supabase
      .from('profiles')
      .update({ first_name: data.first_name, last_name: data.last_name, phone: data.phone || null } as never)
      .eq('id', profile.id)
    if (error) { toast.error(error.message); return }
    toast.success('Profile updated')
  }

  async function saveOrg(data: OrgData) {
    const { error } = await supabase
      .from('organizations')
      .update({
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        address_line1: data.address_line1 || null,
        city: data.city || null,
        state: data.state || null,
        zip: data.zip || null,
        website: data.website || null,
        timezone: data.timezone || null,
      } as never)
      .eq('id', profile.organizations?.id)
    if (error) { toast.error(error.message); return }
    toast.success('Practice settings updated')
  }

  async function changePassword(data: PasswordData) {
    const { error } = await supabase.auth.updateUser({ password: data.new_password })
    if (error) { toast.error(error.message); return }
    toast.success('Password updated')
    passwordForm.reset()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your profile and practice settings</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile"><User className="w-4 h-4 mr-2" />Profile</TabsTrigger>
          {isOwner && <TabsTrigger value="practice"><Building2 className="w-4 h-4 mr-2" />Practice</TabsTrigger>}
          <TabsTrigger value="security"><Lock className="w-4 h-4 mr-2" />Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xl font-bold">
                    {getInitials(profile?.first_name, profile?.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{profile?.first_name} {profile?.last_name}</CardTitle>
                  <p className="text-sm text-gray-500 mt-0.5">{ROLE_LABELS[profile?.role as keyof typeof ROLE_LABELS]}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input id="first_name" {...profileForm.register('first_name')} />
                    {profileForm.formState.errors.first_name && (
                      <p className="text-xs text-red-500">{profileForm.formState.errors.first_name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input id="last_name" {...profileForm.register('last_name')} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" disabled value={profile?.email ?? ''} className="bg-gray-50" />
                    <p className="text-xs text-gray-400">Email cannot be changed here</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" {...profileForm.register('phone')} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                    {profileForm.formState.isSubmitting
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                      : 'Save Profile'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {isOwner && (
          <TabsContent value="practice" className="mt-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Practice Information</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={orgForm.handleSubmit(saveOrg)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="org_name">Practice Name</Label>
                    <Input id="org_name" {...orgForm.register('name')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="org_phone">Phone</Label>
                      <Input id="org_phone" type="tel" {...orgForm.register('phone')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org_email">Email</Label>
                      <Input id="org_email" type="email" {...orgForm.register('email')} />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="address_line1">Street Address</Label>
                    <Input id="address_line1" {...orgForm.register('address_line1')} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2 col-span-1">
                      <Label htmlFor="org_city">City</Label>
                      <Input id="org_city" {...orgForm.register('city')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org_state">State</Label>
                      <Input id="org_state" maxLength={2} {...orgForm.register('state')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org_zip">ZIP</Label>
                      <Input id="org_zip" {...orgForm.register('zip')} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input id="website" type="url" placeholder="https://..." {...orgForm.register('website')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input id="timezone" {...orgForm.register('timezone')} placeholder="America/New_York" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={orgForm.formState.isSubmitting}>
                      {orgForm.formState.isSubmitting
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                        : 'Save Practice Settings'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(changePassword)} className="space-y-4 max-w-sm">
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input id="current_password" type="password" {...passwordForm.register('current_password')} />
                  {passwordForm.formState.errors.current_password && (
                    <p className="text-xs text-red-500">{passwordForm.formState.errors.current_password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input id="new_password" type="password" {...passwordForm.register('new_password')} />
                  {passwordForm.formState.errors.new_password && (
                    <p className="text-xs text-red-500">{passwordForm.formState.errors.new_password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input id="confirm_password" type="password" {...passwordForm.register('confirm_password')} />
                  {passwordForm.formState.errors.confirm_password && (
                    <p className="text-xs text-red-500">{passwordForm.formState.errors.confirm_password.message}</p>
                  )}
                </div>
                <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                  {passwordForm.formState.isSubmitting
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</>
                    : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
