export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { PawPrint } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Forgot Password' }

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <PawPrint className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold">VetCRM</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset your password</h1>
          <p className="text-gray-500 mb-6 text-sm">
            Enter your email and we&apos;ll send you a reset link.
          </p>
          <ForgotPasswordForm />
          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-blue-600 hover:underline">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
