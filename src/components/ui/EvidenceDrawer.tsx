'use client'

import { useEffect, useRef } from 'react'
import {
  X,
  FileText,
  Newspaper,
  MessageSquare,
  ExternalLink,
  Lightbulb,
  Calendar,
  Tag,
  ChevronRight,
} from 'lucide-react'
import { useLocale } from '@/hooks/useLocale'
import type { SourceRef } from '@/lib/types'

interface EvidenceDrawerProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly sources: readonly SourceRef[]
  readonly title?: string
}

const SOURCE_TYPE_CONFIG = {
  insight: {
    icon: Lightbulb,
    labelKo: '인사이트',
    labelEn: 'Insight',
    bgColor: 'bg-gold/10',
    textColor: 'text-gold',
    borderColor: 'border-gold/20',
  },
  document: {
    icon: FileText,
    labelKo: '문서',
    labelEn: 'Document',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/20',
  },
  news: {
    icon: Newspaper,
    labelKo: '뉴스',
    labelEn: 'News',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/20',
  },
  askme: {
    icon: MessageSquare,
    labelKo: '이전 Q&A',
    labelEn: 'Previous Q&A',
    bgColor: 'bg-accent-green/10',
    textColor: 'text-accent-green',
    borderColor: 'border-accent-green/20',
  },
} as const

const RELEVANCE_COLORS = {
  high: { bg: 'bg-accent-green/10', text: 'text-accent-green', labelKo: '높음', labelEn: 'High' },
  medium: { bg: 'bg-gold/10', text: 'text-gold', labelKo: '중간', labelEn: 'Medium' },
  low: { bg: 'bg-t4/10', text: 'text-t4', labelKo: '낮음', labelEn: 'Low' },
} as const

function formatDate(dateString: string | null | undefined, locale: 'ko' | 'en'): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

export function EvidenceDrawer({ isOpen, onClose, sources, title }: EvidenceDrawerProps) {
  const { locale } = useLocale()
  const drawerRef = useRef<HTMLDivElement>(null)

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Group sources by type
  const groupedSources = sources.reduce((acc, source) => {
    const type = source.type
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(source)
    return acc
  }, {} as Record<string, SourceRef[]>)

  // Sort groups: insight first, then news, then askme, then document
  const sortedTypes = ['insight', 'news', 'askme', 'document'].filter(type => groupedSources[type]?.length > 0)

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[250] bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed top-0 right-0 z-[251] h-full w-full max-w-[480px] bg-bg2 border-l border-brd/50 shadow-2xl animate-slide-in-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-brd/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gold/10">
              <FileText className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-t1">
                {title || (locale === 'en' ? 'Evidence & Sources' : '근거 및 출처')}
              </h2>
              <p className="text-[11px] text-t4">
                {sources.length} {locale === 'en' ? 'sources referenced' : '개 출처 참조'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg3 text-t4 hover:text-t1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-73px)] overflow-y-auto p-4 space-y-6">
          {sources.length === 0 ? (
            <div className="text-center py-12 text-t4 text-[13px]">
              {locale === 'en' ? 'No sources available' : '참조된 출처가 없습니다'}
            </div>
          ) : (
            sortedTypes.map(type => {
              const config = SOURCE_TYPE_CONFIG[type as keyof typeof SOURCE_TYPE_CONFIG]
              const Icon = config.icon
              const typeSources = groupedSources[type]

              return (
                <div key={type}>
                  {/* Section Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
                      <Icon className={`w-4 h-4 ${config.textColor}`} />
                    </div>
                    <h3 className={`text-[13px] font-semibold ${config.textColor}`}>
                      {locale === 'en' ? config.labelEn : config.labelKo}
                    </h3>
                    <span className="text-[10px] text-t4 bg-bg3 px-2 py-0.5 rounded-full">
                      {typeSources.length}
                    </span>
                  </div>

                  {/* Source Cards */}
                  <div className="space-y-2">
                    {typeSources.map((source, idx) => (
                      <SourceCard
                        key={`${source.type}-${source.id}-${idx}`}
                        source={source}
                        config={config}
                        locale={locale}
                      />
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}

interface SourceCardProps {
  readonly source: SourceRef
  readonly config: (typeof SOURCE_TYPE_CONFIG)[keyof typeof SOURCE_TYPE_CONFIG]
  readonly locale: 'ko' | 'en'
}

function SourceCard({ source, config, locale }: SourceCardProps) {
  const relevance = source.relevance as keyof typeof RELEVANCE_COLORS | undefined
  const relevanceConfig = relevance ? RELEVANCE_COLORS[relevance] : null

  return (
    <div
      className={`p-3 rounded-xl border ${config.borderColor} bg-bg3/50 hover:bg-bg3 transition-colors`}
    >
      {/* Title Row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-[13px] font-medium text-t1 line-clamp-2 flex-1">
          {source.title}
        </h4>
        {relevanceConfig && (
          <span className={`flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-full ${relevanceConfig.bg} ${relevanceConfig.text}`}>
            {locale === 'en' ? relevanceConfig.labelEn : relevanceConfig.labelKo}
          </span>
        )}
      </div>

      {/* Snippet */}
      {source.snippet && (
        <p className="text-[12px] text-t3 line-clamp-3 mb-2 leading-relaxed">
          {source.snippet}
        </p>
      )}

      {/* Metadata Row */}
      <div className="flex items-center flex-wrap gap-2 text-[10px] text-t4">
        {source.published_at && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(source.published_at, locale)}</span>
          </div>
        )}

        {source.confidence && (
          <div className="flex items-center gap-1">
            <span className="opacity-60">|</span>
            <span>
              {locale === 'en' ? 'Confidence' : '신뢰도'}: {Math.round(source.confidence * 100)}%
            </span>
          </div>
        )}

        {source.tags && source.tags.length > 0 && (
          <div className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            <span className="truncate max-w-[100px]">
              {source.tags.slice(0, 2).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Link */}
      {source.url && (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-1.5 text-[11px] text-gold hover:text-gold3 transition-colors group"
        >
          <span>{locale === 'en' ? 'View original' : '원문 보기'}</span>
          <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </a>
      )}
    </div>
  )
}

// Export hook for managing drawer state
import { useState, useCallback } from 'react'

export function useEvidenceDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [sources, setSources] = useState<SourceRef[]>([])
  const [title, setTitle] = useState<string | undefined>()

  const openDrawer = useCallback((newSources: SourceRef[], newTitle?: string) => {
    setSources(newSources)
    setTitle(newTitle)
    setIsOpen(true)
  }, [])

  const closeDrawer = useCallback(() => {
    setIsOpen(false)
  }, [])

  return {
    isOpen,
    sources,
    title,
    openDrawer,
    closeDrawer,
  }
}
