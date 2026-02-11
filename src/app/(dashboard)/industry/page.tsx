'use client'

import { ContextHeader } from '@/components/ui/ContextHeader'
import { EconomyMap } from '@/components/industry/EconomyMap'
import { ClusterGrid } from '@/components/industry/ClusterGrid'
import { sectors as sectorsKo } from '@/data/industry/sectors'
import { sectors as sectorsEn } from '@/data/industry/sectors.en'
import { gdpSectors as gdpSectorsKo, GDP_TOTAL_B } from '@/data/industry/gdp-sectors'
import { gdpSectors as gdpSectorsEn } from '@/data/industry/gdp-sectors.en'
import { clusters as clustersKo } from '@/data/industry/clusters'
import { clusters as clustersEn } from '@/data/industry/clusters.en'
import { useLocale } from '@/hooks/useLocale'
import { useLocalizedData } from '@/hooks/useLocalizedData'

const SECTION_CONTENT = {
  ko: {
    tldr: [
      'GDP $484B 중 석유/가스 24.5%, 비석유 75.5% - 경제 다각화 가속 중',
      'AI/데이터센터 CAGR 28% - G42(Tahnoun)가 UAE AI 전략 주도, Stargate UAE 5GW',
      '관광 $61B → $163B 2033E - 두바이 방문객 1,800만+, MICE/의료관광 확대',
    ],
    investorImplications: [
      '상단 GDP 맵으로 경제 구조 파악 → 하단 클러스터에서 구체적 투자 기회 탐색',
      'IHC/Mubadala/ADIA 지분구조 파악 필수 - 대부분 핵심 산업이 국부펀드 연결',
      '섹터별 라이선스/규제 상이 - 프리존 vs 메인랜드 선택이 진입전략 결정',
    ],
    quickQuestions: [
      { label: 'GDP 구조', query: 'UAE GDP 구성과 비석유 경제 비중은?' },
      { label: 'AI 투자기회', query: 'UAE AI/데이터센터 산업에서 투자 기회는?' },
      { label: '관광 성장', query: 'UAE 관광산업 성장 전망과 투자 기회는?' },
      { label: '한국 기업 진출', query: '한국 기업이 UAE 산업에 진출한 사례와 기회는?' },
    ],
  },
  en: {
    tldr: [
      'GDP $484B: oil/gas 24.5%, non-oil 75.5% — economic diversification accelerating',
      'AI/Data Center CAGR 28% — G42 (Tahnoun) leads UAE AI strategy, Stargate UAE 5GW',
      'Tourism $61B → $163B by 2033E — Dubai 18M+ visitors, MICE/medical tourism expanding',
    ],
    investorImplications: [
      'Use the GDP map above to understand economic structure → explore specific opportunities in clusters below',
      'Understanding IHC/Mubadala/ADIA ownership structure essential — most key industries connected to sovereign wealth',
      'Licensing/regulations differ by sector — Free Zone vs Mainland choice determines entry strategy',
    ],
    quickQuestions: [
      { label: 'GDP Structure', query: 'What is UAE\'s GDP composition and non-oil economy share?' },
      { label: 'AI Opportunities', query: 'What investment opportunities exist in UAE AI/data center industry?' },
      { label: 'Tourism Growth', query: 'What are UAE tourism industry growth prospects and investment opportunities?' },
      { label: 'Korean Companies', query: 'What Korean companies have entered UAE industries and what opportunities exist?' },
    ],
  },
}

export default function IndustryPage() {
  const { t, locale } = useLocale()
  const p = t.pages.industry
  const localSectors = useLocalizedData(sectorsKo, sectorsEn)
  const localGdpSectors = useLocalizedData(gdpSectorsKo, gdpSectorsEn)
  const localClusters = useLocalizedData(clustersKo, clustersEn)
  const content = locale === 'en' ? SECTION_CONTENT.en : SECTION_CONTENT.ko

  return (
    <>
      <ContextHeader
        title={p.title}
        subtitle={p.subtitle}
        tldr={content.tldr}
        investorImplications={content.investorImplications}
        quickQuestions={content.quickQuestions}
        source={{ sourceName: 'FCSC, SCAD, Statista, Mordor Intelligence', asOf: '2024-12', method: 'official' }}
        locale={locale}
      />

      {/* Section 1: Economy Map */}
      <EconomyMap
        sectors={localGdpSectors}
        totalGdpB={GDP_TOTAL_B}
        locale={locale}
      />

      {/* Section 2: Industry Clusters */}
      <ClusterGrid
        clusters={localClusters}
        gdpSectors={localGdpSectors}
        sectors={localSectors}
        locale={locale}
      />
    </>
  )
}
