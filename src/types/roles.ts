export type UserRole = 'owner' | 'veterinarian' | 'receptionist' | 'client'

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Owner / Administrator',
  veterinarian: 'Veterinarian',
  receptionist: 'Receptionist',
  client: 'Pet Owner',
}

export const STAFF_ROLES: UserRole[] = ['owner', 'veterinarian', 'receptionist']

export function canAccessRoute(role: UserRole, path: string): boolean {
  if (path.startsWith('/portal') && role !== 'client') return false
  if (!path.startsWith('/portal') && role === 'client') return false

  const ownerOnlyPaths = [
    '/dashboard/payroll',
    '/dashboard/staff',
    '/dashboard/reports',
    '/dashboard/integrations',
    '/dashboard/audit-logs',
  ]
  if (ownerOnlyPaths.some(p => path.startsWith(p)) && role !== 'owner') return false

  return true
}

export function isStaff(role: UserRole): boolean {
  return STAFF_ROLES.includes(role)
}
