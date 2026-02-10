import { NextResponse } from 'next/server'
import { z } from 'zod'
import { crawlGoogleNews, crawlNaverNews, enrichWithImages } from '@/lib/news/crawler'
import { deduplicateNews } from '@/lib/news/deduplicator'
import { tagNewsBatch } from '@/lib/news/tagger'
import { filterNoise } from '@/lib/news/noise-filter'
import { NEWS_KEYWORD_PACK } from '@/config/news-keyword-pack'
import { ALL_KEYWORDS } from '@/data/news/keywords'
import type { NewsItem } from '@/types/news'

const TWO_MONTHS_MS = 60 * 24 * 60 * 60 * 1000

function filterByDate(items: readonly NewsItem[]): readonly NewsItem[] {
  const cutoff = Date.now() - TWO_MONTHS_MS
  return items.filter((item) => {
    const publishedTime = new Date(item.publishedAt).getTime()
    return !isNaN(publishedTime) && publishedTime >= cutoff
  })
}

const NewsItemCreateSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  publisher: z.string().min(1),
  publishedAt: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  summary: z.string().optional(),
})

export const maxDuration = 55
export const revalidate = 3600

export async function GET(): Promise<NextResponse> {
  try {
    // Build lane-based query sets from keyword pack
    const dealQueriesEn = NEWS_KEYWORD_PACK.google_news_rss_en.deal.always_on
    const macroQueriesEn = NEWS_KEYWORD_PACK.google_news_rss_en.macro.always_on
    const dealQueriesKo = NEWS_KEYWORD_PACK.naver_search_ko.deal.always_on
    const macroQueriesKo = NEWS_KEYWORD_PACK.naver_search_ko.macro.always_on

    const [
      googleDealResults,
      googleMacroResults,
      naverDealResults,
      naverMacroResults,
    ] = await Promise.allSettled([
      crawlGoogleNews(dealQueriesEn, { lane: 'deal', resultCap: 5 }),
      crawlGoogleNews(macroQueriesEn, { lane: 'macro', resultCap: 3 }),
      crawlNaverNews(dealQueriesKo, { lane: 'deal', resultCap: 5 }),
      crawlNaverNews(macroQueriesKo, { lane: 'macro', resultCap: 3 }),
    ])

    const allItems: NewsItem[] = []

    if (googleDealResults.status === 'fulfilled') {
      allItems.push(...googleDealResults.value)
    }
    if (googleMacroResults.status === 'fulfilled') {
      allItems.push(...googleMacroResults.value)
    }
    if (naverDealResults.status === 'fulfilled') {
      allItems.push(...naverDealResults.value)
    }
    if (naverMacroResults.status === 'fulfilled') {
      allItems.push(...naverMacroResults.value)
    }

    // Apply noise filter before dedup
    const cleaned = filterNoise(allItems)
    const deduplicated = deduplicateNews(cleaned)
    const tagged = tagNewsBatch(deduplicated, ALL_KEYWORDS)
    const filtered = filterByDate(tagged)

    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime()
      const dateB = new Date(b.publishedAt).getTime()
      return dateB - dateA
    })

    // Enrich top 20 items with OG images
    // Items with RSS media:content images are skipped quickly
    const topItems = sorted.slice(0, 20)
    const remainingItems = sorted.slice(20, 30)
    const enrichedTop = await enrichWithImages([...topItems])
    const finalData = [...enrichedTop, ...remainingItems]

    return NextResponse.json({
      success: true,
      data: finalData,
      meta: {
        total: sorted.length,
        page: 1,
        limit: 30,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : '뉴스를 불러오는 중 오류가 발생했습니다.'

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json()

    const parseResult = NewsItemCreateSchema.safeParse(body)
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0]
      const errorMessage = firstIssue
        ? firstIssue.message
        : '유효하지 않은 입력입니다.'

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      )
    }

    const validated = parseResult.data

    const newItem: NewsItem = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title: validated.title,
      url: validated.url,
      source: 'manual',
      publisher: validated.publisher,
      publishedAt: validated.publishedAt ?? new Date().toISOString(),
      tags: validated.tags ?? [],
      summary: validated.summary,
      priority: 'other',
    }

    return NextResponse.json({
      success: true,
      data: newItem,
    })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: '잘못된 JSON 형식입니다.' },
        { status: 400 }
      )
    }

    const errorMessage = error instanceof Error
      ? error.message
      : '뉴스 추가 중 오류가 발생했습니다.'

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
