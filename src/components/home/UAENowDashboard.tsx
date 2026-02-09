'use client'

import Link from 'next/link'
import { ArrowRight, Zap, TrendingUp, Clock, AlertTriangle } from 'lucide-react'
import { useLocale } from '@/hooks/useLocale'
import { macroRisks as macroRisksKo } from '@/data/overview/macro-risks'
import { macroRisks as macroRisksEn } from '@/data/overview/macro-risks.en'
import { useLocalizedData } from '@/hooks/useLocalizedData'
import { SourceMeta } from '@/components/ui/SourceMeta'

interface StrategicPillar {
  readonly id: string
  readonly icon: string
  readonly nameKo: string
  readonly nameEn: string
  readonly headlineKo: string
  readonly headlineEn: string
  readonly subheadlineKo: string
  readonly subheadlineEn: string
  readonly investment: string
  readonly status: 'launching' | 'accelerating' | 'active'
  readonly color: string
  readonly href: string
  readonly badge?: string
}

// 6대 기회 섹터
const OPPORTUNITY_PILLARS: readonly StrategicPillar[] = [
  // B2B / Industrial
  {
    id: 'ai-tech',
    icon: '🧠',
    nameKo: 'AI & 데이터센터',
    nameEn: 'AI & Data Centers',
    headlineKo: 'Stargate UAE 5GW 캠퍼스',
    headlineEn: 'Stargate UAE 5GW Campus',
    subheadlineKo: 'Microsoft $15B, G42/MGX 주도',
    subheadlineEn: 'Microsoft $15B, G42/MGX-led',
    investment: '$20B+',
    status: 'accelerating',
    color: '#a78bfa',
    href: '/economy',
    badge: 'HOT',
  },
  {
    id: 'real-estate',
    icon: '🏗️',
    nameKo: '부동산 & 건설',
    nameEn: 'Real Estate & Construction',
    headlineKo: '2025 거래액 $280B',
    headlineEn: '2025 Transactions $280B',
    subheadlineKo: 'Dubai $207B (+36% YoY)',
    subheadlineEn: 'Dubai $207B (+36% YoY)',
    investment: '$243B+',
    status: 'accelerating',
    color: '#f97316',
    href: '/economy',
    badge: 'HOT',
  },
  {
    id: 'energy',
    icon: '⚡',
    nameKo: '에너지 & 탈탄소',
    nameEn: 'Energy & Net Zero',
    headlineKo: 'Barakah 원전 + XRG 출범',
    headlineEn: 'Barakah Nuclear + XRG Launch',
    subheadlineKo: 'KEPCO 5.6GW, 2050 탄소중립',
    subheadlineEn: 'KEPCO 5.6GW, 2050 Net Zero',
    investment: '$80B+',
    status: 'active',
    color: '#f59e0b',
    href: '/economy',
  },
  {
    id: 'finance',
    icon: '💰',
    nameKo: '금융 & 크립토',
    nameEn: 'Finance & Crypto',
    headlineKo: 'VARA 크립토 허브 + SWF',
    headlineEn: 'VARA Crypto Hub + SWF',
    subheadlineKo: 'ADGM/DIFC 금융센터, $2T+ 운용',
    subheadlineEn: 'ADGM/DIFC Financial Center, $2T+ AUM',
    investment: '$2T+ SWF',
    status: 'accelerating',
    color: '#22d3ee',
    href: '/economy',
  },
  // B2C / Consumer
  {
    id: 'tourism-entertainment',
    icon: '✈️',
    nameKo: '관광 & 엔터테인먼트',
    nameEn: 'Tourism & Entertainment',
    headlineKo: 'Dubai 1,872만 관광객 + 카지노',
    headlineEn: 'Dubai 18.7M Tourists + Casino',
    subheadlineKo: 'Wynn 2026, Guggenheim, $61B 관광수입',
    subheadlineEn: 'Wynn 2026, Guggenheim, $61B revenue',
    investment: '$70B+',
    status: 'launching',
    color: '#ef4444',
    href: '/society',
    badge: 'NEW',
  },
  {
    id: 'consumer',
    icon: '🛍️',
    nameKo: '소비재 & K-Wave',
    nameEn: 'Consumer & K-Wave',
    headlineKo: 'K-Beauty 수출 +69.7% 성장',
    headlineEn: 'K-Beauty Exports +69.7% Growth',
    subheadlineKo: 'UAE 수출 8위, 20억 할랄 시장',
    subheadlineEn: 'UAE #8 Export Dest, 2B Halal Market',
    investment: '$15B+',
    status: 'accelerating',
    color: '#34d399',
    href: '/industry',
  },
]

function StatusBadge({ status, locale }: { readonly status: 'launching' | 'accelerating' | 'active'; readonly locale: string }) {
  const labels = {
    launching: { ko: '론칭', en: 'Launch', icon: <Zap className="w-3 h-3" /> },
    accelerating: { ko: '가속', en: 'Accel', icon: <TrendingUp className="w-3 h-3" /> },
    active: { ko: '진행', en: 'Active', icon: <Clock className="w-3 h-3" /> },
  }

  const colors = {
    launching: 'bg-rose-500/15 text-rose-400',
    accelerating: 'bg-purple-500/15 text-purple-400',
    active: 'bg-emerald-500/15 text-emerald-400',
  }

  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${colors[status]}`}>
      {labels[status].icon}
      {locale === 'en' ? labels[status].en : labels[status].ko}
    </span>
  )
}

function PillarCard({ pillar, locale }: { readonly pillar: StrategicPillar; readonly locale: string }) {
  const name = locale === 'en' ? pillar.nameEn : pillar.nameKo
  const headline = locale === 'en' ? pillar.headlineEn : pillar.headlineKo
  const subheadline = locale === 'en' ? pillar.subheadlineEn : pillar.subheadlineKo

  return (
    <Link
      href={pillar.href}
      className="group relative bg-bg3/80 hover:bg-bg2 border border-brd/60 hover:border-gold/40 rounded-lg overflow-hidden transition-all duration-200"
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ backgroundColor: pillar.color }}
      />

      {/* Badge */}
      {pillar.badge && (
        <div
          className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold text-white tracking-wide"
          style={{ backgroundColor: pillar.color }}
        >
          {pillar.badge}
        </div>
      )}

      <div className="p-4 pl-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{pillar.icon}</span>
          <span className="text-[13px] font-bold tracking-tight" style={{ color: pillar.color }}>
            {name}
          </span>
          <StatusBadge status={pillar.status} locale={locale} />
        </div>

        {/* Headline */}
        <div className="mb-3">
          <div className="text-[14px] font-medium text-t1 leading-snug group-hover:text-gold transition-colors">
            {headline}
          </div>
          <div className="text-[12px] text-t4 mt-1">
            {subheadline}
          </div>
        </div>

        {/* Investment */}
        <div className="flex items-center justify-between pt-2 border-t border-brd/40">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] text-t4 uppercase tracking-wide">
              {locale === 'en' ? 'Inv.' : '투자'}
            </span>
            <span className="font-bold text-[14px]" style={{ color: pillar.color }}>{pillar.investment}</span>
          </div>
          <ArrowRight className="w-4 h-4 text-t4 group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  )
}

interface KeyIssue {
  readonly icon: string
  readonly labelKo: string
  readonly labelEn: string
  readonly line1Ko: string
  readonly line1En: string
  readonly line2Ko: string
  readonly line2En: string
  readonly line3Ko: string
  readonly line3En: string
  readonly tagKo: string
  readonly tagEn: string
  readonly color: string
  readonly href: string
}

const KEY_ISSUES: readonly KeyIssue[] = [
  {
    icon: '🏛️',
    labelKo: '정치',
    labelEn: 'Politics',
    line1Ko: '트럼프 방문 $200B 딜 체결, UAE-사우디 예멘 입장 갈등 표면화',
    line1En: 'Trump visit secures $200B deals, UAE-Saudi Yemen policy clash surfaces',
    line2Ko: '이란과 화해 진행 중, 미국-중국 사이 균형 외교 강화',
    line2En: 'Iran rapprochement ongoing, balanced diplomacy between US-China',
    line3Ko: '왕세자 MBZ 주도의 실용주의 외교, 지역 패권 경쟁 가열',
    line3En: 'Crown Prince MBZ leads pragmatic diplomacy, regional power competition intensifies',
    tagKo: '외교 재편',
    tagEn: 'Diplomacy',
    color: '#ef4444',
    href: '/politics',
  },
  {
    icon: '💰',
    labelKo: '경제',
    labelEn: 'Economy',
    line1Ko: '주식시장 $1.06T (+7%), 부동산 거래 $243B (+36% YoY) 기록',
    line1En: 'Stock market $1.06T (+7%), Real estate $243B (+36% YoY) record',
    line2Ko: 'SWF 총 $2T+ 운용, AI/데이터센터 $20B+ 투자 가속',
    line2En: 'SWF manages $2T+, AI/Data center $20B+ investment accelerating',
    line3Ko: '비석유 GDP 비중 70% 돌파, 탈석유 경제 전환 순항',
    line3En: 'Non-oil GDP exceeds 70%, post-oil economic transition on track',
    tagKo: '자산 급등',
    tagEn: 'Asset Boom',
    color: '#c8a44e',
    href: '/economy',
  },
  {
    icon: '🎭',
    labelKo: '사회/문화',
    labelEn: 'Society',
    line1Ko: 'Wynn 카지노 2026 오픈 예정, Guggenheim 아부다비 2026 개관',
    line1En: 'Wynn Casino opening 2026, Guggenheim Abu Dhabi opens 2026',
    line2Ko: '주류/도박 규제 완화, 외국인 거주 비자 확대로 사회 자유화 가속',
    line2En: 'Alcohol/gambling deregulation, expanded resident visas drive social liberalization',
    line3Ko: 'K-Pop, K-Beauty 열풍 지속, 한류 콘텐츠 소비 급증',
    line3En: 'K-Pop, K-Beauty fever continues, Korean content consumption surging',
    tagKo: '개방 가속',
    tagEn: 'Opening Up',
    color: '#34d399',
    href: '/society',
  },
]

function KeyIssuesSummary({ locale }: { readonly locale: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {KEY_ISSUES.map((issue) => (
        <div
          key={issue.labelKo}
          className="bg-bg3/80 border border-brd/60 rounded-lg p-4 hover:border-gold/40 transition-colors flex flex-col"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{issue.icon}</span>
            <span className="text-sm font-bold tracking-tight" style={{ color: issue.color }}>
              {locale === 'en' ? issue.labelEn : issue.labelKo}
            </span>
            <span
              className="ml-auto px-2 py-0.5 text-[10px] font-semibold rounded tracking-wide uppercase"
              style={{ backgroundColor: `${issue.color}15`, color: issue.color }}
            >
              {locale === 'en' ? issue.tagEn : issue.tagKo}
            </span>
          </div>
          <div className="space-y-1.5 flex-1">
            <p className="text-[13px] text-t2 leading-relaxed">
              • {locale === 'en' ? issue.line1En : issue.line1Ko}
            </p>
            <p className="text-[13px] text-t3 leading-relaxed">
              • {locale === 'en' ? issue.line2En : issue.line2Ko}
            </p>
            <p className="text-[13px] text-t4 leading-relaxed">
              • {locale === 'en' ? issue.line3En : issue.line3Ko}
            </p>
          </div>
          <div className="flex justify-end mt-3 pt-2 border-t border-brd/30">
            <Link
              href={issue.href}
              className="inline-flex items-center gap-1 text-[11px] text-t4 hover:text-t2 transition-colors"
            >
              {locale === 'en' ? 'Learn more' : '더보기'}
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}

function RiskSection({ locale }: { readonly locale: string }) {
  const macroRisks = useLocalizedData(macroRisksKo, macroRisksEn)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {macroRisks.map((risk) => (
        <div
          key={risk.title}
          className="flex items-start gap-3 p-3 bg-bg3/60 rounded-lg border border-brd/40"
          style={{ borderLeftWidth: '3px', borderLeftColor: risk.borderColor }}
        >
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[13px] mb-0.5" style={{ color: risk.titleColor }}>{risk.title}</div>
            <div className="text-[12px] text-t3 leading-snug truncate-2">{risk.summary}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Export individual sections for flexible composition in home page

export function UAENowSection() {
  const { locale } = useLocale()

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🇦🇪</span>
          <h2 className="text-lg font-bold text-t1 tracking-tight">UAE Now</h2>
          <span className="text-sm text-t4 ml-1">
            {locale === 'en' ? 'Key Issues at a Glance' : '한눈에 보는 핵심 이슈'}
          </span>
        </div>
        <SourceMeta
          sourceName="Dashboard Analysis"
          asOf="2025-02"
          method="aggregated"
          compact
        />
      </div>
      <KeyIssuesSummary locale={locale} />
    </section>
  )
}

export function UAEOpportunitiesSection() {
  const { locale } = useLocale()

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          <h2 className="text-lg font-bold text-t1 tracking-tight">
            {locale === 'en' ? 'UAE Opportunities' : 'UAE 기회'}
          </h2>
          <span className="text-sm text-t4 ml-1">
            {locale === 'en' ? 'Investment & Growth Sectors' : '투자 및 성장 섹터'}
          </span>
        </div>
        <SourceMeta
          sourceName="Multiple Sources"
          asOf="2025-01"
          method="aggregated"
          compact
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {OPPORTUNITY_PILLARS.map((pillar) => (
          <PillarCard key={pillar.id} pillar={pillar} locale={locale} />
        ))}
      </div>
    </section>
  )
}

export function UAERisksSection() {
  const { locale } = useLocale()

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-accent-red" />
          <h2 className="text-lg font-bold text-t1 tracking-tight">
            {locale === 'en' ? 'UAE Risks' : 'UAE 리스크'}
          </h2>
          <span className="text-sm text-t4 ml-1">
            {locale === 'en' ? 'Macro Risk Factors' : '거시 리스크 요인'}
          </span>
        </div>
        <SourceMeta
          sourceName="Risk Analysis"
          asOf="2025-02"
          method="computed"
          compact
        />
      </div>
      <RiskSection locale={locale} />
    </section>
  )
}

// Keep the combined dashboard for backward compatibility
export function UAENowDashboard() {
  return (
    <div className="space-y-0">
      <UAENowSection />
      <UAEOpportunitiesSection />
      <UAERisksSection />
    </div>
  )
}

// Compact summary card for home page (3 opportunities + 3 risks)
const TOP_OPPORTUNITIES = [
  { text: 'AI 데이터센터 투자 붐 (Stargate $20B+, G42/MGX)', textEn: 'AI Data Center Investment Boom (Stargate $20B+, G42/MGX)', href: '/economy' },
  { text: '국부펀드 한국 투자 확대 (무바달라, ADIA)', textEn: 'SWF Korea Investment Expansion (Mubadala, ADIA)', href: '/comparison' },
  { text: 'K-Beauty 중동 수출 +69.7% 성장', textEn: 'K-Beauty Middle East Exports +69.7% Growth', href: '/industry' },
]

const TOP_RISKS = [
  { text: '미중 갈등 속 기술 이전 규제 리스크', textEn: 'Tech Transfer Restrictions Amid US-China Tensions', href: '/politics' },
  { text: '부동산 공급과잉 및 가격 조정 우려', textEn: 'Real Estate Oversupply & Price Correction Concerns', href: '/economy' },
  { text: '에미라티화 고용 의무 강화 (50인↑ 기업)', textEn: 'Emiratization Hiring Requirements (50+ employees)', href: '/legal' },
]

export function OpportunityRiskSummary() {
  const { locale } = useLocale()

  return (
    <section className="mb-6">
      <div className="bg-bg3/60 border border-brd/50 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-brd/40 bg-bg2/50">
          <div className="flex items-center gap-2">
            <span className="text-lg">💡</span>
            <h2 className="text-[15px] font-bold text-t1">
              {locale === 'en' ? 'Opportunities & Risks' : '기회 & 리스크'}
            </h2>
          </div>
          <Link
            href="/economy"
            className="text-[11px] text-t4 hover:text-gold transition-colors flex items-center gap-1"
          >
            {locale === 'en' ? 'Details' : '자세히'} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-brd/40">
          {/* Opportunities */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-[13px] font-semibold text-emerald-400">
                {locale === 'en' ? 'Opportunities' : '기회'}
              </span>
            </div>
            <ul className="space-y-2">
              {TOP_OPPORTUNITIES.map((item, i) => (
                <li key={i}>
                  <Link
                    href={item.href}
                    className="flex items-start gap-2 text-[13px] text-t2 hover:text-gold transition-colors group"
                  >
                    <span className="text-emerald-400/70 mt-0.5">•</span>
                    <span className="group-hover:underline underline-offset-2">
                      {locale === 'en' ? item.textEn : item.text}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Risks */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span className="text-[13px] font-semibold text-rose-400">
                {locale === 'en' ? 'Risks' : '리스크'}
              </span>
            </div>
            <ul className="space-y-2">
              {TOP_RISKS.map((item, i) => (
                <li key={i}>
                  <Link
                    href={item.href}
                    className="flex items-start gap-2 text-[13px] text-t2 hover:text-gold transition-colors group"
                  >
                    <span className="text-rose-400/70 mt-0.5">•</span>
                    <span className="group-hover:underline underline-offset-2">
                      {locale === 'en' ? item.textEn : item.text}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
