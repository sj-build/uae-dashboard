import { NextResponse } from 'next/server'
import { z } from 'zod'
import { collectCandidates } from '@/lib/image-refresh'
import { NEIGHBORHOOD_QUERIES } from '@/data/neighborhood-queries'

export const maxDuration = 55

const BatchSchema = z.object({
  items: z.array(z.object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    queries: z.array(z.string()).optional(),
  })).optional(),
  all: z.boolean().optional(),
})

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json()
    const parsed = BatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    let items: Array<{ slug: string; queries?: string[] }>

    if (parsed.data.all) {
      items = Object.keys(NEIGHBORHOOD_QUERIES).map(slug => ({
        slug,
        queries: [...NEIGHBORHOOD_QUERIES[slug]],
      }))
    } else if (parsed.data.items) {
      items = parsed.data.items
    } else {
      return NextResponse.json(
        { success: false, error: 'Provide items[] or all:true' },
        { status: 400 }
      )
    }

    const maxItems = 5
    const batch = items.slice(0, maxItems)

    const results: Array<{ slug: string; success: boolean; saved?: number; google?: number; unsplash?: number; error?: string }> = []

    for (const item of batch) {
      try {
        const result = await collectCandidates({
          slug: item.slug,
          queries: item.queries,
          maxCandidates: 6,
        })

        results.push({
          slug: item.slug,
          success: result.success,
          saved: result.saved,
          google: result.google_count,
          unsplash: result.unsplash_count,
          error: result.error,
        })
      } catch (err) {
        results.push({
          slug: item.slug,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }

      await sleep(500)
    }

    return NextResponse.json({
      success: true,
      total: items.length,
      processed: batch.length,
      skipped: items.length - batch.length,
      succeeded: results.filter(r => r.success).length,
      results,
      ...(items.length > maxItems ? {
        note: `Only ${maxItems} items processed per request. Remaining: ${items.slice(maxItems).map(i => i.slug).join(', ')}`,
      } : {}),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Batch refresh failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
