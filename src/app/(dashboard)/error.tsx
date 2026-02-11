'use client'

export default function DashboardError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h2 className="text-lg font-semibold text-t1 mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-t3 mb-6">
          {error.digest ? `Error: ${error.digest}` : 'An unexpected error occurred while loading the page.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl border border-brd bg-bg3/60 text-t2 text-sm font-medium hover:border-gold/30 hover:text-gold transition-all"
          >
            Try again
          </button>
          <a
            href="/home"
            className="px-5 py-2.5 rounded-xl border border-gold/30 bg-gold/10 text-gold text-sm font-medium hover:bg-gold/20 transition-all"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  )
}
