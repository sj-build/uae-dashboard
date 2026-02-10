'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocale } from '@/hooks/useLocale'

// ─── Types ───────────────────────────────────────────────
interface HeroImage {
  public_url: string
  photographer?: string
  photographer_url?: string
  source_url?: string
  attribution_text?: string
}

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
  hero_image?: HeroImage
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

// ─── Photo URLs (Unsplash, free to use — all verified 200) ──
const PLACE_IMAGES: Record<string, string> = {
  'saadiyat-island': 'https://images.unsplash.com/photo-1578946956088-940c3b502864?w=600&h=340&fit=crop&q=80',
  'al-maryah-island': 'https://images.unsplash.com/photo-1587614313085-5da51cebd8ac?w=600&h=340&fit=crop&q=80',
  'downtown-corniche': 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=600&h=340&fit=crop&q=80',
  'yas-island': 'https://images.unsplash.com/photo-1605101100278-5d1deb2b6498?w=600&h=340&fit=crop&q=80',
  'al-reem-island': 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&h=340&fit=crop&q=80',
  'masdar-city': 'https://images.unsplash.com/photo-1597659840241-37e2b9c2f55f?w=600&h=340&fit=crop&q=80',
  'kizad': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=340&fit=crop&q=80',
  'difc': 'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=600&h=340&fit=crop&q=80',
  'downtown-dubai': 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=600&h=340&fit=crop&q=80',
  'business-bay': 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=600&h=340&fit=crop&q=80',
  'dubai-marina': 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=340&fit=crop&q=80',
  'jlt': 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&h=340&fit=crop&q=80',
  'internet-city-media-city': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=340&fit=crop&q=80',
  'deira-old-dubai': 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=600&h=340&fit=crop&q=80',
}

// ─── Constants ───────────────────────────────────────────
const BEST_FOR_LABELS: Record<string, { ko: string; en: string }> = {
  investor_meetings: { ko: '투자 미팅', en: 'Investor Meetings' },
  financial_services: { ko: '금융 서비스', en: 'Financial Services' },
  office_base: { ko: '오피스 거점', en: 'Office Base' },
  cultural_tourism: { ko: '문화 관광', en: 'Cultural Tourism' },
  luxury_living: { ko: '럭셔리 주거', en: 'Luxury Living' },
  art_galleries: { ko: '아트 갤러리', en: 'Art Galleries' },
  government_meetings: { ko: '정부 미팅', en: 'Government Meetings' },
  local_life: { ko: '로컬 생활', en: 'Local Life' },
  family_trip: { ko: '가족 여행', en: 'Family Trip' },
  entertainment: { ko: '엔터테인먼트', en: 'Entertainment' },
  events: { ko: '이벤트/공연', en: 'Events' },
  expat_living: { ko: '주재원 생활', en: 'Expat Living' },
  affordable_option: { ko: '합리적 비용', en: 'Affordable' },
  startup_hub: { ko: '스타트업', en: 'Startup Hub' },
  sme_office: { ko: '중소기업 오피스', en: 'SME Office' },
  cleantech: { ko: '클린테크', en: 'Cleantech' },
  innovation: { ko: '이노베이션', en: 'Innovation' },
  sustainability: { ko: '지속가능성', en: 'Sustainability' },
  manufacturing: { ko: '제조업', en: 'Manufacturing' },
  logistics: { ko: '물류', en: 'Logistics' },
  supply_chain: { ko: '공급망', en: 'Supply Chain' },
  fund_management: { ko: '펀드 관리', en: 'Fund Mgmt' },
  legal_advisory: { ko: '법률 자문', en: 'Legal Advisory' },
  landmark_visit: { ko: '랜드마크', en: 'Landmarks' },
  luxury_shopping: { ko: '럭셔리 쇼핑', en: 'Luxury Shopping' },
  business_meetings: { ko: '비즈니스 미팅', en: 'Business Meetings' },
  beach_lifestyle: { ko: '비치 라이프', en: 'Beach Life' },
  dining: { ko: '다이닝', en: 'Dining' },
  tech_companies: { ko: '테크 기업', en: 'Tech Companies' },
  media_industry: { ko: '미디어', en: 'Media' },
  digital_startups: { ko: '디지털 스타트업', en: 'Digital Startups' },
  traditional_trade: { ko: '전통 무역', en: 'Traditional Trade' },
  budget_shopping: { ko: '시장/쇼핑', en: 'Budget Shopping' },
  aviation: { ko: '항공', en: 'Aviation' },
  expo_legacy: { ko: '엑스포', en: 'Expo Legacy' },
}

// ─── Detail Panel ────────────────────────────────────────
function PlaceDetailPanel({
  slug,
  onClose,
  locale,
  pt,
}: {
  slug: string
  onClose: () => void
  locale: 'ko' | 'en'
  pt: ReturnType<typeof useLocale>['t']['pages']['places']
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

  const isKo = locale === 'ko'
  const bestForLabel = (bf: string) => BEST_FOR_LABELS[bf]?.[locale] ?? bf

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm flex items-start justify-end">
        <div className="w-full max-w-xl h-full bg-bg2 border-l border-brd overflow-y-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-40 bg-bg3 rounded-xl" />
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
  const heroImage = place.hero_image?.public_url ?? PLACE_IMAGES[place.slug]
  const heroAttribution = place.hero_image

  return (
    <div className="fixed inset-0 z-50 bg-bg/60 backdrop-blur-sm flex items-start justify-end" onClick={onClose}>
      <div
        className="w-full max-w-xl h-full bg-bg2 border-l border-brd overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero Image */}
        {heroImage && (
          <div className="relative h-48 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt={place.name_en}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg2 via-bg2/30 to-transparent" />
            {heroAttribution?.photographer && (
              <a
                href={heroAttribution.source_url ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2 left-3 text-[9px] text-white/50 hover:text-white/80 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {heroAttribution.attribution_text ?? `Photo: ${heroAttribution.photographer}`}
              </a>
            )}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-bg/70 backdrop-blur-sm text-t2 hover:text-t1 flex items-center justify-center text-sm"
            >
              x
            </button>
          </div>
        )}

        {/* Header */}
        <div className={`${heroImage ? '-mt-12 relative z-10' : 'border-b border-brd'} p-5 flex items-center gap-3`}>
          <span className="text-3xl">{place.icon ?? '📍'}</span>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-lg font-bold text-t1">
              {isKo ? (place.name_ko ?? place.name_en) : place.name_en}
            </h2>
            <p className="text-xs text-t3">
              {isKo ? place.name_en : (place.name_ko ?? '')}
            </p>
          </div>
          {!heroImage && (
            <button onClick={onClose} className="text-t4 hover:text-t1 text-xl px-2">x</button>
          )}
        </div>

        <div className="p-5 space-y-5">
          {/* Tagline */}
          <p className="text-sm text-t2 leading-relaxed">
            {isKo ? (place.tagline_ko ?? place.tagline_en) : (place.tagline_en ?? place.tagline_ko)}
          </p>

          {/* Best For */}
          {place.best_for.length > 0 && (
            <div>
              <p className="text-[10px] text-t4 font-semibold uppercase tracking-wider mb-2">{pt.bestFor}</p>
              <div className="flex flex-wrap gap-1.5">
                {place.best_for.map((bf) => (
                  <span key={bf} className="px-2.5 py-1 text-[11px] font-medium bg-gold/10 text-gold border border-gold/20 rounded-full">
                    {bestForLabel(bf)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {(place.description_ko || place.description_en) && (
            <div>
              <p className="text-[10px] text-t4 font-semibold uppercase tracking-wider mb-2">{pt.overview}</p>
              <p className="text-xs text-t2 leading-relaxed">
                {isKo ? (place.description_ko ?? place.description_en) : (place.description_en ?? place.description_ko)}
              </p>
            </div>
          )}

          {/* Highlights */}
          {place.highlights.length > 0 && (
            <div>
              <p className="text-[10px] text-t4 font-semibold uppercase tracking-wider mb-2">{pt.highlights}</p>
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
              <p className="text-[10px] text-t4 font-semibold uppercase tracking-wider mb-2">{pt.practicalInfo}</p>
              <div className="bg-bg3 rounded-xl p-4 space-y-2.5 text-xs">
                {place.practical.access && (
                  <div className="flex gap-2">
                    <span className="text-t4 shrink-0 w-16">{pt.access}</span>
                    <span className="text-t2">{place.practical.access}</span>
                  </div>
                )}
                {place.practical.vibe && (
                  <div className="flex gap-2">
                    <span className="text-t4 shrink-0 w-16">{pt.vibe}</span>
                    <span className="text-t2">{place.practical.vibe}</span>
                  </div>
                )}
                {place.practical.typical_meetings && (
                  <div className="flex gap-2">
                    <span className="text-t4 shrink-0 w-16">{pt.meetings}</span>
                    <span className="text-t2">{place.practical.typical_meetings}</span>
                  </div>
                )}
                {place.practical.tips && (
                  <div className="flex gap-2">
                    <span className="text-t4 shrink-0 w-16">{pt.tips}</span>
                    <span className="text-gold">{place.practical.tips}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Free Zone */}
          {fz?.is_free_zone && (
            <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-xl p-4">
              <p className="text-[10px] text-accent-blue font-bold uppercase tracking-wider mb-1">{pt.freeZone}</p>
              <p className="text-sm font-semibold text-t1">{fz.name}</p>
              {fz.notes && <p className="text-xs text-t3 mt-1">{fz.notes}</p>}
            </div>
          )}

          {/* Links */}
          {place.links.length > 0 && (
            <div>
              <p className="text-[10px] text-t4 font-semibold uppercase tracking-wider mb-2">{pt.links}</p>
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
              <p className="text-[10px] text-t4 font-semibold uppercase tracking-wider mb-2">{pt.relatedNews}</p>
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
                        {new Date(article.published_at).toLocaleDateString(isKo ? 'ko-KR' : 'en-US')}
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
              <p className="text-[10px] text-t4 mb-1">{pt.sources}</p>
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
  locale,
}: {
  place: Place
  onClick: () => void
  locale: 'ko' | 'en'
}) {
  const fz = place.free_zone
  const hasFreeZone = fz?.is_free_zone
  const isKo = locale === 'ko'
  const heroImage = place.hero_image?.public_url ?? PLACE_IMAGES[place.slug]
  const bestForLabel = (bf: string) => BEST_FOR_LABELS[bf]?.[locale] ?? bf

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-bg2 border border-brd rounded-xl overflow-hidden hover:border-gold/30 hover:shadow-[0_4px_20px_rgba(200,164,78,0.06)] transition-all duration-200 group"
    >
      {/* Photo */}
      {heroImage && (
        <div className="relative h-36 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt={place.name_en}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg2/90 via-transparent to-transparent" />
          {hasFreeZone && (
            <span className="absolute top-2 right-2 px-2 py-0.5 text-[9px] font-bold bg-accent-blue/90 text-white rounded backdrop-blur-sm">
              FZ
            </span>
          )}
        </div>
      )}

      <div className="p-4">
        {/* Icon + Name */}
        <div className="flex items-start gap-2.5 mb-2">
          <span className="text-xl mt-0.5">{place.icon ?? '📍'}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-sm font-bold text-t1 group-hover:text-gold transition-colors">
              {isKo ? (place.name_ko ?? place.name_en) : place.name_en}
            </h3>
            <p className="text-[11px] text-t4 mt-0.5">
              {isKo ? place.name_en : (place.name_ko ?? '')}
            </p>
          </div>
          {!heroImage && hasFreeZone && (
            <span className="shrink-0 px-2 py-0.5 text-[9px] font-bold bg-accent-blue/10 text-accent-blue border border-accent-blue/20 rounded">
              FZ
            </span>
          )}
        </div>

        {/* Tagline */}
        <p className="text-xs text-t3 leading-relaxed mb-3 line-clamp-2">
          {isKo ? (place.tagline_ko ?? place.tagline_en) : (place.tagline_en ?? place.tagline_ko)}
        </p>

        {/* Best For (2-3 items) */}
        <div className="flex flex-wrap gap-1">
          {place.best_for.slice(0, 3).map((bf) => (
            <span key={bf} className="px-2 py-0.5 text-[10px] font-medium bg-gold/8 text-gold/80 rounded-full">
              {bestForLabel(bf)}
            </span>
          ))}
        </div>
      </div>
    </button>
  )
}

// ─── Main Page ───────────────────────────────────────────
export default function PlacesPage() {
  const { t, locale } = useLocale()
  const pt = t.pages.places
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState<City>('abudhabi')
  const [category, setCategory] = useState<Category>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const CATEGORIES: { value: Category; labelKey: keyof typeof pt }[] = [
    { value: 'all', labelKey: 'catAll' },
    { value: 'business', labelKey: 'catBusiness' },
    { value: 'finance', labelKey: 'catFinance' },
    { value: 'culture', labelKey: 'catCulture' },
    { value: 'residential', labelKey: 'catResidential' },
    { value: 'leisure', labelKey: 'catLeisure' },
    { value: 'industrial', labelKey: 'catIndustrial' },
    { value: 'government', labelKey: 'catGovernment' },
  ]

  const CAT_ICONS: Record<string, string> = {
    business: '💼', finance: '🏦', culture: '🎨', residential: '🏠',
    leisure: '🎢', industrial: '🏗️', government: '🏛️',
  }

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
          {pt.title}
        </h1>
        <p className="text-t3 text-sm mt-1">
          {pt.subtitle}
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
            {CAT_ICONS[cat.value] && <span className="mr-1">{CAT_ICONS[cat.value]}</span>}
            {pt[cat.labelKey]}
          </button>
        ))}

        <div className="flex-1 min-w-[180px] max-w-sm ml-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={pt.searchPlaceholder}
            className="w-full px-4 py-2 text-xs bg-bg3 border border-brd rounded-lg text-t1 placeholder:text-t4 focus:border-gold/30 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-bg2 border border-brd rounded-xl overflow-hidden animate-pulse">
              <div className="h-36 bg-bg3" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-bg3 rounded w-3/4" />
                <div className="h-3 bg-bg3 rounded w-full" />
                <div className="h-3 bg-bg3 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : places.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-t3 text-sm">{pt.noResults}</p>
          <p className="text-t4 text-xs mt-1">{pt.noResultsHint}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {places.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              locale={locale}
              onClick={() => setSelectedSlug(place.slug)}
            />
          ))}
        </div>
      )}

      {/* Detail Panel */}
      {selectedSlug && (
        <PlaceDetailPanel
          slug={selectedSlug}
          locale={locale}
          pt={pt}
          onClose={() => setSelectedSlug(null)}
        />
      )}
    </div>
  )
}
