'use client'

export default function GlobalError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}) {
  return (
    <html lang="ko" style={{ colorScheme: 'dark' }}>
      <body style={{
        margin: 0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#e5e5e5',
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#999', marginBottom: '1.5rem' }}>
            {error.digest ? `Error: ${error.digest}` : 'An unexpected error occurred.'}
          </p>
          <button
            onClick={reset}
            style={{
              padding: '0.625rem 1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #333',
              background: '#1a1a1a',
              color: '#e5e5e5',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
