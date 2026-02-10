import { NextResponse } from 'next/server'
import { z } from 'zod'
import { refreshNeighborhoodImages } from '@/lib/image-refresh'
import { NEIGHBORHOOD_QUERIES } from '@/data/neighborhood-queries'

export const maxDuration = 55

const BatchSchema = z.object({
  city: z.enum(['abudhabi', 'dubai']).optional(),
  items: z.array(z.object({
    city: z.enum(['abudhabi', 'dubai']).optional(),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    queries: z.array(z.string()).optional(),
  })).optional(),
  all: z.boolean().optional(),
})

const SLUG_CITY: Record<string, 'abudhabi' | 'dubai'> = {
  'saadiyat-island': 'abudhabi',
  'al-maryah-island': 'abudhabi',
  'downtown-corniche': 'abudhabi',
  'yas-island': 'abudhabi',
  'al-reem-island': 'abudhabi',
  'masdar-city': 'abudhabi',
  'kizad': 'abudhabi',
  'difc': 'dubai',
  'downtown-dubai': 'dubai',
  'business-bay': 'dubai',
  'dubai-marina': 'dubai',
  'jlt': 'dubai',
  'internet-city-media-city': 'dubai',
  'deira-old-dubai': 'dubai',
  'dubai-south': 'dubai',
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const secret = request.headers.get('x-admin-secret') || request.headers.get('authorization')?.replace('Bearer ', '')
    const expected = process.env.ADMIN_PASSWORD ?? process.env.CRON_SECRET
    if (!expected || secret !== expected) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = BatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    // Build items
    let items: Array<{ city: 'abudhabi' | 'dubai'; slug: string; queries?: string[] }>

    if (parsed.data.all) {
      items = Object.entries(SLUG_CITY).map(([slug, city]) => ({
        city,
        slug,
        queries: NEIGHBORHOOD_QUERIES[slug] ? [...NEIGHBORHOOD_QUERIES[slug]] : undefined,
      }))
    } else if (parsed.data.items) {
      items = parsed.data.items.map(item => ({
        city: item.city ?? parsed.data.city ?? SLUG_CITY[item.slug] ?? 'dubai',
        slug: item.slug,
        queries: item.queries,
      }))
    } else {
      return NextResponse.json(
        { success: false, error: 'Provide items[] or all:true' },
        { status: 400 }
      )
    }

    // NOTE: With 15 neighborhoods × ~10s each, all:true may timeout on Vercel.
    // For full batch, run items in smaller groups or call single refresh per slug.
    const maxItems = 5 // safety cap per request
    const batch = items.slice(0, maxItems)

    const results: Array<{ slug: string; success: boolean; selected?: number; error?: string }> = []

    for (const item of batch) {
      try {
        const result = await refreshNeighborhoodImages({
          city: item.city,
          slug: item.slug,
          queries: item.queries,
          setActive: true,
          topN: 3,
        })

        results.push({
          slug: item.slug,
          success: result.success,
          selected: result.selected.length,
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
        note: `Only ${maxItems} items processed per request to avoid timeout. Remaining: ${items.slice(maxItems).map(i => i.slug).join(', ')}`,
      } : {}),
    })
  } catch (error) {
    console.error('Batch refresh error:', error)
    return NextResponse.json(
      { success: false, error: 'Batch refresh failed' },
      { status: 500 }
    )
  }
}
