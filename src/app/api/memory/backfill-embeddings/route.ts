import { NextResponse } from 'next/server'

export const maxDuration = 55

/**
 * Backfill embeddings for existing documents
 * POST /api/memory/backfill-embeddings
 *
 * Processes documents that have embedding_status = 'pending'
 * and generates embeddings for them in batches.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET ?? process.env.ADMIN_PASSWORD

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body for options
    let batchSize = 10
    let maxBatches = 5
    try {
      const body = await request.json()
      batchSize = body.batchSize ?? 10
      maxBatches = body.maxBatches ?? 5
    } catch {
      // Use defaults if no body
    }

    // Check if embeddings are configured
    const { isEmbeddingConfigured } = await import('@/lib/embeddings')
    if (!isEmbeddingConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Embeddings not configured. Set EMBEDDING_PROVIDER and OPENAI_API_KEY.',
      }, { status: 503 })
    }

    // Import required functions
    const {
      getPendingDocumentsForEmbedding,
      processDocumentEmbeddings,
    } = await import('@/lib/db')

    let totalProcessed = 0
    let totalChunks = 0
    let totalTokens = 0
    let errors: string[] = []

    // Process in batches
    for (let batch = 0; batch < maxBatches; batch++) {
      const pendingDocs = await getPendingDocumentsForEmbedding(batchSize)

      if (pendingDocs.length === 0) {
        break // No more pending documents
      }

      for (const doc of pendingDocs) {
        if (!doc.content) {
          continue
        }

        try {
          const result = await processDocumentEmbeddings(
            doc.id,
            doc.content,
            doc.title ?? 'Untitled'
          )

          totalProcessed++
          totalChunks += result.chunksCreated
          totalTokens += result.tokensUsed
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          errors.push(`${doc.id}: ${errorMsg}`)

          // Stop if we hit rate limits
          if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
            return NextResponse.json({
              success: false,
              error: 'Rate limited by OpenAI API. Try again later.',
              processed: totalProcessed,
              chunks_created: totalChunks,
              tokens_used: totalTokens,
              errors,
            }, { status: 429 })
          }
        }
      }

      // Small delay between batches to avoid rate limits
      if (batch < maxBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${totalProcessed} documents, created ${totalChunks} chunks`,
      processed: totalProcessed,
      chunks_created: totalChunks,
      tokens_used: totalTokens,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Backfill error:', error)
    const errorMessage = error instanceof Error
      ? error.message
      : 'Unknown error during backfill'

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

// GET for manual trigger with password
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url)
  const password = url.searchParams.get('password')

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Forward to POST handler with default options
  const newRequest = new Request(request.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ADMIN_PASSWORD}`,
    },
    body: JSON.stringify({ batchSize: 10, maxBatches: 3 }),
  })

  return POST(newRequest)
}
