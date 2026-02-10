'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Collapsible } from '@/components/ui/Collapsible'
import { useLocale } from '@/hooks/useLocale'
import type { NewsItem } from '@/types/news'
import type { Translations } from '@/i18n/types'
import { SourceMeta } from '@/components/ui/SourceMeta'

interface NewsApiResponse {
  readonly success: boolean
  readonly data?: readonly NewsItem[]
  readonly error?: string
}

const KOREA_KEYWORDS = [
  '한국', 'korea', 'korean', 'k-', 'hyundai', 'samsung', 'lg', 'hanwha',
  'kepco', 'seoul', 'posco', 'sk ', 'cepa', '한-uae', 'uae-한국',
  'korean air', 'naver', 'kakao', 'doosan', 'daewoo',
] as const

function isKoreaRelated(item: NewsItem): boolean {
  const searchText = `${item.title} ${item.tags.join(' ')}`.toLowerCase()
  return KOREA_KEYWORDS.some(kw => searchText.includes(kw.toLowerCase()))
}

function splitNews(items: readonly NewsItem[]): {
  uaeLocal: readonly NewsItem[]
  uaeKorea: readonly NewsItem[]
} {
  const uaeKorea: NewsItem[] = []
  const uaeLocal: NewsItem[] = []

  for (const item of items) {
    if (isKoreaRelated(item)) {
      uaeKorea.push(item)
    } else {
      uaeLocal.push(item)
    }
  }

  return {
    uaeLocal: uaeLocal.slice(0, 4),
    uaeKorea: uaeKorea.slice(0, 4),
  }
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

const IMPACT_CONFIG = {
  high: { label: 'HIGH', labelKo: '높음', color: 'text-red-400' },
  medium: { label: 'MED', labelKo: '중간', color: 'text-yellow-400' },
  low: { label: 'LOW', labelKo: '낮음', color: 'text-gray-400' },
} as const

interface NewsListItemProps {
  readonly item: NewsItem
  readonly p: Translations['pages']['home']
  readonly locale: 'ko' | 'en'
}

function NewsListItem({ item, p, locale }: NewsListItemProps) {
  const impact = item.impact || 'medium'
  const impactConfig = IMPACT_CONFIG[impact]
  const summary = locale === 'ko' ? (item.summaryKo || item.summary) : item.summary

  return (
    <div className="group py-2.5 border-b border-brd/20 last:border-b-0">
      <div className="flex items-start gap-2">
        <span className={`text-[9px] font-bold mt-0.5 shrink-0 ${impactConfig.color}`}>
          {locale === 'en' ? impactConfig.label : impactConfig.labelKo}
        </span>
        <div className="flex-1 min-w-0">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <h3 className="text-[12px] text-t1 font-medium leading-snug line-clamp-2 group-hover:text-gold transition-colors">
              {item.title}
            </h3>
          </a>
          {summary && (
            <p className="text-[10px] text-t3 mt-0.5 line-clamp-1">{summary}</p>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[9px] text-t4/60 truncate max-w-[100px]">
              {item.publisher}
            </span>
            <span className="text-t4/40">·</span>
            <span className="text-[9px] text-t4/60">
              {formatRelativeDate(item.publishedAt, p, locale)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function NewsColumnSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-1.5 py-2">
          <div className="h-3.5 bg-bg4 rounded w-full" />
          <div className="h-3.5 bg-bg4 rounded w-3/4" />
          <div className="h-2.5 bg-bg4 rounded w-1/3" />
        </div>
      ))}
    </div>
  )
}

interface ErrorDisplayProps {
  readonly message: string
  readonly onRetry: () => void
  readonly retryLabel: string
}

function ErrorDisplay({ message, onRetry, retryLabel }: ErrorDisplayProps) {
  return (
    <div className="text-center py-6">
      <div className="text-[13px] text-accent-red mb-2">{message}</div>
      <button
        onClick={onRetry}
        className="text-[12px] text-t3 hover:text-gold transition-colors duration-150 underline focus-visible:ring-2 focus-visible:ring-gold/50 rounded"
      >
        {retryLabel}
      </button>
    </div>
  )
}

export function NewsHeadlines() {
  const { t, locale } = useLocale()
  const p = t.pages.home
  const [newsItems, setNewsItems] = useState<readonly NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNews = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/news')

      if (!response.ok) {
        throw new Error(`${p.newsLoadError} (${response.status})`)
      }

      const data: NewsApiResponse = await response.json()

      if (!data.success || !data.data) {
        throw new Error(data.error ?? p.newsDataError)
      }

      setNewsItems(data.data)
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : p.newsUnknownError
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [p.newsLoadError, p.newsDataError, p.newsUnknownError])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  const { uaeLocal, uaeKorea } = splitNews(newsItems)
  const totalCount = uaeLocal.length + uaeKorea.length

  const headerContent = (
    <div className="flex items-center gap-3 flex-1">
      <span className="text-xl">📰</span>
      <div>
        <div className="font-bold text-base text-t1">{p.newsTitle}</div>
        <div className="text-[12px] text-t3">{p.newsSubtitle}</div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <SourceMeta
          sourceName="Google/Naver RSS"
          asOf={new Date().toISOString().slice(0, 10)}
          compact
        />
        {!isLoading && !error && totalCount > 0 && (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gold/10 text-gold border border-gold/20">
            {totalCount}{p.newsCount}
          </span>
        )}
      </div>
    </div>
  )

  return (
    <Collapsible header={headerContent} defaultOpen>
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NewsColumnSkeleton />
          <NewsColumnSkeleton />
        </div>
      )}

      {error && <ErrorDisplay message={error} onRetry={fetchNews} retryLabel={p.newsRetry} />}

      {!isLoading && !error && totalCount === 0 && (
        <div className="text-center py-6 text-[13px] text-t3">
          {p.newsEmpty}
        </div>
      )}

      {!isLoading && !error && totalCount > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* UAE Local News */}
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-brd/40">
                <span className="text-sm">🇦🇪</span>
                <h3 className="text-[13px] font-bold text-t1">
                  {locale === 'en' ? 'UAE News' : 'UAE 현지 뉴스'}
                </h3>
                <span className="text-[10px] text-t4 ml-auto">
                  {uaeLocal.length}{locale === 'en' ? ' articles' : '건'}
                </span>
              </div>
              {uaeLocal.length > 0 ? (
                uaeLocal.map(item => (
                  <NewsListItem key={item.id} item={item} p={p} locale={locale} />
                ))
              ) : (
                <p className="text-[11px] text-t4 py-4 text-center">
                  {locale === 'en' ? 'No UAE news' : 'UAE 뉴스 없음'}
                </p>
              )}
            </div>

            {/* UAE-Korea News */}
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-brd/40">
                <span className="text-sm">🇰🇷</span>
                <h3 className="text-[13px] font-bold text-t1">
                  {locale === 'en' ? 'UAE-Korea' : 'UAE-한국 협력'}
                </h3>
                <span className="text-[10px] text-t4 ml-auto">
                  {uaeKorea.length}{locale === 'en' ? ' articles' : '건'}
                </span>
              </div>
              {uaeKorea.length > 0 ? (
                uaeKorea.map(item => (
                  <NewsListItem key={item.id} item={item} p={p} locale={locale} />
                ))
              ) : (
                <p className="text-[11px] text-t4 py-4 text-center">
                  {locale === 'en' ? 'No Korea-related news' : '한국 관련 뉴스 없음'}
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-brd/30 flex justify-center">
            <Link
              href="/news"
              className="text-[13px] text-gold hover:text-gold3 transition-colors focus-visible:ring-2 focus-visible:ring-gold/50 rounded px-2 py-1"
            >
              {p.newsMore} →
            </Link>
          </div>
        </>
      )}
    </Collapsible>
  )
}
