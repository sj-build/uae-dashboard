import { NextResponse } from 'next/server'
import { crawlGoogleNews, crawlNaverNews, enrichWithImages } from '@/lib/news/crawler'
import { deduplicateNews } from '@/lib/news/deduplicator'
import { tagNewsBatch } from '@/lib/news/tagger'
import { filterNoise } from '@/lib/news/noise-filter'
import { NEWS_KEYWORD_PACK } from '@/config/news-keyword-pack'
import { ALL_KEYWORDS } from '@/data/news/keywords'
import type { NewsItem } from '@/types/news'

export const maxDuration = 55

export async function POST(request: Request): Promise<NextResponse> {
  try {
    let useCustomQueries = false
    let customQueries: readonly string[] = []

    try {
      const body: unknown = await request.json()
      if (
        body !== null &&
        typeof body === 'object' &&
        'keywords' in body &&
        Array.isArray((body as { keywords: unknown }).keywords)
      ) {
        const provided = (body as { keywords: unknown[] }).keywords
        const validKeywords = provided.filter(
          (k): k is string => typeof k === 'string' && k.trim().length > 0
        )

        if (validKeywords.length > 0) {
          useCustomQueries = true
          customQueries = validKeywords
        }
      }
    } catch {
      // Use keyword pack if body parsing fails
    }

    let allItems: NewsItem[]

    if (useCustomQueries) {
      // Custom queries: no lane tagging
      const [googleResults, naverResults] = await Promise.allSettled([
        crawlGoogleNews(customQueries),
        crawlNaverNews(customQueries),
      ])

      allItems = []
      if (googleResults.status === 'fulfilled') {
        allItems.push(...googleResults.value)
      }
      if (naverResults.status === 'fulfilled') {
        allItems.push(...naverResults.value)
      }
    } else {
      // Default: use keyword pack with lane-based crawling
      const [
        googleDealResults,
        googleMacroResults,
        naverDealResults,
        naverMacroResults,
      ] = await Promise.allSettled([
        crawlGoogleNews(NEWS_KEYWORD_PACK.google_news_rss_en.deal.always_on, { lane: 'deal', resultCap: 5 }),
        crawlGoogleNews(NEWS_KEYWORD_PACK.google_news_rss_en.macro.always_on, { lane: 'macro', resultCap: 3 }),
        crawlNaverNews(NEWS_KEYWORD_PACK.naver_search_ko.deal.always_on, { lane: 'deal', resultCap: 5 }),
        crawlNaverNews(NEWS_KEYWORD_PACK.naver_search_ko.macro.always_on, { lane: 'macro', resultCap: 3 }),
      ])

      allItems = []
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
    }

    if (allItems.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: {
          total: 0,
          sources: { google: 0, naver: 0 },
        },
      })
    }

    // Apply noise filter before dedup
    const cleaned = filterNoise(allItems)
    const deduplicated = deduplicateNews(cleaned)
    const tagged = tagNewsBatch(deduplicated, ALL_KEYWORDS)

    // Enrich with OG images (only for first 20 items to limit fetch time)
    const toEnrich = tagged.slice(0, 20)
    const remaining = tagged.slice(20)
    const enriched = await enrichWithImages([...toEnrich])
    const finalData = [...enriched, ...remaining]

    const googleCount = finalData.filter((item) => item.source === 'google').length
    const naverCount = finalData.filter((item) => item.source === 'naver').length

    return NextResponse.json({
      success: true,
      data: finalData,
      meta: {
        total: tagged.length,
        sources: { google: googleCount, naver: naverCount },
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : '뉴스 크롤링 중 오류가 발생했습니다.'

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
