import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Communications' }

export default function CommunicationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
        <p className="text-gray-500 text-sm mt-1">Email and SMS messaging center</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Communications Module</h2>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Automated appointment reminders, SMS messaging, and email campaigns are coming in Phase 2.
          Configure Twilio and SendGrid credentials in Settings to enable.
        </p>
      </div>
    </div>
  )
}
