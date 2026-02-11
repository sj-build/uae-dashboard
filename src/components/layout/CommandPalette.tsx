'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  X,
  Command,
  ArrowRight,
  Clock,
  TrendingUp,
  Sparkles,
  Building2,
  User,
  Globe,
  FileText,
  BarChart3,
  Scale,
  Users,
  Newspaper,
  Home,
} from 'lucide-react'
import { useLocale } from '@/hooks/useLocale'

interface CommandPaletteProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly onOpenAskMe: (query?: string) => void
}

interface CommandItem {
  readonly id: string
  readonly type: 'page' | 'entity' | 'action' | 'search'
  readonly icon: React.ReactNode
  readonly title: string
  readonly subtitle?: string
  readonly keywords?: readonly string[]
  readonly action: () => void
}

// Page definitions
const PAGES = [
  { id: 'home', path: '/home', icon: Home, titleKo: '홈', titleEn: 'Home', keywords: ['dashboard', '대시보드', 'main'] },
  { id: 'comparison', path: '/comparison', icon: BarChart3, titleKo: 'UAE vs Korea', titleEn: 'UAE vs Korea', keywords: ['비교', 'compare', '한국'] },
  { id: 'industry', path: '/industry', icon: Building2, titleKo: '산업', titleEn: 'Industry', keywords: ['sector', '섹터', 'AI', 'energy', 'crypto'] },
  { id: 'economy', path: '/economy', icon: Globe, titleKo: '경제', titleEn: 'Economy', keywords: ['GDP', 'SWF', '국부펀드', 'investment'] },
  { id: 'politics', path: '/politics', icon: Users, titleKo: '정치', titleEn: 'Politics', keywords: ['MBZ', 'royal', '왕족', 'government'] },
  { id: 'society', path: '/society', icon: User, titleKo: '사회', titleEn: 'Society', keywords: ['culture', '문화', 'K-wave', 'population'] },
  { id: 'legal', path: '/legal', icon: Scale, titleKo: '법률', titleEn: 'Legal', keywords: ['regulation', '규제', 'tax', 'freezone'] },
  { id: 'news', path: '/news', icon: Newspaper, titleKo: '뉴스', titleEn: 'News', keywords: ['article', '기사', 'recent'] },
] as const

// Featured entities
const ENTITIES = [
  { id: 'mbz', name: 'MBZ (Mohammed bin Zayed)', type: 'person', keywords: ['president', '대통령', 'sheikh', 'abu dhabi'] },
  { id: 'tahnoun', name: 'Sheikh Tahnoun bin Zayed', type: 'person', keywords: ['g42', 'ihc', 'national security'] },
  { id: 'mubadala', name: 'Mubadala Investment Company', type: 'organization', keywords: ['swf', '국부펀드', 'investment'] },
  { id: 'adia', name: 'ADIA (Abu Dhabi Investment Authority)', type: 'organization', keywords: ['swf', '국부펀드', '$1T'] },
  { id: 'adq', name: 'ADQ', type: 'organization', keywords: ['swf', 'holding', 'abu dhabi'] },
  { id: 'g42', name: 'G42', type: 'organization', keywords: ['AI', 'technology', 'tahnoun'] },
  { id: 'ihc', name: 'IHC (International Holding Company)', type: 'organization', keywords: ['conglomerate', 'tahnoun', 'holding'] },
  { id: 'adnoc', name: 'ADNOC', type: 'organization', keywords: ['oil', 'energy', 'petroleum'] },
] as const

// Popular searches
const POPULAR_SEARCHES = [
  'UAE 국부펀드 투자 트렌드',
  'G42 Microsoft 파트너십',
  'UAE 가상자산 규제',
  'K-Beauty UAE 시장',
  '에미라티화 정책',
  '프리존 vs 메인랜드',
] as const

const RECENT_SEARCHES_KEY = 'uae-dashboard-recent-searches'
const MAX_RECENT_SEARCHES = 5

export function CommandPalette({ isOpen, onClose, onOpenAskMe }: CommandPaletteProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const { locale } = useLocale()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (stored) {
        setRecentSearches(JSON.parse(stored))
      }
    } catch {
      // localStorage unavailable or corrupt data
      setRecentSearches([])
    }
  }, [])

  // Save recent search
  const saveRecentSearch = useCallback((search: string) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== search)
      const updated = [search, ...filtered].slice(0, MAX_RECENT_SEARCHES)
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
      } catch {
        // localStorage unavailable
      }
      return updated
    })
  }, [])

  // Navigate to page
  const navigateToPage = useCallback((path: string) => {
    router.push(path)
    onClose()
  }, [router, onClose])

  // Open Ask Me with query
  const askAbout = useCallback((searchQuery: string) => {
    saveRecentSearch(searchQuery)
    onClose()
    onOpenAskMe(searchQuery)
  }, [onClose, onOpenAskMe, saveRecentSearch])

  // Build command items
  const commandItems = useMemo((): CommandItem[] => {
    const items: CommandItem[] = []
    const queryLower = query.toLowerCase()

    // If no query, show pages + recent + popular
    if (!query) {
      // Pages section
      PAGES.forEach(page => {
        items.push({
          id: `page-${page.id}`,
          type: 'page',
          icon: <page.icon className="w-4 h-4" />,
          title: locale === 'en' ? page.titleEn : page.titleKo,
          subtitle: locale === 'en' ? 'Go to page' : '페이지로 이동',
          action: () => navigateToPage(page.path),
        })
      })

      // Recent searches
      if (recentSearches.length > 0) {
        recentSearches.forEach((search, idx) => {
          items.push({
            id: `recent-${idx}`,
            type: 'search',
            icon: <Clock className="w-4 h-4 text-t4" />,
            title: search,
            subtitle: locale === 'en' ? 'Recent search' : '최근 검색',
            action: () => askAbout(search),
          })
        })
      }

      // Popular searches
      POPULAR_SEARCHES.slice(0, 3).forEach((search, idx) => {
        items.push({
          id: `popular-${idx}`,
          type: 'search',
          icon: <TrendingUp className="w-4 h-4 text-gold/70" />,
          title: search,
          subtitle: locale === 'en' ? 'Popular' : '인기 검색',
          action: () => askAbout(search),
        })
      })

      return items
    }

    // Filter pages
    const matchingPages = PAGES.filter(page => {
      const titleMatch = (locale === 'en' ? page.titleEn : page.titleKo).toLowerCase().includes(queryLower)
      const keywordMatch = page.keywords.some(k => k.toLowerCase().includes(queryLower))
      return titleMatch || keywordMatch
    })

    matchingPages.forEach(page => {
      items.push({
        id: `page-${page.id}`,
        type: 'page',
        icon: <page.icon className="w-4 h-4" />,
        title: locale === 'en' ? page.titleEn : page.titleKo,
        subtitle: locale === 'en' ? 'Go to page' : '페이지로 이동',
        action: () => navigateToPage(page.path),
      })
    })

    // Filter entities
    const matchingEntities = ENTITIES.filter(entity => {
      const nameMatch = entity.name.toLowerCase().includes(queryLower)
      const keywordMatch = entity.keywords.some(k => k.toLowerCase().includes(queryLower))
      return nameMatch || keywordMatch
    })

    matchingEntities.forEach(entity => {
      items.push({
        id: `entity-${entity.id}`,
        type: 'entity',
        icon: entity.type === 'person'
          ? <User className="w-4 h-4 text-accent-blue" />
          : <Building2 className="w-4 h-4 text-accent-green" />,
        title: entity.name,
        subtitle: locale === 'en' ? `Ask about ${entity.name}` : `${entity.name}에 대해 질문`,
        action: () => askAbout(`${entity.name}에 대해 알려주세요`),
      })
    })

    // Always add "Ask Me" option at the end
    if (query.length >= 2) {
      items.push({
        id: 'ask-custom',
        type: 'action',
        icon: <Sparkles className="w-4 h-4 text-gold" />,
        title: query,
        subtitle: locale === 'en' ? 'Ask AI about this' : 'AI에게 질문하기',
        action: () => askAbout(query),
      })
    }

    return items
  }, [query, locale, recentSearches, navigateToPage, askAbout])

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0)
  }, [commandItems.length])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, commandItems.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (commandItems[selectedIndex]) {
            commandItems[selectedIndex].action()
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, commandItems, selectedIndex, onClose])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setQuery('')
      setSelectedIndex(0)
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="max-w-[600px] mx-auto mt-[15vh] px-4">
        <div className="bg-bg2 rounded-2xl border border-brd/60 shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 border-b border-brd/40">
            <Search className="w-5 h-5 text-t4 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={locale === 'en' ? 'Search pages, entities, or ask a question...' : '페이지, 인물, 기업 검색 또는 질문 입력...'}
              className="flex-1 py-4 bg-transparent text-t1 text-[15px] outline-none placeholder:text-t4"
            />
            <div className="flex items-center gap-1.5 text-[10px] text-t4">
              <kbd className="px-1.5 py-0.5 rounded bg-bg3 border border-brd/50 font-mono">ESC</kbd>
              <span>{locale === 'en' ? 'to close' : '닫기'}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-bg3 text-t4 hover:text-t1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results List */}
          <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
            {commandItems.length === 0 ? (
              <div className="py-8 text-center text-t4 text-[13px]">
                {locale === 'en' ? 'No results found' : '검색 결과가 없습니다'}
              </div>
            ) : (
              <>
                {/* Group by type */}
                {query === '' && (
                  <>
                    <div className="px-4 py-2 text-[10px] font-semibold text-t4 uppercase tracking-wide">
                      {locale === 'en' ? 'Pages' : '페이지'}
                    </div>
                    {commandItems
                      .filter(item => item.type === 'page')
                      .map((item, idx) => (
                        <CommandItemRow
                          key={item.id}
                          item={item}
                          isSelected={selectedIndex === idx}
                          dataIndex={idx}
                          onClick={item.action}
                          onMouseEnter={() => setSelectedIndex(idx)}
                        />
                      ))}

                    {recentSearches.length > 0 && (
                      <>
                        <div className="px-4 py-2 mt-2 text-[10px] font-semibold text-t4 uppercase tracking-wide">
                          {locale === 'en' ? 'Recent' : '최근 검색'}
                        </div>
                        {commandItems
                          .filter(item => item.id.startsWith('recent-'))
                          .map((item, rawIdx) => {
                            const idx = PAGES.length + rawIdx
                            return (
                              <CommandItemRow
                                key={item.id}
                                item={item}
                                isSelected={selectedIndex === idx}
                                dataIndex={idx}
                                onClick={item.action}
                                onMouseEnter={() => setSelectedIndex(idx)}
                              />
                            )
                          })}
                      </>
                    )}

                    <div className="px-4 py-2 mt-2 text-[10px] font-semibold text-t4 uppercase tracking-wide">
                      {locale === 'en' ? 'Popular' : '인기 검색'}
                    </div>
                    {commandItems
                      .filter(item => item.id.startsWith('popular-'))
                      .map((item, rawIdx) => {
                        const idx = PAGES.length + recentSearches.length + rawIdx
                        return (
                          <CommandItemRow
                            key={item.id}
                            item={item}
                            isSelected={selectedIndex === idx}
                            dataIndex={idx}
                            onClick={item.action}
                            onMouseEnter={() => setSelectedIndex(idx)}
                          />
                        )
                      })}
                  </>
                )}

                {query !== '' && (
                  commandItems.map((item, idx) => (
                    <CommandItemRow
                      key={item.id}
                      item={item}
                      isSelected={selectedIndex === idx}
                      dataIndex={idx}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    />
                  ))
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-brd/40 bg-bg/50">
            <div className="flex items-center justify-between text-[10px] text-t4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-bg3 border border-brd/50 font-mono">↑↓</kbd>
                  <span>{locale === 'en' ? 'Navigate' : '이동'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-bg3 border border-brd/50 font-mono">↵</kbd>
                  <span>{locale === 'en' ? 'Select' : '선택'}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Command className="w-3 h-3" />
                <span>K {locale === 'en' ? 'to open' : '열기'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface CommandItemRowProps {
  readonly item: CommandItem
  readonly isSelected: boolean
  readonly dataIndex: number
  readonly onClick: () => void
  readonly onMouseEnter: () => void
}

function CommandItemRow({ item, isSelected, dataIndex, onClick, onMouseEnter }: CommandItemRowProps) {
  return (
    <button
      data-index={dataIndex}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
        isSelected ? 'bg-gold/10' : 'hover:bg-bg3/50'
      }`}
    >
      <div className={`p-2 rounded-lg ${
        isSelected ? 'bg-gold/20 text-gold' : 'bg-bg3 text-t3'
      }`}>
        {item.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-[13px] font-medium truncate ${isSelected ? 'text-gold' : 'text-t1'}`}>
          {item.title}
        </div>
        {item.subtitle && (
          <div className="text-[11px] text-t4 truncate">
            {item.subtitle}
          </div>
        )}
      </div>
      {isSelected && (
        <ArrowRight className="w-4 h-4 text-gold flex-shrink-0" />
      )}
    </button>
  )
}
