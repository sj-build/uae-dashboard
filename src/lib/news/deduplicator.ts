import type { NewsItem, NewsPriority } from '@/types/news'

const SOURCE_PRIORITY_ORDER: Record<NewsPriority, number> = {
  reuters: 1,
  bloomberg: 2,
  financial_times: 3,
  wsj: 4,
  the_national: 5,
  khaleej_times: 6,
  arab_news: 7,
  gulf_news: 8,
  wam: 9,
  other: 10,
} as const

function tokenize(text: string): ReadonlySet<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, '')
      .split(/\s+/)
      .filter((token) => token.length > 1)
  )
}

function jaccardSimilarity(setA: ReadonlySet<string>, setB: ReadonlySet<string>): number {
  if (setA.size === 0 && setB.size === 0) {
    return 1
  }

  let intersectionSize = 0
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionSize += 1
    }
  }

  const unionSize = setA.size + setB.size - intersectionSize

  if (unionSize === 0) {
    return 0
  }

  return intersectionSize / unionSize
}

const SIMILARITY_THRESHOLD = 0.45

function selectHigherPriority(a: NewsItem, b: NewsItem): NewsItem {
  const priorityA = SOURCE_PRIORITY_ORDER[a.priority]
  const priorityB = SOURCE_PRIORITY_ORDER[b.priority]

  if (priorityA <= priorityB) {
    return a
  }
  return b
}

export function deduplicateNews(items: readonly NewsItem[]): readonly NewsItem[] {
  if (items.length === 0) {
    return []
  }

  const tokenizedItems: ReadonlyArray<{
    readonly item: NewsItem
    readonly tokens: ReadonlySet<string>
  }> = items.map((item) => ({
    item,
    tokens: tokenize(item.title),
  }))

  const kept: Array<{
    item: NewsItem
    tokens: ReadonlySet<string>
  }> = []

  for (const current of tokenizedItems) {
    let isDuplicate = false
    let duplicateIndex = -1

    for (let i = 0; i < kept.length; i++) {
      const similarity = jaccardSimilarity(current.tokens, kept[i].tokens)

      if (similarity >= SIMILARITY_THRESHOLD) {
        isDuplicate = true
        duplicateIndex = i
        break
      }
    }

    if (isDuplicate && duplicateIndex >= 0) {
      const existing = kept[duplicateIndex]
      const winner = selectHigherPriority(existing.item, current.item)
      kept[duplicateIndex] = {
        item: winner,
        tokens: tokenize(winner.title),
      }
    } else {
      kept.push({
        item: current.item,
        tokens: current.tokens,
      })
    }
  }

  const sortedItems = [...kept.map((entry) => entry.item)].sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime()
    const dateB = new Date(b.publishedAt).getTime()
    return dateB - dateA
  })

  return sortedItems
}
