'use client'

import { ContextHeader } from '@/components/ui/ContextHeader'
import { SectorGrid } from '@/components/industry/SectorGrid'
import { sectors as sectorsKo } from '@/data/industry/sectors'
import { sectors as sectorsEn } from '@/data/industry/sectors.en'
import { useLocale } from '@/hooks/useLocale'
import { useLocalizedData } from '@/hooks/useLocalizedData'

const SECTION_CONTENT = {
  ko: {
    tldr: [
      'AI/데이터센터 CAGR 28% - G42(Tahnoun)가 UAE AI 전략 주도, Falcon LLM 개발',
      '크립토 허브 부상 - VARA(두바이), ADGM(아부다비) 글로벌 규제 선도, Binance 본사 유치',
      '관광/부동산 호황 - 2024 방문객 2,900만+, 두바이 부동산 외국인 투자 $20B+',
    ],
    investorImplications: [
      'IHC/Mubadala/ADIA 지분구조 파악 필수 - 대부분 핵심 산업이 국부펀드 연결',
      '섹터별 라이선스/규제 상이 - 프리존 vs 메인랜드 선택이 진입전략 결정',
    ],
    quickQuestions: [
      { label: 'G42 현황', query: 'G42의 사업 영역과 주요 파트너십 현황은?' },
      { label: 'AI 투자기회', query: 'UAE AI/데이터센터 산업에서 투자 기회는?' },
      { label: '크립토 규제', query: 'UAE 가상자산 규제와 라이선스 취득 방법은?' },
      { label: '한국 기업 진출', query: '한국 기업이 UAE 산업에 진출한 사례와 기회는?' },
    ],
  },
  en: {
    tldr: [
      'AI/Data Center CAGR 28% - G42 (Tahnoun) leads UAE AI strategy, developed Falcon LLM',
      'Crypto hub rising - VARA (Dubai), ADGM (Abu Dhabi) lead global regulation, Binance HQ',
      'Tourism/Real Estate boom - 2024 visitors 29M+, Dubai foreign real estate investment $20B+',
    ],
    investorImplications: [
      'Understanding IHC/Mubadala/ADIA ownership structure essential - most key industries connected to sovereign wealth',
      'Licensing/regulations differ by sector - Free Zone vs Mainland choice determines entry strategy',
    ],
    quickQuestions: [
      { label: 'G42 Overview', query: 'What are G42\'s business areas and key partnerships?' },
      { label: 'AI Opportunities', query: 'What investment opportunities exist in UAE AI/data center industry?' },
      { label: 'Crypto Regulation', query: 'What are UAE\'s crypto regulations and how to get licensed?' },
      { label: 'Korean Companies', query: 'What Korean companies have entered UAE industries and what opportunities exist?' },
    ],
  },
}

export default function IndustryPage() {
  const { t, locale } = useLocale()
  const p = t.pages.industry
  const localSectors = useLocalizedData(sectorsKo, sectorsEn)
  const content = locale === 'en' ? SECTION_CONTENT.en : SECTION_CONTENT.ko

  return (
    <>
      <ContextHeader
        title={p.title}
        subtitle={p.subtitle}
        tldr={content.tldr}
        investorImplications={content.investorImplications}
        quickQuestions={content.quickQuestions}
        source={{ sourceName: 'Statista, Mordor Intelligence, UAE Gov', asOf: '2024-12', method: 'official' }}
        locale={locale}
      />

      <SectorGrid sectors={localSectors} />
    </>
  )
}
