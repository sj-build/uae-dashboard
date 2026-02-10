import { NextResponse } from 'next/server'
import { z } from 'zod'
import { searchNaverNews } from '@/lib/naver'
import { saveNewsItems, startIngestionRun, finishIngestionRun } from '@/lib/newsStore'

export const maxDuration = 55

// Default queries for Korean UAE news
const DEFAULT_QUERIES: readonly string[] = [
  'UAE 투자',
  '아부다비 경제',
  '한국 UAE 협력',
  'UAE 부동산',
  'UAE 크립토 스테이블코인',
  'UAE AI 데이터센터',
  '무바달라 ADIA',
  '두바이 한국 기업',
] as const

const RequestSchema = z.object({
  queries: z.array(z.string().max(200)).min(1).max(20).optional(),
  display: z.number().int().min(1).max(100).default(10),
  category: z.string().max(50).optional(),
})

function checkAuth(request: Request): boolean {
  const secret = request.headers.get('x-admin-secret')
    || request.headers.get('authorization')?.replace('Bearer ', '')
  const expected = process.env.ADMIN_PASSWORD ?? process.env.CRON_SECRET
  return Boolean(expected && secret === expected)
}

/**
 * POST /api/ingest/naver
 *
 * Fetch Korean news from Naver Search API and save to news_items.
 * Title + summary are saved immediately. Fulltext is NOT attempted here.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!checkAuth(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  let runId: number | null = null

  try {
    const body = await request.json()
    const parsed = RequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      )
    }

    const queries = parsed.data.queries ?? [...DEFAULT_QUERIES]
    const { display, category } = parsed.data

    // Start ingestion run log
    runId = await startIngestionRun('naver', queries)

    // Fetch from Naver
    const items = await searchNaverNews(queries, { display })

    // Save to DB
    const result = await saveNewsItems(items, {
      category,
      syncToDocuments: true,
    })

    const duration_ms = Date.now() - startTime
    const status = result.errors > 0
      ? (result.saved > 0 ? 'partial' : 'failed')
      : 'success'

    // Finish ingestion run log
    await finishIngestionRun(runId, {
      status,
      fetched: items.length,
      saved: result.saved,
      skipped: result.skipped,
      errors: result.errors,
      duration_ms,
    })

    return NextResponse.json({
      success: true,
      run_id: runId,
      fetched: items.length,
      saved: result.saved,
      skipped: result.skipped,
      errors: result.errors,
      documents_synced: result.documentsSynced,
      duration_ms,
      queries_used: queries.length,
    })
  } catch (error) {
    const duration_ms = Date.now() - startTime
    const message = error instanceof Error ? error.message : 'Naver ingestion failed'

    // Log failed run
    if (runId !== null) {
      try {
        await finishIngestionRun(runId, {
          status: 'failed',
          fetched: 0,
          saved: 0,
          skipped: 0,
          errors: 1,
          duration_ms,
          meta: { error: message },
        })
      } catch {
        // Logging failure doesn't block error response
      }
    }

    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
