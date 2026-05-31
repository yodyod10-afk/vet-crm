import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'QuickBooks Integration' }

const QB_MOCK_MODE = process.env.QB_MOCK_MODE === 'true' || process.env.QB_CLIENT_ID === undefined

export default function QuickBooksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">QuickBooks Integration</h1>
        <p className="text-gray-500 text-sm mt-1">Sync invoices and payments with QuickBooks Online</p>
      </div>

      {QB_MOCK_MODE && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
          <strong>Mock Mode Active</strong> — Set <code className="bg-yellow-100 px-1 rounded">QB_CLIENT_ID</code> and{' '}
          <code className="bg-yellow-100 px-1 rounded">QB_CLIENT_SECRET</code> in your environment to enable live QuickBooks sync.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-700 font-bold text-sm">QB</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Connection Status</h2>
              <p className="text-sm text-gray-500">{QB_MOCK_MODE ? 'Mock mode — not connected' : 'Not connected'}</p>
            </div>
          </div>
          <button
            disabled={QB_MOCK_MODE}
            className="w-full py-2 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {QB_MOCK_MODE ? 'Configure credentials to connect' : 'Connect to QuickBooks'}
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Sync Settings</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Auto-sync invoices</span>
              <span className="text-gray-400">Disabled</span>
            </div>
            <div className="flex justify-between">
              <span>Auto-sync payments</span>
              <span className="text-gray-400">Disabled</span>
            </div>
            <div className="flex justify-between">
              <span>Chart of accounts mapping</span>
              <span className="text-gray-400">Not configured</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-2">What syncs to QuickBooks?</h2>
        <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
          <li>Invoices (with line items, tax, discount)</li>
          <li>Payments received</li>
          <li>Client records as Customers</li>
          <li>Service/product items to Chart of Accounts</li>
        </ul>
      </div>
    </div>
  )
}
