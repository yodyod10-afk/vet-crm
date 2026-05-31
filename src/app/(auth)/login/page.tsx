export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/login-form'
import { PawPrint } from 'lucide-react'

export const metadata: Metadata = { title: 'Sign In' }

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <PawPrint className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold">VetCRM</span>
        </div>
        <div>
          <blockquote className="text-2xl font-light leading-relaxed">
            &ldquo;The most comprehensive veterinary practice management platform — built for modern clinics.&rdquo;
          </blockquote>
          <div className="mt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
              DR
            </div>
            <div>
              <p className="font-medium">Dr. Rachel Torres</p>
              <p className="text-blue-200 text-sm">Chief Veterinarian, Animal Care Hospital</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: 'Active Clients', value: '1,200+' },
            { label: 'Appointments / mo', value: '450+' },
            { label: 'Vets Supported', value: '8' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/10 rounded-xl p-4">
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-blue-200 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <PawPrint className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">VetCRM</span>
          </div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-500 mt-2">Sign in to your practice account</p>
          </div>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
