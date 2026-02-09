'use client'

import { useState, useRef, useEffect } from 'react'
import { HelpCircle } from 'lucide-react'
import { useBeginnerMode } from '@/contexts/BeginnerModeContext'

interface GlossaryTooltipProps {
  readonly term: string
  readonly children: React.ReactNode
  readonly definition: string
  readonly definitionEn?: string
  readonly locale?: 'ko' | 'en'
}

// Glossary of UAE-related terms
export const UAE_GLOSSARY: Record<string, { ko: string; en: string }> = {
  // Political Terms
  'MBZ': {
    ko: '무함마드 빈 자이드, UAE 대통령 겸 아부다비 통치자. UAE 정치의 핵심 인물.',
    en: 'Mohammed bin Zayed, President of UAE and Ruler of Abu Dhabi. Key figure in UAE politics.',
  },
  'Tahnoun': {
    ko: '타흐눈 빈 자이드, MBZ의 동생. 국가안보보좌관이자 G42, IHC 등 핵심 기업 회장.',
    en: 'Tahnoun bin Zayed, MBZ\'s brother. National Security Advisor and Chairman of G42, IHC.',
  },
  'Wasta': {
    ko: '아랍 문화의 연줄/인맥 문화. UAE 비즈니스에서 관계가 핵심인 이유.',
    en: 'Arab culture of connections/influence. Key reason why relationships matter in UAE business.',
  },
  'Emiratization': {
    ko: '민간 기업의 UAE 자국민 의무 고용 정책. 미달시 벌금 부과.',
    en: 'Mandatory UAE national employment quota for private companies. Fines for non-compliance.',
  },
  // Economic Terms
  'SWF': {
    ko: 'Sovereign Wealth Fund, 국부펀드. UAE는 ADIA($1T), Mubadala($302B), ADQ($200B) 등 보유.',
    en: 'Sovereign Wealth Fund. UAE has ADIA ($1T), Mubadala ($302B), ADQ ($200B) etc.',
  },
  'ADIA': {
    ko: 'Abu Dhabi Investment Authority, 세계 최대 국부펀드 중 하나. 운용자산 약 $1조.',
    en: 'Abu Dhabi Investment Authority, one of world\'s largest SWFs. ~$1T AUM.',
  },
  'Mubadala': {
    ko: '아부다비 국부펀드. 기술/항공/헬스케어 중심 투자. AUM $302B.',
    en: 'Abu Dhabi SWF. Invests in tech/aerospace/healthcare. $302B AUM.',
  },
  'ADQ': {
    ko: '아부다비 발전 지주회사. 물류, 식품, 유틸리티 등 핵심 인프라 투자.',
    en: 'Abu Dhabi Developmental Holding Co. Invests in logistics, food, utilities infrastructure.',
  },
  'IHC': {
    ko: 'International Holding Company. Tahnoun 회장, 시가총액 $200B+ 대형 지주회사.',
    en: 'International Holding Company. Chairman Tahnoun, $200B+ market cap conglomerate.',
  },
  // Legal Terms
  'Free Zone': {
    ko: '외국인 100% 소유 허용, 관세/VAT 면제 특구. ADGM, DIFC, DMCC 등 50개+.',
    en: 'Special zones allowing 100% foreign ownership, tax exemptions. ADGM, DIFC, DMCC, etc.',
  },
  'ADGM': {
    ko: 'Abu Dhabi Global Market. 영미법 적용 금융 프리존. 핀테크/가상자산에 개방적.',
    en: 'Abu Dhabi Global Market. Common law financial free zone. Open to fintech/crypto.',
  },
  'DIFC': {
    ko: 'Dubai International Financial Centre. 두바이의 금융 허브, 영미법 적용.',
    en: 'Dubai International Financial Centre. Dubai\'s financial hub under common law.',
  },
  'Golden Visa': {
    ko: 'UAE 장기체류 비자 (5~10년). 투자자, 전문가, 창업자에게 발급.',
    en: 'UAE long-term visa (5-10 years). For investors, specialists, entrepreneurs.',
  },
  // Industry Terms
  'G42': {
    ko: 'Tahnoun 소유 AI 기업. Microsoft 협력, Falcon LLM 개발. UAE AI 전략 핵심.',
    en: 'Tahnoun-owned AI company. Microsoft partnership, developed Falcon LLM. Key to UAE AI strategy.',
  },
  'ADNOC': {
    ko: 'Abu Dhabi National Oil Company. UAE 최대 석유회사, 일산 400만 배럴+.',
    en: 'Abu Dhabi National Oil Company. UAE\'s largest oil company, 4M+ barrels/day.',
  },
  'Masdar': {
    ko: '아부다비 재생에너지 기업. Mubadala 자회사, 신재생 에너지 투자 주도.',
    en: 'Abu Dhabi renewable energy company. Mubadala subsidiary, leads clean energy investment.',
  },
  'VARA': {
    ko: 'Virtual Asset Regulatory Authority. 두바이의 가상자산 규제기관.',
    en: 'Virtual Asset Regulatory Authority. Dubai\'s crypto regulatory body.',
  },
  // Cultural Terms
  'K-Wave': {
    ko: 'UAE에서 한류 열풍. K-Pop, K-Drama, K-Beauty 인기 급상승 중.',
    en: 'Korean Wave in UAE. Rising popularity of K-Pop, K-Drama, K-Beauty.',
  },
  'Halal': {
    ko: '이슬람 율법에 따른 허용 제품/서비스. UAE 시장 진출시 인증 필수.',
    en: 'Products/services compliant with Islamic law. Certification essential for UAE market entry.',
  },
  'Ramadan': {
    ko: '이슬람 금식월. 해 있는 동안 금식. 비즈니스 속도 둔화, 야간 활성화.',
    en: 'Islamic fasting month. Day fasting. Business slows down, evenings become active.',
  },
}

export function GlossaryTooltip({
  term,
  children,
  definition,
  definitionEn,
  locale = 'ko',
}: GlossaryTooltipProps) {
  const { isBeginnerMode } = useBeginnerMode()
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState<'top' | 'bottom'>('top')
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Calculate tooltip position
  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const spaceAbove = rect.top
      const spaceBelow = window.innerHeight - rect.bottom

      // Prefer top, but use bottom if not enough space
      setPosition(spaceAbove > 150 ? 'top' : 'bottom')
    }
  }, [isVisible])

  // If not in beginner mode, just render children
  if (!isBeginnerMode) {
    return <>{children}</>
  }

  const displayDefinition = locale === 'en' && definitionEn ? definitionEn : definition

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex items-center gap-0.5 cursor-help group"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <HelpCircle className="w-3 h-3 text-gold/50 group-hover:text-gold transition-colors" />

      {/* Tooltip */}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 w-64 p-3 rounded-xl bg-bg2 border border-gold/30 shadow-lg shadow-black/30 text-[12px] leading-relaxed animate-fade-in ${
            position === 'top'
              ? 'bottom-full mb-2 left-1/2 -translate-x-1/2'
              : 'top-full mt-2 left-1/2 -translate-x-1/2'
          }`}
        >
          <div className="font-semibold text-gold mb-1">{term}</div>
          <div className="text-t2">{displayDefinition}</div>

          {/* Arrow */}
          <div
            className={`absolute w-3 h-3 bg-bg2 border-gold/30 transform rotate-45 ${
              position === 'top'
                ? 'top-full -mt-1.5 left-1/2 -translate-x-1/2 border-b border-r'
                : 'bottom-full -mb-1.5 left-1/2 -translate-x-1/2 border-t border-l'
            }`}
          />
        </div>
      )}
    </span>
  )
}

// Helper component for auto-detecting glossary terms
interface AutoGlossaryProps {
  readonly text: string
  readonly locale?: 'ko' | 'en'
}

export function AutoGlossary({ text, locale = 'ko' }: AutoGlossaryProps) {
  const { isBeginnerMode } = useBeginnerMode()

  if (!isBeginnerMode) {
    return <>{text}</>
  }

  // Find and wrap glossary terms
  let result: (string | React.ReactElement)[] = [text]

  Object.entries(UAE_GLOSSARY).forEach(([term, definitions]) => {
    const newResult: (string | React.ReactElement)[] = []

    result.forEach((part, idx) => {
      if (typeof part !== 'string') {
        newResult.push(part)
        return
      }

      const regex = new RegExp(`(${term})`, 'gi')
      const parts = part.split(regex)

      parts.forEach((p, i) => {
        if (p.toLowerCase() === term.toLowerCase()) {
          newResult.push(
            <GlossaryTooltip
              key={`${idx}-${i}-${term}`}
              term={term}
              definition={definitions.ko}
              definitionEn={definitions.en}
              locale={locale}
            >
              {p}
            </GlossaryTooltip>
          )
        } else if (p) {
          newResult.push(p)
        }
      })
    })

    result = newResult
  })

  return <>{result}</>
}
