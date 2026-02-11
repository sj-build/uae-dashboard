export type NewsSource = 'google' | 'naver' | 'manual'
export type NewsPriority = 'reuters' | 'bloomberg' | 'financial_times' | 'wsj' | 'the_national' | 'khaleej_times' | 'arab_news' | 'gulf_news' | 'wam' | 'other'

export type NewsImpact = 'high' | 'medium' | 'low'
export type NewsCategory = 'politics' | 'economy' | 'society' | 'industry' | 'legal' | 'korea'

export type NewsLane = 'deal' | 'macro' | 'uae_local' | 'korea_uae'

export interface NewsItem {
  readonly id: string
  readonly title: string
  readonly url: string
  readonly source: NewsSource
  readonly publisher: string
  readonly publishedAt: string
  readonly tags: readonly string[]
  readonly summary?: string
  readonly summaryKo?: string
  readonly priority: NewsPriority
  readonly imageUrl?: string
  readonly impact?: NewsImpact
  readonly category?: NewsCategory
  readonly relatedSection?: string // e.g., '/politics', '/economy'
  readonly lane?: NewsLane
}

export interface Keyword {
  readonly id: string
  readonly en: string
  readonly ko: string
  readonly category: string
  readonly active: boolean
}

export interface KeywordLayer {
  readonly layer: 1 | 2 | 3 | 4
  readonly label: string
  readonly keywords: readonly Keyword[]
}
