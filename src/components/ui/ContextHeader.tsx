'use client'

import { useState } from 'react'
import { Lightbulb, TrendingUp, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import { SourceMeta, type SourceMetaProps } from './SourceMeta'

export interface QuickQuestion {
  readonly label: string
  readonly query: string
}

interface ContextHeaderProps {
  readonly title: string
  readonly subtitle?: string
  readonly tldr: readonly string[]
  readonly investorImplications: readonly string[]
  readonly quickQuestions?: readonly QuickQuestion[]
  readonly source?: SourceMetaProps
  readonly locale?: 'ko' | 'en'
  readonly onAskMe?: (query: string) => void
}

export function ContextHeader({
  title,
  subtitle,
  tldr,
  investorImplications,
  quickQuestions = [],
  source,
  locale = 'ko',
  onAskMe,
}: ContextHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const handleAskMe = (query: string) => {
    if (onAskMe) {
      onAskMe(query)
    } else {
      // Fallback: dispatch custom event for SearchModal to catch
      window.dispatchEvent(new CustomEvent('askme-prefill', { detail: { query } }))
    }
  }

  const defaultQuestion = locale === 'en'
    ? `What are the key insights about ${title}?`
    : `${title}에 대해 투자자가 알아야 할 핵심 내용은?`

  return (
    <div className="mb-6 animate-fade-in">
      {/* Title Row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-[3px] h-8 rounded-full bg-gradient-to-b from-gold via-gold to-gold2/30" />
            <div className="absolute inset-0 w-[3px] rounded-full bg-gradient-to-b from-gold via-gold to-gold2/30 blur-sm" />
          </div>
          <div>
            <h1 className="font-display text-[28px] font-black text-gradient-gold leading-tight tracking-[-0.02em]">
              {title}
            </h1>
            {subtitle && (
              <p className="text-t3 text-[12px] mt-1 leading-relaxed tracking-wide max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Ask Me CTA */}
        <button
          onClick={() => handleAskMe(defaultQuestion)}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gold/10 hover:bg-gold/20 border border-gold/30 text-gold text-[12px] font-semibold transition-all duration-200 hover:scale-[1.02]"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{locale === 'en' ? 'Ask Me about this' : '이 페이지로 Ask Me'}</span>
        </button>
      </div>

      {/* Collapsible Content */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-bg3/80 to-bg2/60 border border-brd/50">
        {/* Toggle Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between mb-3"
        >
          <span className="text-[11px] font-bold text-t3 uppercase tracking-wide">
            {locale === 'en' ? 'Page Summary' : '페이지 요약'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-t4" />
          ) : (
            <ChevronDown className="w-4 h-4 text-t4" />
          )}
        </button>

        {isExpanded && (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              {/* TL;DR */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-gold" />
                  <span className="text-[11px] font-bold text-gold uppercase tracking-wide">
                    TL;DR
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {tldr.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[12px] text-t2 leading-relaxed">
                      <span className="text-gold/60 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Investor Implications */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-accent-green" />
                  <span className="text-[11px] font-bold text-accent-green uppercase tracking-wide">
                    {locale === 'en' ? 'Investor Implications' : '투자자 시사점'}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {investorImplications.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[12px] text-t2 leading-relaxed">
                      <span className="text-accent-green/60 mt-0.5">→</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Quick Questions */}
            {quickQuestions.length > 0 && (
              <div className="mt-4 pt-3 border-t border-brd/30">
                <div className="text-[10px] text-t4 mb-2">
                  {locale === 'en' ? 'Quick questions:' : '빠른 질문:'}
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAskMe(q.query)}
                      className="px-3 py-1.5 rounded-full bg-bg2 hover:bg-bg4 border border-brd hover:border-gold/30 text-[11px] text-t3 hover:text-gold transition-all duration-200"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Source */}
            {source && (
              <div className="mt-3 pt-3 border-t border-brd/30 flex justify-end">
                <SourceMeta {...source} compact />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
