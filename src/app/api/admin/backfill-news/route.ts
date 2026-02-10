import { NextResponse } from 'next/server'
import { crawlGoogleNews } from '@/lib/news/crawler'
import { deduplicateNews } from '@/lib/news/deduplicator'
import { tagNewsBatch } from '@/lib/news/tagger'
import { ALL_KEYWORDS } from '@/data/news/keywords'
import type { NewsItem } from '@/types/news'

export const maxDuration = 55

// Priority keywords for backfill (subset to stay within timeout)
const BACKFILL_QUERIES_EN = [
  'UAE sovereign wealth fund',
  'Abu Dhabi investment ADIA Mubadala',
  'G42 AI UAE technology',
  'ADNOC energy Abu Dhabi',
  'Dubai real estate market',
  'Korea UAE partnership cooperation',
  'UAE economy GDP growth',
  'UAE crypto stablecoin regulation',
  'DIFC ADGM financial centre',
  'UAE infrastructure mega project',
  'Sheikh Mohammed bin Zayed',
  'Masdar renewable energy UAE',
  'Emirates airlines Abu Dhabi',
  'IHC conglomerate ADX',
] as const

const BACKFILL_QUERIES_KO = [
  '한국 UAE 협력',
  'UAE 투자 국부펀드',
  '아부다비 경제',
  '두바이 부동산',
  'UAE AI 데이터센터',
  '삼성 현대 UAE',
  '바라카 원전 한국',
  'UAE 스타트업 핀테크',
  'UAE 한국 기업 진출',
  'ADNOC 에너지',
] as const

function categorizeNews(item: NewsItem): string {
  const text = `${item.title} ${item.tags.join(' ')}`.toLowerCase()

  if (/korea|korean|한국|kepco|samsung|삼성|hanwha|한화|hyundai|현대|cepa|바라카|lg|posco|포스코|doosan|두산/i.test(text)) {
    return 'uae-korea'
  }
  if (/mubadala|adia|adq|ihc|mgx|sovereign wealth|investment|fund|acquisition/i.test(text)) {
    return 'investment'
  }
  if (/adnoc|masdar|energy|ai|g42|data center|real estate|construction|technology|fintech/i.test(text)) {
    return 'industry'
  }
  if (/정치|외교|diplomatic|political|government|mbz|sheikh|tahnoun/i.test(text)) {
    return 'politics'
  }
  if (/경제|금융|gdp|economy|finance|trade/i.test(text)) {
    return 'economy'
  }
  return 'general'
}

function getMonthRange(monthStr: string): { after: string; before: string } {
  const [year, month] = monthStr.split('-').map(Number)
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0) // last day of month

  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { after: fmt(start), before: fmt(end) }
}

function getAllMonths(startMonth: string, endMonth: string): string[] {
  const months: string[] = []
  const [startYear, startM] = startMonth.split('-').map(Number)
  const [endYear, endM] = endMonth.split('-').map(Number)

  let y = startYear
  let m = startM
  while (y < endYear || (y === endYear && m <= endM)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`)
    m++
    if (m > 12) { m = 1; y++ }
  }
  return months
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET ?? process.env.ADMIN_PASSWORD
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as {
      month?: string    // e.g. "2024-01" — process single month
      listMonths?: boolean  // return all months to process
    }

    // List mode: return all months that need processing
    if (body.listMonths) {
      const now = new Date()
      const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), 1)
      const startMonth = `${twoYearsAgo.getFullYear()}-${String(twoYearsAgo.getMonth() + 1).padStart(2, '0')}`
      const endMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const months = getAllMonths(startMonth, endMonth)

      return NextResponse.json({ success: true, months, total: months.length })
    }

    // Process single month
    if (!body.month || !/^\d{4}-\d{2}$/.test(body.month)) {
      return NextResponse.json(
        { success: false, error: 'Required: month (YYYY-MM format)' },
        { status: 400 }
      )
    }

    const { after, before } = getMonthRange(body.month)

    // Crawl Google News with date range
    const dateQuerySuffix = ` after:${after} before:${before}`
    const enQueries = BACKFILL_QUERIES_EN.map(q => q + dateQuerySuffix)
    const koQueries = BACKFILL_QUERIES_KO.map(q => q + dateQuerySuffix)

    const [googleEnResults, googleKoResults] = await Promise.allSettled([
      crawlGoogleNews(enQueries, { locale: 'en' }),
      crawlGoogleNews(koQueries, { locale: 'ko' }),
    ])

    const allItems: NewsItem[] = []
    if (googleEnResults.status === 'fulfilled') allItems.push(...googleEnResults.value)
    if (googleKoResults.status === 'fulfilled') allItems.push(...googleKoResults.value)

    if (allItems.length === 0) {
      return NextResponse.json({
        success: true,
        month: body.month,
        crawled: 0,
        synced: 0,
        documents: 0,
        embeddings: 0,
        message: 'No articles found for this month',
      })
    }

    const deduplicated = deduplicateNews(allItems)
    const tagged = tagNewsBatch(deduplicated, ALL_KEYWORDS)

    // Check Supabase config
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured',
      }, { status: 500 })
    }

    const { getSupabaseAdmin } = await import('@/lib/supabase')
    const supabase = getSupabaseAdmin()

    // Transform to DB format
    const articles = tagged.map(item => ({
      title: item.title,
      summary: item.summary ?? null,
      url: item.url,
      publisher: item.publisher,
      source: item.source === 'naver' ? 'naver' : 'google',
      language: item.source === 'naver' ? 'ko' : 'en',
      image_url: item.imageUrl ?? null,
      category: categorizeNews(item),
      tags: item.tags,
      published_at: item.publishedAt,
    }))

    // Upsert to news_articles
    const { data: upsertedData, error: upsertError } = await supabase
      .from('news_articles')
      .upsert(articles, { onConflict: 'url', ignoreDuplicates: true })
      .select('id')

    if (upsertError) {
      console.error('news_articles upsert error:', upsertError.message)
    }

    // Sync to documents + embeddings
    const { upsertDocumentFromNews, processDocumentEmbeddings } = await import('@/lib/db')
    const { isEmbeddingConfigured } = await import('@/lib/embeddings')
    const shouldEmbed = isEmbeddingConfigured()

    let documentsUpserted = 0
    let embeddingsGenerated = 0

    for (const article of articles) {
      try {
        const documentId = await upsertDocumentFromNews({
          title: article.title,
          url: article.url,
          summary: article.summary,
          publisher: article.publisher,
          published_at: article.published_at ?? null,
          tags: [...article.tags],
          category: article.category,
        })
        documentsUpserted++

        if (shouldEmbed && documentId && article.summary) {
          try {
            const content = [article.title, article.summary].filter(Boolean).join('\n\n')
            await processDocumentEmbeddings(documentId, content, article.title)
            embeddingsGenerated++
          } catch {
            // embedding failure doesn't block sync
          }
        }
      } catch {
        // continue on individual failures
      }
    }

    return NextResponse.json({
      success: true,
      month: body.month,
      crawled: allItems.length,
      deduplicated: deduplicated.length,
      synced: upsertedData?.length ?? 0,
      documents: documentsUpserted,
      embeddings: embeddingsGenerated,
    })
  } catch (error) {
    console.error('Backfill error:', error)
    return NextResponse.json(
      { success: false, error: 'Backfill failed' },
      { status: 500 }
    )
  }
}
