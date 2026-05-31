import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatDateTime } from '@/lib/utils'

export const metadata: Metadata = { title: 'Audit Logs' }

export default async function AuditLogsPage() {
  const supabase = await createClient()

  const { data: logsRaw } = await supabase
    .from('audit_logs')
    .select('id, action, table_name, record_id, changes, created_at, profiles(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  const logs = logsRaw as any[] ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-500 text-sm mt-1">Complete activity log for compliance and security</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {logs.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No audit log entries yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Table</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Record ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-mono text-xs">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{formatDateTime(log.created_at)}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {log.profiles ? `${log.profiles.first_name} ${log.profiles.last_name}` : 'System'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium uppercase ${
                      log.action === 'DELETE' ? 'bg-red-50 text-red-700' :
                      log.action === 'INSERT' ? 'bg-green-50 text-green-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{log.table_name}</td>
                  <td className="px-4 py-3 text-gray-400">{log.record_id?.slice(0, 8)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
