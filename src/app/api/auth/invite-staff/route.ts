import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { email, first_name, last_name, role } = await req.json()

    if (!email || !first_name || !last_name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['veterinarian', 'receptionist'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const serverSupabase = await createClient()
    const { data: { user } } = await serverSupabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: callerProfileRaw } = await serverSupabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()
    const callerProfile = callerProfileRaw as any

    if (callerProfile?.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can invite staff' }, { status: 403 })
    }

    const adminSupabase = createAdminClient()

    const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
      data: {
        first_name,
        last_name,
        role,
        organization_id: callerProfile.organization_id,
      },
    })

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 })
    }

    // Pre-create profile row so it's ready when they accept
    await adminSupabase.from('profiles').upsert({
      id: inviteData.user.id,
      email,
      first_name,
      last_name,
      role,
      organization_id: callerProfile.organization_id,
      is_active: false,
    } as any)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
