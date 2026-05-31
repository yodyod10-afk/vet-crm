import type { Metadata } from 'next'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { PawPrint } from 'lucide-react'

export const metadata: Metadata = { title: 'Reset Password' }

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <PawPrint className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold">VetCRM</span>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Set new password</h1>
          <p className="text-gray-500 mt-2">Enter your new password below</p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  )
}
