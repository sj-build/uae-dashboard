import { NextResponse } from 'next/server'
import { crawlGoogleNews, crawlNaverNews, enrichWithImages } from '@/lib/news/crawler'
import { deduplicateNews } from '@/lib/news/deduplicator'
import { tagNewsBatch } from '@/lib/news/tagger'
import { filterNoise } from '@/lib/news/noise-filter'
import { NEWS_KEYWORD_PACK } from '@/config/news-keyword-pack'
import { ALL_KEYWORDS } from '@/data/news/keywords'
import type { NewsItem } from '@/types/news'

export const maxDuration = 55

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

// Categorize news based on content and lane
function categorizeNews(item: NewsItem): string {
  const text = `${item.title} ${item.tags.join(' ')}`.toLowerCase()

  // Korea-related first (highest priority)
  if (/korea|korean|한국|kepco|k-beauty|k-pop|k뷰티|k팝|hallyu|한류|cepa|barakah|바라카|삼성엔지니어링|한화|현대건설/i.test(text)) {
    return 'uae-korea'
  }

  // UAE local lane gets uae-local category
  if (item.lane === 'uae_local') {
    return 'uae-local'
  }

  // Investment & SWF
  if (/mubadala|adia|adq|ihc|mgx|lunate|sovereign wealth|private equity|venture|fund|acquisition|stake|portfolio|investment/i.test(text)) {
    return 'investment'
  }

  // Industry specific
  if (/adnoc|masdar|nuclear|oil|gas|renewable|energy|ai|g42|data center|stargate|technology|real estate|construction|infrastructure|tourism|aviation|emirates|etihad|logistics|dp world|fintech|healthcare/i.test(text)) {
    return 'industry'
  }

  // Politics
  if (/diplomatic|political|royal|government|mbz|sheikh|tahnoun|cabinet/i.test(text)) {
    return 'politics'
  }

  // Economy
  if (/gdp|economy|finance|trade|inflation|currency|central bank/i.test(text)) {
    return 'economy'
  }

  return 'general'
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Verify authorization (simple check for now)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET ?? process.env.ADMIN_PASSWORD

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check Supabase configuration
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        message: 'Supabase not configured, skipping sync',
        synced: 0,
      })
    }

    // Import Supabase only if configured
    const { getSupabaseAdmin } = await import('@/lib/supabase')
    const supabase = getSupabaseAdmin()

    // Crawl news from keyword pack with lane-based caps
    const uaeLocalQueriesEn = NEWS_KEYWORD_PACK.google_news_rss_en.uae_local.always_on
    const dealQueriesEn = NEWS_KEYWORD_PACK.google_news_rss_en.deal.always_on
    const koreaUaeQueriesEn = NEWS_KEYWORD_PACK.google_news_rss_en.korea_uae.always_on
    const macroQueriesEn = NEWS_KEYWORD_PACK.google_news_rss_en.macro.always_on
    const dealQueriesKo = NEWS_KEYWORD_PACK.naver_search_ko.deal.always_on
    const koreaUaeQueriesKo = NEWS_KEYWORD_PACK.naver_search_ko.korea_uae.always_on
    const macroQueriesKo = NEWS_KEYWORD_PACK.naver_search_ko.macro.always_on

    const [
      googleUaeLocalResults,
      googleDealResults,
      googleKoreaUaeResults,
      googleMacroResults,
      naverDealResults,
      naverKoreaUaeResults,
      naverMacroResults,
    ] = await Promise.allSettled([
      crawlGoogleNews(uaeLocalQueriesEn, { lane: 'uae_local', resultCap: 3 }),
      crawlGoogleNews(dealQueriesEn, { lane: 'deal', resultCap: 3 }),
      crawlGoogleNews(koreaUaeQueriesEn, { lane: 'korea_uae', resultCap: 3 }),
      crawlGoogleNews(macroQueriesEn, { lane: 'macro', resultCap: 3 }),
      crawlNaverNews(dealQueriesKo, { lane: 'deal', resultCap: 3 }),
      crawlNaverNews(koreaUaeQueriesKo, { lane: 'korea_uae', resultCap: 3 }),
      crawlNaverNews(macroQueriesKo, { lane: 'macro', resultCap: 3 }),
    ])

    const allItems: NewsItem[] = []

    const settledResults = [
      googleUaeLocalResults,
      googleDealResults,
      googleKoreaUaeResults,
      googleMacroResults,
      naverDealResults,
      naverKoreaUaeResults,
      naverMacroResults,
    ]

    for (const result of settledResults) {
      if (result.status === 'fulfilled') {
        allItems.push(...result.value)
      }
    }

    // Apply noise filter before dedup
    const cleaned = filterNoise(allItems)
    const deduplicated = deduplicateNews(cleaned)

    // Fetch OG images for articles (limit to top 50 for performance)
    const topArticles = deduplicated.slice(0, 50)
    const enrichedTop = await enrichWithImages([...topArticles])
    const enrichedAll = [...enrichedTop, ...deduplicated.slice(50)]

    const tagged = tagNewsBatch(enrichedAll, ALL_KEYWORDS)

    // Transform to Supabase format
    const articles = tagged.map((item) => ({
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

    // Upsert to Supabase (ignore duplicates based on URL)
    const { data, error } = await supabase
      .from('news_articles')
      .upsert(articles, {
        onConflict: 'url',
        ignoreDuplicates: true,
      })
      .select('id')

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Also upsert to documents table for unified knowledge layer
    const { upsertDocumentFromNews, processDocumentEmbeddings } = await import('@/lib/db')
    const { isEmbeddingConfigured } = await import('@/lib/embeddings')
    let documentsUpserted = 0
    let embeddingsGenerated = 0

    const shouldGenerateEmbeddings = isEmbeddingConfigured()

    for (const article of articles) {
      try {
        const documentId = await upsertDocumentFromNews({
          title: article.title,
          url: article.url,
          summary: article.summary ?? null,
          publisher: article.publisher,
          published_at: article.published_at ?? null,
          tags: [...article.tags],
          category: article.category ?? null,
        })
        documentsUpserted++

        // Generate embeddings if configured and document was created
        if (shouldGenerateEmbeddings && documentId && article.summary) {
          try {
            const content = [article.title, article.summary].filter(Boolean).join('\n\n')
            await processDocumentEmbeddings(documentId, content, article.title)
            embeddingsGenerated++
          } catch (embError) {
            console.warn('Embedding generation failed for:', article.url, embError)
            // Continue - embedding failure shouldn't block sync
          }
        }
      } catch (e) {
        // Continue on individual failures
        console.warn('Document upsert failed for:', article.url, e)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${data?.length ?? 0} news articles to UAE Memory (${documentsUpserted} documents, ${embeddingsGenerated} embeddings)`,
      synced: data?.length ?? 0,
      documents_synced: documentsUpserted,
      embeddings_generated: embeddingsGenerated,
      total_crawled: allItems.length,
    })
  } catch (error) {
    console.error('Sync error:', error)
    const errorMessage = error instanceof Error
      ? error.message
      : 'Unknown error during sync'

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

// GET for manual trigger (with password)
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url)
  const password = url.searchParams.get('password')

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Forward to POST handler
  const newRequest = new Request(request.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ADMIN_PASSWORD}`,
    },
  })

  return POST(newRequest)
}
