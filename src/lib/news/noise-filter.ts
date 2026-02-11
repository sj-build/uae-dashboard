import type { NewsItem } from '@/types/news'
import { NEWS_KEYWORD_PACK } from '@/config/news-keyword-pack'

const DEFAULT_NOISE_TERMS =
  NEWS_KEYWORD_PACK.google_news_rss_en.noise_filters_suggested

function isNoisy(
  title: string,
  description: string,
  noiseTerms: readonly string[] = DEFAULT_NOISE_TERMS,
): boolean {
  const combined = `${title} ${description}`.toLowerCase()
  return noiseTerms.some((term) => combined.includes(term.toLowerCase()))
}

function filterNoise(
  items: readonly NewsItem[],
  noiseTerms: readonly string[] = DEFAULT_NOISE_TERMS,
): readonly NewsItem[] {
  return items.filter(
    (item) =>
      item.lane === 'deal' ||
      item.lane === 'korea_uae' ||
      item.lane === 'uae_local' ||
      !isNoisy(item.title, item.summary ?? '', noiseTerms),
  )
}

export { isNoisy, filterNoise }
