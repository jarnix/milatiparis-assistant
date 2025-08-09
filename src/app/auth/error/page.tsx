'use client'

import Link from 'next/link'

export default function AuthError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your email is not authorized to access this application.
          </p>
          <div className="mt-6">
            <Link
              href="/auth/signin"
              className="text-primary hover:text-primary/90 font-medium"
            >
              Try again
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}