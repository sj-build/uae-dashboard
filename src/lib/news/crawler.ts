import type { NewsItem, NewsLane } from '@/types/news'

const GOOGLE_NEWS_RSS_BASE = 'https://news.google.com/rss/search'
const NAVER_NEWS_API_BASE = 'https://openapi.naver.com/v1/search/news.json'

function generateId(): string {
  return `news-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function parseRssDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return new Date().toISOString()
    }
    return date.toISOString()
  } catch {
    return new Date().toISOString()
  }
}

function extractPublisher(source: string): string {
  const cleaned = source.replace(/<[^>]*>/g, '').trim()
  return cleaned || 'Unknown'
}

function classifyPriority(publisher: string): NewsItem['priority'] {
  const lowered = publisher.toLowerCase()
  if (lowered.includes('reuters')) return 'reuters'
  if (lowered.includes('bloomberg')) return 'bloomberg'
  if (lowered.includes('financial times') || lowered.includes('ft.com')) return 'financial_times'
  if (lowered.includes('wall street journal') || lowered.includes('wsj')) return 'wsj'
  if (lowered.includes('the national')) return 'the_national'
  if (lowered.includes('khaleej times')) return 'khaleej_times'
  if (lowered.includes('arab news')) return 'arab_news'
  if (lowered.includes('gulf news')) return 'gulf_news'
  if (lowered.includes('wam') || lowered.includes('emirates news agency')) return 'wam'
  return 'other'
}

function extractTextBetweenTags(xml: string, tagName: string): string {
  const openTag = `<${tagName}>`
  const closeTag = `</${tagName}>`
  const startIndex = xml.indexOf(openTag)
  const endIndex = xml.indexOf(closeTag)

  if (startIndex === -1 || endIndex === -1) {
    return ''
  }

  const contentStart = startIndex + openTag.length
  const raw = xml.slice(contentStart, endIndex)

  return raw
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/<[^>]*>/g, '')
    .trim()
}

function extractMediaImage(itemXml: string): string | undefined {
  // Try <media:content> tag (Google News RSS standard)
  const mediaPatterns = [
    /<media:content[^>]+url=["']([^"']+)["']/i,
    /<media:thumbnail[^>]+url=["']([^"']+)["']/i,
    /<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image/i,
  ]

  for (const pattern of mediaPatterns) {
    const match = itemXml.match(pattern)
    if (match?.[1]) {
      let url = match[1]
      if (url.startsWith('//')) {
        url = 'https:' + url
      }
      if (url.startsWith('http')) {
        return url
      }
    }
  }

  return undefined
}

function parseRssItems(xmlText: string): ReadonlyArray<{
  readonly title: string
  readonly link: string
  readonly pubDate: string
  readonly source: string
  readonly imageUrl?: string
}> {
  const items: Array<{
    readonly title: string
    readonly link: string
    readonly pubDate: string
    readonly source: string
    readonly imageUrl?: string
  }> = []

  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match = itemRegex.exec(xmlText)

  while (match !== null) {
    const itemXml = match[1]
    const title = extractTextBetweenTags(itemXml, 'title')
    const link = extractTextBetweenTags(itemXml, 'link')
    const pubDate = extractTextBetweenTags(itemXml, 'pubDate')
    const imageUrl = extractMediaImage(itemXml)

    const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/)
    const source = sourceMatch
      ? sourceMatch[1].replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim()
      : ''

    items.push({ title, link, pubDate, source, imageUrl })
    match = itemRegex.exec(xmlText)
  }

  return items
}

/**
 * Decode Google News article URL
 * Google News uses base64-encoded URLs in the format: /rss/articles/CBMi...
 */
function decodeGoogleNewsUrl(url: string): string | null {
  try {
    // Extract the encoded part from the URL
    const match = url.match(/\/articles\/([^?]+)/)
    if (!match) return null

    const encoded = match[1]

    // Google News uses a modified base64 with URL-safe characters
    // The format starts with CBMi (protobuf marker for string field 1)
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = Buffer.from(base64, 'base64').toString('utf-8')

    // The decoded string contains protobuf data
    // The actual URL typically starts after some control characters
    // Look for http:// or https:// in the decoded data
    const urlMatch = decoded.match(/https?:\/\/[^\x00-\x1F\x7F]+/)
    if (urlMatch) {
      // Clean up any trailing protobuf data
      let extractedUrl = urlMatch[0]
      // Remove any trailing non-URL characters
      const endMatch = extractedUrl.match(/^(https?:\/\/[^\s"<>]+)/)
      if (endMatch) {
        return endMatch[1]
      }
      return extractedUrl
    }

    return null
  } catch {
    return null
  }
}

/**
 * Resolve Google News redirect URL to actual article URL
 */
async function resolveGoogleNewsUrl(url: string): Promise<string> {
  if (!url.includes('news.google.com')) {
    return url
  }

  // First try to decode the URL directly (fastest method)
  const decodedUrl = decodeGoogleNewsUrl(url)
  if (decodedUrl && decodedUrl.startsWith('http')) {
    return decodedUrl
  }

  // Fallback: Try HTTP redirect (some URLs might work)
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(5000),
    })

    // Check if we got redirected to the actual article
    if (response.url && !response.url.includes('news.google.com')) {
      return response.url
    }

    // Try to find the URL in the HTML response
    const html = await response.text()

    // Google News pages sometimes have the URL in data attributes or meta tags
    const patterns = [
      /data-n-au="([^"]+)"/,
      /data-url="([^"]+)"/,
      /<a[^>]+href="(https?:\/\/(?!news\.google)[^"]+)"[^>]*data-n-au/,
      /window\.location\.replace\(['"]([^'"]+)['"]\)/,
      /<meta[^>]+property="og:url"[^>]+content="([^"]+)"/,
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match?.[1] && !match[1].includes('news.google.com')) {
        return match[1]
      }
    }

    return url
  } catch {
    return url
  }
}

/**
 * Fetch OG image from a news article URL
 */
async function fetchOgImage(url: string): Promise<string | undefined> {
  try {
    // URL should already be resolved by caller; skip re-resolution
    const resolvedUrl = url.includes('news.google.com')
      ? await resolveGoogleNewsUrl(url)
      : url

    const response = await fetch(resolvedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    })

    if (!response.ok) {
      return undefined
    }

    const html = await response.text()

    // Extract og:image meta tag
    // Patterns: <meta property="og:image" content="..."> or <meta name="og:image" content="...">
    const ogImagePatterns = [
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
      /<meta[^>]*name=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']og:image["']/i,
      // Twitter card image as fallback
      /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i,
    ]

    for (const pattern of ogImagePatterns) {
      const match = html.match(pattern)
      if (match?.[1]) {
        let imageUrl = match[1]

        // Handle relative URLs
        if (imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl
        } else if (imageUrl.startsWith('/')) {
          const urlObj = new URL(url)
          imageUrl = urlObj.origin + imageUrl
        }

        // Validate it's a proper URL
        if (imageUrl.startsWith('http')) {
          return imageUrl
        }
      }
    }

    return undefined
  } catch {
    return undefined
  }
}

/**
 * Add OG images to news items in parallel
 * Also resolves Google News URLs to actual article URLs
 */
export async function enrichWithImages(items: NewsItem[]): Promise<NewsItem[]> {
  // Process in smaller batches to avoid overwhelming servers
  const batchSize = 5
  const enrichedItems: NewsItem[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)

    const batchResults = await Promise.all(
      batch.map(async (item) => {
        // Skip if already has a valid image (including from RSS media:content)
        if (item.imageUrl && item.imageUrl.startsWith('http')) {
          return item
        }

        try {
          // Resolve the actual URL first
          const resolvedUrl = await resolveGoogleNewsUrl(item.url)
          const imageUrl = await fetchOgImage(resolvedUrl)

          return {
            ...item,
            url: resolvedUrl, // Update to actual article URL
            imageUrl: imageUrl || item.imageUrl,
          }
        } catch {
          return item
        }
      })
    )

    enrichedItems.push(...batchResults)

    // Small delay between batches
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  return enrichedItems
}

export async function crawlGoogleNews(
  keywords: readonly string[],
  options: {
    readonly locale?: 'en' | 'ko'
    readonly resultCap?: number
    readonly lane?: NewsLane
  } = {},
): Promise<readonly NewsItem[]> {
  const { locale = 'en', resultCap = 5, lane } = options
  const results: NewsItem[] = []

  // Determine locale settings
  const localeParams = locale === 'ko'
    ? { hl: 'ko', gl: 'KR', ceid: 'KR:ko' }
    : { hl: 'en', gl: 'AE', ceid: 'AE:en' }

  for (const keyword of keywords) {
    try {
      const encodedQuery = encodeURIComponent(keyword)
      const url = `${GOOGLE_NEWS_RSS_BASE}?q=${encodedQuery}&hl=${localeParams.hl}&gl=${localeParams.gl}&ceid=${localeParams.ceid}`

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; UAEDashboard/1.0)',
        },
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        continue
      }

      const xmlText = await response.text()
      const rssItems = parseRssItems(xmlText)

      const newsItems: readonly NewsItem[] = rssItems.slice(0, resultCap).map((item) => ({
        id: generateId(),
        title: item.title,
        url: item.link,
        source: 'google' as const,
        publisher: extractPublisher(item.source),
        publishedAt: parseRssDate(item.pubDate),
        tags: lane ? [keyword, `lane:${lane}`] : [keyword],
        priority: classifyPriority(item.source),
        ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
        ...(lane ? { lane } : {}),
      }))

      results.push(...newsItems)
    } catch {
      // Skip failed keyword crawls silently
    }
  }

  return results
}

export async function crawlNaverNews(
  keywords: readonly string[],
  options: {
    readonly resultCap?: number
    readonly lane?: NewsLane
  } = {},
): Promise<readonly NewsItem[]> {
  const { resultCap = 5, lane } = options
  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return []
  }

  const results: NewsItem[] = []

  for (const keyword of keywords) {
    try {
      const encodedQuery = encodeURIComponent(keyword)
      const url = `${NAVER_NEWS_API_BASE}?query=${encodedQuery}&display=${resultCap}&sort=date`

      const response = await fetch(url, {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        continue
      }

      const data: {
        items: ReadonlyArray<{
          readonly title: string
          readonly originallink: string
          readonly link: string
          readonly pubDate: string
          readonly description: string
        }>
      } = await response.json()

      const newsItems: readonly NewsItem[] = (data.items ?? []).map((item) => ({
        id: generateId(),
        title: item.title.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
        url: item.originallink || item.link,
        source: 'naver' as const,
        publisher: 'Naver News',
        publishedAt: parseRssDate(item.pubDate),
        tags: lane ? [keyword, `lane:${lane}`] : [keyword],
        summary: item.description.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
        priority: 'other' as const,
        ...(lane ? { lane } : {}),
      }))

      results.push(...newsItems)
    } catch {
      // Skip failed keyword crawls silently
    }
  }

  return results
}
