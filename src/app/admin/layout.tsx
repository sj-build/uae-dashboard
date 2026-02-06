'use client'

import { useState, useCallback, type FormEvent } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

function LoginForm({ onLogin }: { readonly onLogin: (password: string) => Promise<boolean> }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const success = await onLogin(password)
      if (!success) {
        setError('Invalid password')
        setPassword('')
      }
    } catch {
      setError('Authentication failed')
    } finally {
      setSubmitting(false)
    }
  }, [password, onLogin])

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="bg-bg2 border border-brd rounded-xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="font-display text-xl font-bold text-gold tracking-wide">
              All About UAE ADMIN
            </h1>
            <p className="text-t3 text-xs mt-1.5">
              Authentication required
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="admin-password"
                className="block text-xs font-medium text-t2 mb-1.5"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-3 py-2.5 bg-bg3 border border-brd rounded-lg text-sm text-t1 placeholder:text-t4 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all duration-200"
                autoFocus
                disabled={submitting}
              />
            </div>

            {error && (
              <p className="text-accent-red text-xs mb-4">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !password}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-gold/15 text-gold border border-gold/25 hover:bg-gold/25 hover:border-gold/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-t4 text-[10px] mt-4">
          UAE Intelligence Dashboard — Admin Portal
        </p>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" />
        <p className="text-t3 text-xs mt-3">Verifying session...</p>
      </div>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, login, logout } = useAdminAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />
  }

  return (
    <div className="min-h-screen bg-bg flex">
      <AdminSidebar onLogout={logout} />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-[1400px] mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
