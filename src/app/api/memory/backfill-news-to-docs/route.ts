import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { upsertDocumentFromNews } from '@/lib/db'

export const maxDuration = 55

/**
 * POST /api/memory/backfill-news-to-docs
 *
 * Sync existing news_articles → documents table in batches.
 * Call repeatedly until remaining = 0.
 *
 * Body: { batchSize?: number } (default 200)
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET ?? process.env.ADMIN_PASSWORD

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    let batchSize = 200
    try {
      const body = await request.json()
      batchSize = body.batchSize ?? 200
    } catch {
      // Use defaults
    }

    const supabase = getSupabaseAdmin()

    // Get news_articles that aren't yet in documents
    // documents uses content_hash = sha256(url) for dedup
    // We can't easily check sha256 in SQL, so fetch news_articles and let upsert handle dedup
    const { data: articles, error: fetchError } = await supabase
      .from('news_articles')
      .select('title, url, summary, publisher, published_at, tags, category')
      .order('published_at', { ascending: false })
      .limit(batchSize)

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    }

    if (!articles || articles.length === 0) {
      return NextResponse.json({ success: true, synced: 0, message: 'No articles to sync' })
    }

    // Get existing document URLs to skip
    const { data: existingDocs } = await supabase
      .from('documents')
      .select('url')
      .eq('source', 'news')
      .not('url', 'is', null)

    const existingUrls = new Set((existingDocs ?? []).map(d => d.url))

    let synced = 0
    let skipped = 0
    let errors = 0

    for (const article of articles) {
      if (existingUrls.has(article.url)) {
        skipped++
        continue
      }

      try {
        await upsertDocumentFromNews({
          title: article.title,
          url: article.url,
          summary: article.summary ?? null,
          publisher: article.publisher,
          published_at: article.published_at ?? null,
          tags: article.tags ?? [],
          category: article.category ?? null,
        })
        synced++
      } catch {
        errors++
      }
    }

    // Count remaining (total news - total documents with source=news)
    const { count: totalNews } = await supabase
      .from('news_articles')
      .select('id', { count: 'exact', head: true })

    const { count: totalDocs } = await supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('source', 'news')

    const remaining = (totalNews ?? 0) - (totalDocs ?? 0)

    return NextResponse.json({
      success: true,
      synced,
      skipped,
      errors,
      total_news: totalNews ?? 0,
      total_docs: totalDocs ?? 0,
      remaining,
    })
  } catch (error) {
    console.error('Backfill news-to-docs error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
