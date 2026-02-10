'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { useLocale } from '@/hooks/useLocale'
import type { NewsItem } from '@/types/news'
import type { Translations } from '@/i18n/types'

interface NewsApiResponse {
  readonly success: boolean
  readonly data?: readonly NewsItem[]
  readonly error?: string
}

interface NewsCategory {
  readonly id: string
  readonly icon: string
  readonly labelKo: string
  readonly labelEn: string
  readonly keywords: readonly string[]
  readonly majorMediaOnly?: boolean
  readonly isOthers?: boolean
}

// News categories - UAE-Korea, Major Headlines, Investment, Industry, Others
const NEWS_CATEGORIES: readonly NewsCategory[] = [
  {
    id: 'uae-korea',
    icon: '🇰🇷',
    labelKo: 'UAE-Korea 협력',
    labelEn: 'UAE-Korea',
    keywords: ['Korea', 'Korean', '한국', 'KEPCO', 'Samsung', '삼성', 'SK', 'Hanwha', '한화', 'Hyundai', '현대', 'K-beauty', 'K-pop', 'Hallyu', '한류', 'CEPA', 'FAB Seoul', 'Barakah', '바라카', 'LG', 'Posco', '포스코', 'Doosan', '두산'],
  },
  {
    id: 'major-headlines',
    icon: '📰',
    labelKo: '미디어 헤드라인',
    labelEn: 'Media Headlines',
    keywords: [],
    majorMediaOnly: true,
  },
  {
    id: 'investment',
    icon: '💰',
    labelKo: '투자 & 국부펀드',
    labelEn: 'Investment & SWF',
    keywords: ['investment', 'Mubadala', 'ADIA', 'ADQ', 'IHC', 'MGX', 'Lunate', 'sovereign wealth', 'private equity', 'venture', 'fund', 'acquisition', 'stake', 'portfolio', 'asset'],
  },
  {
    id: 'industry',
    icon: '🏭',
    labelKo: '주요 산업',
    labelEn: 'Major Industries',
    keywords: ['ADNOC', 'Masdar', 'nuclear', 'oil', 'gas', 'renewable', 'energy', 'AI', 'G42', 'data center', 'Stargate', 'technology', 'real estate', 'construction', 'infrastructure', 'tourism', 'aviation', 'Emirates', 'Etihad', 'logistics', 'port', 'DP World', 'fintech', 'healthcare', 'pharma'],
  },
  {
    id: 'others',
    icon: '📋',
    labelKo: '그 외',
    labelEn: 'Others',
    keywords: [],
    isOthers: true,
  },
] as const

// Major media sources
const MAJOR_MEDIA = ['Reuters', 'Bloomberg', 'Financial Times', 'FT', 'WSJ', 'Wall Street Journal', 'BBC', 'CNN', 'The Economist', 'AP', 'AFP']

const PUBLISHER_COLORS: Record<string, string> = {
  Reuters: 'bg-accent-orange/15 text-accent-orange border-accent-orange/20',
  Bloomberg: 'bg-accent-purple/15 text-accent-purple border-accent-purple/20',
  'Financial Times': 'bg-accent-pink/15 text-accent-pink border-accent-pink/20',
  'Gulf News': 'bg-accent-green/15 text-accent-green border-accent-green/20',
  'The National': 'bg-accent-blue/15 text-accent-blue border-accent-blue/20',
  'Naver News': 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/20',
  'Korea Herald': 'bg-gold/15 text-gold border-gold/20',
  'Yonhap': 'bg-gold/15 text-gold border-gold/20',
}

const DEFAULT_BADGE_STYLE = 'bg-t4/15 text-t3 border-t4/20'

// Tags to hide from display
const HIDDEN_TAG_PREFIXES = ['lane:'] as const
const HIDDEN_TAG_EXACT = ['deal', 'macro'] as const

// Tags that deserve visual emphasis (deal-signal keywords)
const HIGHLIGHT_TAG_PATTERNS = [
  'K뷰티', 'K-beauty', 'K팝', 'K-pop', 'K-food', 'K-푸드',
  'AI', 'G42', 'Mubadala', 'ADIA', 'ADQ', 'Hub71', 'ADGM',
  '스타트업', 'startup', 'MOU', 'JV', '합작', '런칭', 'launch',
  '투자', 'investment', '협력', 'partnership',
] as const

function shouldShowTag(tag: string): boolean {
  if (HIDDEN_TAG_PREFIXES.some((p) => tag.startsWith(p))) return false
  if (HIDDEN_TAG_EXACT.some((h) => tag.toLowerCase() === h)) return false
  return true
}

function isHighlightTag(tag: string): boolean {
  const lower = tag.toLowerCase()
  return HIGHLIGHT_TAG_PATTERNS.some((p) => lower.includes(p.toLowerCase()))
}

function getPublisherBadgeStyle(publisher: string): string {
  return PUBLISHER_COLORS[publisher] ?? DEFAULT_BADGE_STYLE
}

function isMajorMedia(publisher: string): boolean {
  return MAJOR_MEDIA.some(media => publisher.toLowerCase().includes(media.toLowerCase()))
}

function formatRelativeDate(
  dateString: string,
  p: Translations['pages']['home'],
  locale: 'ko' | 'en'
): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return p.timeJustNow
    if (diffHours < 24) return `${diffHours} ${p.timeHoursAgo}`
    if (diffDays < 7) return `${diffDays} ${p.timeDaysAgo}`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} ${p.timeWeeksAgo}`

    return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

function NewsItemSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 bg-bg3 rounded-lg border border-brd animate-pulse">
      <div className="w-16 h-5 bg-bg4 rounded shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-5 bg-bg4 rounded w-full" />
        <div className="h-4 bg-bg4 rounded w-3/4" />
        <div className="h-3 bg-bg4 rounded w-1/4" />
      </div>
    </div>
  )
}

function NewsListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <NewsItemSkeleton key={i} />
      ))}
    </div>
  )
}

interface NewsCardProps {
  readonly item: NewsItem
  readonly p: Translations['pages']['home']
  readonly locale: 'ko' | 'en'
  readonly highlight?: boolean
}

function NewsCard({ item, p, locale, highlight }: NewsCardProps) {
  const isMajor = isMajorMedia(item.publisher)

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex flex-col p-4 rounded-lg border transition-all duration-200 hover:border-gold/30 group h-full ${
        highlight
          ? 'bg-gold/5 border-gold/20 hover:bg-gold/10'
          : 'bg-bg3 border-brd hover:bg-bg4/50'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {item.source === 'naver' && (
          <span className="px-1 py-px rounded text-[8px] font-medium text-t4/60 bg-bg2 border border-brd/50">
            KR
          </span>
        )}
        <span
          className={`px-2 py-0.5 rounded font-semibold border ${getPublisherBadgeStyle(item.publisher)} ${isMajor ? 'ring-1 ring-gold/30' : ''} ${
            item.publisher === 'Naver News' ? 'text-[9px] text-t4/70' : 'text-[10px]'
          }`}
        >
          {item.publisher}
        </span>
        <span className="text-[11px] text-t4 ml-auto">
          {formatRelativeDate(item.publishedAt, p, locale)}
        </span>
      </div>

      <h3 className={`text-[13px] font-semibold leading-snug group-hover:text-gold transition-colors duration-150 line-clamp-3 mb-2 ${highlight ? 'text-gold' : 'text-t1'}`}>
        {item.title}
      </h3>

      {item.summary && (
        <p className="text-[11px] text-t3 leading-relaxed line-clamp-2 mb-2">
          {item.summary}
        </p>
      )}

      <div className="flex items-center gap-1 flex-wrap mt-auto pt-2">
        {item.tags.filter(shouldShowTag).slice(0, 2).map((tag) => (
          <span
            key={tag}
            className={`px-1.5 py-0.5 rounded text-[9px] border ${
              isHighlightTag(tag)
                ? 'bg-gold/10 text-gold border-gold/25 font-semibold'
                : 'text-t4 bg-bg2 border-brd'
            }`}
          >
            {tag}
          </span>
        ))}
      </div>
    </a>
  )
}

interface ErrorDisplayProps {
  readonly message: string
  readonly onRetry: () => void
  readonly retryLabel: string
}

function ErrorDisplay({ message, onRetry, retryLabel }: ErrorDisplayProps) {
  return (
    <div className="text-center py-12">
      <div className="text-[14px] text-accent-red mb-3">{message}</div>
      <button
        onClick={onRetry}
        className="text-[13px] text-t3 hover:text-gold transition-colors duration-150 underline"
      >
        {retryLabel}
      </button>
    </div>
  )
}

export default function NewsPage() {
  const { t, locale } = useLocale()
  const homeT = t.pages.home
  const newsT = t.pages.news
  const [activeCategory, setActiveCategory] = useState('uae-korea') // Default to UAE-Korea
  const [newsItems, setNewsItems] = useState<readonly NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNews = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/news')

      if (!response.ok) {
        throw new Error(`${homeT.newsLoadError} (${response.status})`)
      }

      const data: NewsApiResponse = await response.json()

      if (!data.success || !data.data) {
        throw new Error(data.error ?? homeT.newsDataError)
      }

      setNewsItems(data.data)
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : homeT.newsUnknownError
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [homeT.newsLoadError, homeT.newsDataError, homeT.newsUnknownError])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  // Helper to check if item matches a category's keywords
  const matchesCategory = useCallback((item: NewsItem, cat: NewsCategory): boolean => {
    if (cat.majorMediaOnly) return isMajorMedia(item.publisher)
    if (cat.keywords.length === 0) return false

    const titleLower = item.title.toLowerCase()
    const tagsLower = item.tags.map((t) => t.toLowerCase())
    const summaryLower = (item.summary ?? '').toLowerCase()

    return cat.keywords.some((keyword) => {
      const keywordLower = keyword.toLowerCase()
      return (
        titleLower.includes(keywordLower) ||
        summaryLower.includes(keywordLower) ||
        tagsLower.some((tag) => tag.includes(keywordLower))
      )
    })
  }, [])

  const filteredNews = useMemo(() => {
    const category = NEWS_CATEGORIES.find((c) => c.id === activeCategory)
    if (!category) return newsItems

    // Major media filter
    if (category.majorMediaOnly) {
      return newsItems.filter((item) => isMajorMedia(item.publisher))
    }

    // Others category - news that don't match any other category
    if (category.isOthers) {
      const otherCategories = NEWS_CATEGORIES.filter(c => !c.isOthers && c.keywords.length > 0)
      return newsItems.filter((item) => {
        // Exclude major media (they have their own category)
        if (isMajorMedia(item.publisher)) return false
        // Exclude items that match any other category
        return !otherCategories.some(cat => matchesCategory(item, cat))
      })
    }

    // Keyword filter
    if (category.keywords.length === 0) return newsItems

    return newsItems.filter((item) => matchesCategory(item, category))
  }, [newsItems, activeCategory, matchesCategory])

  const isUaeKorea = activeCategory === 'uae-korea'

  return (
    <>
      <SectionTitle
        title={locale === 'en' ? 'UAE News & UAE-Korea Relations' : 'UAE 뉴스 & 한국-UAE 협력'}
        subtitle={locale === 'en'
          ? 'Focus on UAE-Korea cooperation news and major international media headlines'
          : 'UAE-Korea 협력 뉴스와 주요 글로벌 미디어 헤드라인 중심'
        }
      />

      {/* Category Tab Navigation */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-2">
          {NEWS_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold
                transition-all duration-200 whitespace-nowrap
                ${activeCategory === category.id
                  ? 'bg-gold/15 text-gold border border-gold/30'
                  : 'bg-bg3 text-t3 border border-brd hover:text-t1 hover:border-brd2'
                }
              `}
            >
              <span>{category.icon}</span>
              <span>{locale === 'en' ? category.labelEn : category.labelKo}</span>
            </button>
          ))}
        </div>
      </div>

      {/* News Count */}
      {!isLoading && !error && (
        <div className="mb-4 text-[12px] text-t3">
          {filteredNews.length} {newsT.articles}
          <span className="ml-2 text-t4">
            ({newsT.filteredFrom} {newsItems.length} {newsT.total})
          </span>
        </div>
      )}

      {/* Content */}
      <div className="animate-fade-in">
        {isLoading && <NewsListSkeleton />}

        {error && (
          <ErrorDisplay message={error} onRetry={fetchNews} retryLabel={homeT.newsRetry} />
        )}

        {!isLoading && !error && filteredNews.length === 0 && (
          <div className="text-center py-12 text-[14px] text-t3">
            {newsT.noNews}
          </div>
        )}

        {!isLoading && !error && filteredNews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredNews.slice(0, 8).map((item) => (
              <NewsCard
                key={item.id}
                item={item}
                p={homeT}
                locale={locale}
                highlight={isUaeKorea}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
