/**
 * Naver Search API client
 *
 * Key design: Naver returns title + description (summary), NOT full article text.
 * We save what we get immediately. Fulltext extraction is a separate, optional step.
 */

import { sha256 } from './hash'

const NAVER_NEWS_API = 'https://openapi.naver.com/v1/search/news.json'
const REQUEST_TIMEOUT_MS = 10_000
const INTER_QUERY_DELAY_MS = 300

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NaverRawItem {
  readonly title: string
  readonly originallink: string
  readonly link: string
  readonly description: string
  readonly pubDate: string
}

export interface NaverNewsItem {
  readonly provider: 'naver'
  readonly url: string
  readonly title: string
  readonly summary: string
  readonly published_at: string | null
  readonly publisher: string | null
  readonly content_hash: string
  readonly meta: {
    readonly naver_link: string
    readonly original_link: string
  }
}

export interface NaverSearchResult {
  readonly items: readonly NaverNewsItem[]
  readonly queryErrors: readonly { query: string; error: string }[]
}

// ---------------------------------------------------------------------------
// HTML stripping
// ---------------------------------------------------------------------------

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .trim()
}

// ---------------------------------------------------------------------------
// Date parsing
// ---------------------------------------------------------------------------

function parseNaverDate(dateStr: string): string | null {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return null
    return d.toISOString()
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Content hash (for dedup)
// ---------------------------------------------------------------------------

function buildContentHash(item: { url: string; title: string; published_at: string | null }): string {
  const raw = ['naver', item.url, item.published_at ?? '', item.title].join('|')
  return sha256(raw)
}

// ---------------------------------------------------------------------------
// Publisher extraction from URL
// ---------------------------------------------------------------------------

function extractPublisher(url: string): string | null {
  try {
    const hostname = new URL(url).hostname
    // Common Korean news sites
    const publishers: Record<string, string> = {
      'www.hankyung.com': '한국경제',
      'www.mk.co.kr': '매일경제',
      'www.chosun.com': '조선일보',
      'www.donga.com': '동아일보',
      'www.joongang.co.kr': '중앙일보',
      'www.hani.co.kr': '한겨레',
      'www.khan.co.kr': '경향신문',
      'www.sedaily.com': '서울경제',
      'www.edaily.co.kr': '이데일리',
      'www.newsis.com': '뉴시스',
      'www.yna.co.kr': '연합뉴스',
      'news.mt.co.kr': '머니투데이',
      'biz.chosun.com': '조선비즈',
      'www.etnews.com': '전자신문',
      'www.zdnet.co.kr': 'ZDNet Korea',
    }
    return publishers[hostname] ?? hostname.replace('www.', '')
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Core fetch function (single query)
// ---------------------------------------------------------------------------

async function fetchNaverQuery(
  query: string,
  clientId: string,
  clientSecret: string,
  display = 10,
  sort: 'date' | 'sim' = 'date',
): Promise<readonly NaverRawItem[]> {
  const params = new URLSearchParams({
    query,
    display: String(display),
    sort,
  })

  const response = await fetch(`${NAVER_NEWS_API}?${params}`, {
    headers: {
      'X-Naver-Client-Id': clientId,
      'X-Naver-Client-Secret': clientSecret,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`Naver API ${response.status}: ${response.statusText}`)
  }

  const data: { items?: NaverRawItem[] } = await response.json()
  return data.items ?? []
}

// ---------------------------------------------------------------------------
// Public: search multiple queries and return cleaned items
// ---------------------------------------------------------------------------

export async function searchNaverNews(
  queries: readonly string[],
  options?: {
    display?: number
    sort?: 'date' | 'sim'
  },
): Promise<NaverSearchResult> {
  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('NAVER_CLIENT_ID or NAVER_CLIENT_SECRET not configured')
  }

  const { display = 10, sort = 'date' } = options ?? {}
  const allItems: NaverNewsItem[] = []
  const queryErrors: Array<{ query: string; error: string }> = []
  const seenHashes = new Set<string>()

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i]
    try {
      const rawItems = await fetchNaverQuery(query, clientId, clientSecret, display, sort)

      for (const raw of rawItems) {
        const title = stripHtml(raw.title)
        const summary = stripHtml(raw.description)
        const url = raw.originallink || raw.link
        const published_at = parseNaverDate(raw.pubDate)

        const content_hash = buildContentHash({ url, title, published_at })

        // Dedup within this batch
        if (seenHashes.has(content_hash)) continue
        seenHashes.add(content_hash)

        allItems.push({
          provider: 'naver',
          url,
          title,
          summary,
          published_at,
          publisher: extractPublisher(url),
          content_hash,
          meta: {
            naver_link: raw.link,
            original_link: raw.originallink,
          },
        })
      }
    } catch (err) {
      queryErrors.push({
        query,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }

    // Rate limiting between queries
    if (i < queries.length - 1) {
      await new Promise(resolve => setTimeout(resolve, INTER_QUERY_DELAY_MS))
    }
  }

  return { items: allItems, queryErrors }
}
