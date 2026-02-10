'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Types ───────────────────────────────────────────────
interface Place {
  id: string
  slug: string
  city: string
  name_en: string
  name_ko: string | null
  tagline_en: string | null
  tagline_ko: string | null
  categories: string[]
  best_for: string[]
  icon: string | null
  free_zone: { is_free_zone?: boolean; name?: string; notes?: string }
  keywords: string[]
  as_of: string | null
  confidence: number
  links: Array<{ title: string; url: string; source_type: string }>
}

interface PlaceDetail extends Place {
  description_en: string | null
  description_ko: string | null
  highlights: Array<{ label: string; value: string }>
  practical: { access?: string; vibe?: string; typical_meetings?: string; tips?: string }
  sources: Array<{ url: string; title: string; trust_level: number; as_of: string }>
}

interface RelatedNews {
  id: string
  title: string
  url: string
  summary: string | null
  published_at: string | null
}

type City = 'abudhabi' | 'dubai'
type Category = 'all' | 'business' | 'finance' | 'culture' | 'residential' | 'leisure' | 'industrial' | 'government'

// ─── Constants ───────────────────────────────────────────
const CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: '' },
  { value: 'business', label: 'Business', icon: '💼' },
  { value: 'finance', label: 'Finance', icon: '🏦' },
  { value: 'culture', label: 'Culture', icon: '🎨' },
  { value: 'residential', label: 'Residential', icon: '🏠' },
  { value: 'leisure', label: 'Leisure', icon: '🎢' },
  { value: 'industrial', label: 'Industrial', icon: '🏗️' },
  { value: 'government', label: 'Government', icon: '🏛️' },
]

const BEST_FOR_LABELS: Record<string, string> = {
  investor_meetings: '투자 미팅',
  financial_services: '금융 서비스',
  office_base: '오피스 거점',
  cultural_tourism: '문화 관광',
  luxury_living: '럭셔리 주거',
  art_galleries: '아트 갤러리',
  government_meetings: '정부 미팅',
  local_life: '로컬 생활',
  family_trip: '가족 여행',
  entertainment: '엔터테인먼트',
  events: '이벤트/공연',
  expat_living: '주재원 생활',
  affordable_option: '합리적 비용',
  startup_hub: '스타트업',
  sme_office: '중소기업 오피스',
  cleantech: '클린테크',
  innovation: '이노베이션',
  sustainability: '지속가능성',
  manufacturing: '제조업',
  logistics: '물류',
  supply_chain: '공급망',
  fund_management: '펀드 관리',
  legal_advisory: '법률 자문',
  landmark_visit: '랜드마크',
  luxury_shopping: '럭셔리 쇼핑',
  business_meetings: '비즈니스 미팅',
  beach_lifestyle: '비치 라이프스타일',
  dining: '다이닝',
  tech_companies: '테크 기업',
  media_industry: '미디어 산업',
  digital_startups: '디지털 스타트업',
  traditional_trade: '전통 무역',
  budget_shopping: '시장/쇼핑',
  aviation: '항공',
  expo_legacy: '엑스포',
}

// ─── Detail Panel ────────────────────────────────────────
function PlaceDetailPanel({
  slug,
  onClose,
}: {
  slug: string
  onClose: () => void
}) {
  const [place, setPlace] = useState<PlaceDetail | null>(null)
  const [news, setNews] = useState<RelatedNews[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/places/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setPlace(data.place ?? null)
        setNews(data.relatedNews ?? [])
      })
      .catch(() => setPlace(null))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm flex items-start justify-end">
        <div className="w-full max-w-xl h-full bg-bg2 border-l border-brd overflow-y-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-bg3 rounded w-3/4" />
            <div className="h-4 bg-bg3 rounded w-full" />
            <div className="h-4 bg-bg3 rounded w-2/3" />
          </div>
        </div>
      </div>
    )
  }

  if (!place) return null

  const fz = place.free_zone

  return (
    <div className="fixed inset-0 z-50 bg-bg/60 backdrop-blur-sm flex items-start justify-end" onClick={onClose}>
      <div
        className="w-full max-w-xl h-full bg-bg2 border-l border-brd overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-bg2/95 backdrop-blur-md border-b border-brd p-5 flex items-center gap-3">
          <span className="text-3xl">{place.icon ?? '📍'}</span>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-lg font-bold text-t1">{place.name_ko ?? place.name_en}</h2>
            {place.name_ko && (
              <p className="text-xs text-t3">{place.name_en}</p>
            )}
          </div>
          <button onClick={onClose} className="text-t4 hover:text-t1 text-xl px-2">x</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Tagline */}
          <p className="text-sm text-t2 leading-relaxed">
            {place.tagline_ko ?? place.tagline_en}
          </p>

          {/* Best For */}
          {place.best_for.length > 0 && (
            <div>
              <p className="text-[10px] text-t4 font-semibold uppercase tracking-wider mb-2">Best for</p>
              <div className="flex flex-wrap gap-1.5">
                {place.best_for.map((bf) => (
                  <span key={bf} className="px-2.5 py-1 text-[11px] font-medium bg-gold/10 text-gold border border-gold/20 rounded-full">
                    {BEST_FOR_LABELS[bf] ?? bf}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {(place.description_ko || place.description_en) && (
            <div>
              <p className="text-[10px] text-t4 font-semibold uppercase tracking-wider mb-2">Overview</p>
              <p className="text-xs text-t2 leading-relaxed">
                {place.description_ko ?? place.description_en}
              </p>
            </div>
          )}

          {/* Highlights */}
          {place.highlights.length > 0 && (
            <div>
              <p className="text-[10px] text-t4 font-semibold uppercase tracking-wider mb-2">Key Highlights</p>
              <div className="space-y-2">
                {place.highlights.map((h, i) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <span className="text-gold font-semibold shrink-0 w-36">{h.label}</span>
                    <span className="text-t2">{h.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Practical Info */}
          {place.practical && Object.keys(place.practical).length > 0 && (
            <div>
              <p className="text-[10px] text-t4 font-semibold uppercase tracking-wider mb-2">Practical Info</p>
              <div className="bg-bg3 rounded-xl p-4 space-y-2.5 text-xs">
                {place.practical.access && (
                  <div className="flex gap-2">
                    <span className="text-t4 shrink-0 w-16">Access</span>
                    <span className="text-t2">{place.practical.access}</span>
                  </div>
                )}
                {place.practical.vibe && (
                  <div className="flex gap-2">
                    <span className="text-t4 shrink-0 w-16">Vibe</span>
                    <span className="text-t2">{place.practical.vibe}</span>
                  </div>
                )}
                {place.practical.typical_meetings && (
                  <div className="flex gap-2">
                    <span className="text-t4 shrink-0 w-16">Meetings</span>
                    <span className="text-t2">{place.practical.typical_meetings}</span>
                  </div>
                )}
                {place.practical.tips && (
                  <div className="flex gap-2">
                    <span className="text-t4 shrink-0 w-16">Tips</span>
                    <span className="text-gold">{place.practical.tips}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Free Zone */}
          {fz?.is_free_zone && (
            <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-xl p-4">
              <p className="text-[10px] text-accent-blue font-bold uppercase tracking-wider mb-1">Free Zone</p>
              <p className="text-sm font-semibold text-t1">{fz.name}</p>
              {fz.notes && <p className="text-xs text-t3 mt-1">{fz.notes}</p>}
            </div>
          )}

          {/* Links */}
          {place.links.length > 0 && (
            <div>
              <p className="text-[10px] text-t4 font-semibold uppercase tracking-wider mb-2">Links</p>
              <div className="flex flex-wrap gap-2">
                {place.links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-accent-blue hover:text-accent-blue/80 bg-accent-blue/5 px-3 py-1.5 rounded-lg border border-accent-blue/10 transition-colors"
                  >
                    {link.title}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Related News */}
          {news.length > 0 && (
            <div>
              <p className="text-[10px] text-t4 font-semibold uppercase tracking-wider mb-2">Related News</p>
              <div className="space-y-2">
                {news.map((article) => (
                  <a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-bg3 rounded-lg p-3 hover:border-brd2 border border-transparent transition-colors"
                  >
                    <p className="text-xs text-t1 font-medium line-clamp-2">{article.title}</p>
                    {article.published_at && (
                      <p className="text-[10px] text-t4 mt-1">
                        {new Date(article.published_at).toLocaleDateString('ko-KR')}
                      </p>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Sources */}
          {place.sources.length > 0 && (
            <div className="pt-3 border-t border-brd/50">
              <p className="text-[10px] text-t4 mb-1">Sources</p>
              <div className="flex flex-wrap gap-1">
                {place.sources.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-t4 hover:text-t2"
                  >
                    {s.title} ({s.as_of})
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Place Card ──────────────────────────────────────────
function PlaceCard({
  place,
  onClick,
}: {
  place: Place
  onClick: () => void
}) {
  const fz = place.free_zone
  const hasFreeZone = fz?.is_free_zone

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-bg2 border border-brd rounded-xl p-5 hover:border-gold/30 hover:shadow-[0_4px_20px_rgba(200,164,78,0.06)] transition-all duration-200 group"
    >
      {/* Icon + Name */}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl mt-0.5">{place.icon ?? '📍'}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-sm font-bold text-t1 group-hover:text-gold transition-colors">
            {place.name_ko ?? place.name_en}
          </h3>
          {place.name_ko && (
            <p className="text-[11px] text-t4 mt-0.5">{place.name_en}</p>
          )}
        </div>
        {hasFreeZone && (
          <span className="shrink-0 px-2 py-0.5 text-[9px] font-bold bg-accent-blue/10 text-accent-blue border border-accent-blue/20 rounded">
            FZ
          </span>
        )}
      </div>

      {/* Tagline */}
      <p className="text-xs text-t3 leading-relaxed mb-3 line-clamp-2">
        {place.tagline_ko ?? place.tagline_en}
      </p>

      {/* Categories */}
      <div className="flex flex-wrap gap-1 mb-3">
        {place.categories.slice(0, 3).map((cat) => (
          <span key={cat} className="px-2 py-0.5 text-[10px] font-medium bg-bg3 text-t3 rounded-full border border-brd">
            {cat}
          </span>
        ))}
      </div>

      {/* Best For (2-3 items) */}
      <div className="flex flex-wrap gap-1">
        {place.best_for.slice(0, 3).map((bf) => (
          <span key={bf} className="text-[10px] text-gold/70">
            {BEST_FOR_LABELS[bf] ?? bf}
          </span>
        ))}
      </div>
    </button>
  )
}

// ─── Main Page ───────────────────────────────────────────
export default function PlacesPage() {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState<City>('abudhabi')
  const [category, setCategory] = useState<Category>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  // Debounce search input (300ms)
  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  const fetchPlaces = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('city', city)
      if (category !== 'all') params.set('category', category)
      if (debouncedSearch) params.set('q', debouncedSearch)

      const res = await fetch(`/api/places?${params}`)
      const data = await res.json()
      setPlaces(data.items ?? [])
    } catch {
      setPlaces([])
    } finally {
      setLoading(false)
    }
  }, [city, category, debouncedSearch])

  useEffect(() => {
    fetchPlaces()
  }, [fetchPlaces])

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-xl font-bold text-t1 tracking-wide">
          Places
        </h1>
        <p className="text-t3 text-sm mt-1">
          Abu Dhabi & Dubai — where to go, what each area is known for
        </p>
      </div>

      {/* City Tabs */}
      <div className="flex gap-2 mb-5">
        {([
          { value: 'abudhabi' as City, label: 'Abu Dhabi', icon: '🇦🇪' },
          { value: 'dubai' as City, label: 'Dubai', icon: '🏙️' },
        ]).map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setCity(tab.value); setCategory('all'); setSearch('') }}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              city === tab.value
                ? 'bg-gold/10 text-gold border border-gold/25 shadow-[0_2px_12px_rgba(200,164,78,0.1)]'
                : 'bg-bg2 text-t3 border border-brd hover:border-brd2 hover:text-t1'
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Chips + Search */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              category === cat.value
                ? 'bg-gold/10 text-gold border border-gold/20'
                : 'bg-bg3 text-t3 border border-brd hover:border-brd2'
            }`}
          >
            {cat.icon && <span className="mr-1">{cat.icon}</span>}
            {cat.label}
          </button>
        ))}

        <div className="flex-1 min-w-[180px] max-w-sm ml-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search places..."
            className="w-full px-4 py-2 text-xs bg-bg3 border border-brd rounded-lg text-t1 placeholder:text-t4 focus:border-gold/30 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-bg2 border border-brd rounded-xl p-5 animate-pulse">
              <div className="flex gap-3 mb-3">
                <div className="w-8 h-8 bg-bg3 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-bg3 rounded w-3/4" />
                  <div className="h-3 bg-bg3 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-bg3 rounded w-full mb-2" />
              <div className="h-3 bg-bg3 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : places.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-t3 text-sm">No places found</p>
          <p className="text-t4 text-xs mt-1">Try changing filters or search terms</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {places.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              onClick={() => setSelectedSlug(place.slug)}
            />
          ))}
        </div>
      )}

      {/* Detail Panel */}
      {selectedSlug && (
        <PlaceDetailPanel
          slug={selectedSlug}
          onClose={() => setSelectedSlug(null)}
        />
      )}
    </div>
  )
}
