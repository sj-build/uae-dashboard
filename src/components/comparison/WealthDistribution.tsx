'use client'

import { useLocale } from '@/hooks/useLocale'
import { SourceMeta } from '@/components/ui/SourceMeta'

interface DistributionBar {
  readonly label: string
  readonly labelEn: string
  readonly uaePercent: number
  readonly koreaPercent: number
  readonly uaeColor: string
  readonly koreaColor: string
}

// Income distribution by quintile (Top 20%, Next 20%, etc.)
const INCOME_QUINTILES: readonly DistributionBar[] = [
  {
    label: '상위 20%',
    labelEn: 'Top 20%',
    uaePercent: 58,    // UAE top 20% holds ~58% of income
    koreaPercent: 45,  // Korea top 20% holds ~45%
    uaeColor: '#c8a44e',
    koreaColor: '#4a9eff',
  },
  {
    label: '중상위 20%',
    labelEn: 'Upper-Mid 20%',
    uaePercent: 22,
    koreaPercent: 22,
    uaeColor: '#a78bfa',
    koreaColor: '#a78bfa',
  },
  {
    label: '중위 20%',
    labelEn: 'Middle 20%',
    uaePercent: 12,
    koreaPercent: 16,
    uaeColor: '#34d399',
    koreaColor: '#34d399',
  },
  {
    label: '중하위 20%',
    labelEn: 'Lower-Mid 20%',
    uaePercent: 6,
    koreaPercent: 11,
    uaeColor: '#f59e0b',
    koreaColor: '#f59e0b',
  },
  {
    label: '하위 20%',
    labelEn: 'Bottom 20%',
    uaePercent: 2,
    koreaPercent: 6,
    uaeColor: '#ef4444',
    koreaColor: '#ef4444',
  },
]

interface WealthMetric {
  readonly id: string
  readonly icon: string
  readonly labelKo: string
  readonly labelEn: string
  readonly uaeValue: string
  readonly koreaValue: string
  readonly descKo: string
  readonly descEn: string
  readonly highlight?: 'uae' | 'korea'
}

const WEALTH_METRICS: readonly WealthMetric[] = [
  {
    id: 'gini',
    icon: '📊',
    labelKo: '지니계수',
    labelEn: 'Gini Coefficient',
    uaeValue: '0.32',
    koreaValue: '0.31',
    descKo: '소득 불평등 지수 (0=완전평등, 1=완전불평등)',
    descEn: 'Income inequality (0=perfect equality, 1=perfect inequality)',
  },
  {
    id: 'top10-wealth',
    icon: '💎',
    labelKo: '상위 10% 자산 점유율',
    labelEn: 'Top 10% Wealth Share',
    uaeValue: '74%',
    koreaValue: '58%',
    descKo: '상위 10%가 전체 자산의 3/4 보유',
    descEn: 'Top 10% hold 3/4 of total wealth',
    highlight: 'uae',
  },
  {
    id: 'top1-wealth',
    icon: '👑',
    labelKo: '상위 1% 자산 점유율',
    labelEn: 'Top 1% Wealth Share',
    uaeValue: '35%',
    koreaValue: '25%',
    descKo: '왕족/대형 국부펀드 집중',
    descEn: 'Royal family / Major SWF concentration',
    highlight: 'uae',
  },
  {
    id: 'median-wealth',
    icon: '💰',
    labelKo: '중위 자산 (성인 1인)',
    labelEn: 'Median Wealth (per adult)',
    uaeValue: '$35,000',
    koreaValue: '$93,000',
    descKo: '한국 중산층이 실질적으로 더 부유',
    descEn: 'Korean middle class is wealthier in practice',
    highlight: 'korea',
  },
  {
    id: 'millionaires',
    icon: '🏆',
    labelKo: '백만장자 수',
    labelEn: 'Millionaires',
    uaeValue: '116,000',
    koreaValue: '1,315,000',
    descKo: 'UAE 인구 대비 비율은 더 높음 (1.1% vs 2.5%)',
    descEn: 'UAE ratio higher per capita (1.1% vs 2.5%)',
  },
]

interface InsightItem {
  readonly ko: string
  readonly en: string
  readonly icon: string
}

const INSIGHTS: readonly InsightItem[] = [
  {
    ko: 'UAE는 왕족+국부펀드 중심의 극도로 집중된 부의 구조',
    en: 'UAE has extremely concentrated wealth around royal family + SWFs',
    icon: '👑',
  },
  {
    ko: '외국인 노동자 88%는 저임금 - 자국민과 부의 격차 극심',
    en: '88% expat workers are low-wage - extreme gap with nationals',
    icon: '⚠️',
  },
  {
    ko: '에미라티 자국민에게만 복지/보조금 지급 (주거, 교육, 의료)',
    en: 'Only Emirati nationals receive welfare/subsidies (housing, education, healthcare)',
    icon: '🏠',
  },
  {
    ko: '비즈니스 타겟: 상위 10% 고소득층 or 88% 외국인 대중시장',
    en: 'Business target: Top 10% affluent or 88% expat mass market',
    icon: '🎯',
  },
]

function QuintileChart({ locale }: { readonly locale: 'ko' | 'en' }) {
  return (
    <div className="bg-bg2 rounded-xl p-4 border border-brd/40">
      <div className="text-[12px] font-semibold text-t2 mb-4">
        {locale === 'en' ? '📈 Income Distribution by Quintile' : '📈 소득 5분위 분포'}
      </div>
      <div className="space-y-3">
        {INCOME_QUINTILES.map((q) => (
          <div key={q.label} className="space-y-1">
            <div className="flex justify-between text-[10px] text-t3">
              <span>{locale === 'en' ? q.labelEn : q.label}</span>
              <span className="flex gap-3">
                <span className="text-gold">🇦🇪 {q.uaePercent}%</span>
                <span className="text-[#4a9eff]">🇰🇷 {q.koreaPercent}%</span>
              </span>
            </div>
            <div className="flex gap-1 h-3">
              <div
                className="rounded-l-sm transition-all"
                style={{
                  width: `${q.uaePercent}%`,
                  backgroundColor: q.uaeColor,
                  opacity: 0.8,
                }}
              />
              <div
                className="rounded-r-sm transition-all"
                style={{
                  width: `${q.koreaPercent}%`,
                  backgroundColor: '#4a9eff',
                  opacity: 0.5,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-brd/30 text-[10px] text-t4">
        {locale === 'en'
          ? '💡 UAE top 20% holds 58% of income vs Korea 45% - more concentrated'
          : '💡 UAE 상위 20%가 소득 58% 점유 vs 한국 45% - 더 집중됨'}
      </div>
    </div>
  )
}

function MetricCard({ metric, locale }: { readonly metric: WealthMetric; readonly locale: 'ko' | 'en' }) {
  return (
    <div className="bg-bg2 rounded-xl p-4 border border-brd/40 hover:border-gold/30 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{metric.icon}</span>
        <span className="text-[11px] font-semibold text-t2">
          {locale === 'en' ? metric.labelEn : metric.labelKo}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-2">
        <div className="text-center">
          <div className="text-[9px] text-t4 mb-1">🇦🇪 UAE</div>
          <div className={`text-lg font-bold ${metric.highlight === 'uae' ? 'text-gold' : 'text-t1'}`}>
            {metric.uaeValue}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[9px] text-t4 mb-1">🇰🇷 Korea</div>
          <div className={`text-lg font-bold ${metric.highlight === 'korea' ? 'text-[#4a9eff]' : 'text-t2'}`}>
            {metric.koreaValue}
          </div>
        </div>
      </div>
      <div className="text-[10px] text-t4 text-center">
        {locale === 'en' ? metric.descEn : metric.descKo}
      </div>
    </div>
  )
}

export function WealthDistribution() {
  const { locale } = useLocale()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-gold">
          {locale === 'en' ? '💎 Income & Wealth Distribution Comparison' : '💎 소득 및 자산 분포 비교'}
        </div>
        <SourceMeta
          sourceName="World Inequality Database, Credit Suisse"
          asOf="2023"
          method="estimate"
          compact
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Quintile Chart */}
        <QuintileChart locale={locale} />

        {/* Right: Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {WEALTH_METRICS.slice(0, 4).map((metric) => (
            <MetricCard key={metric.id} metric={metric} locale={locale} />
          ))}
        </div>
      </div>

      {/* Bottom: Additional metric + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MetricCard metric={WEALTH_METRICS[4]} locale={locale} />

        {/* Insights */}
        <div className="lg:col-span-2 bg-bg3/50 rounded-xl p-4 border border-gold/20">
          <div className="text-[11px] font-semibold text-gold mb-3">
            {locale === 'en' ? '💡 Key Insights for Investors' : '💡 투자자를 위한 핵심 인사이트'}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {INSIGHTS.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-t2">
                <span>{insight.icon}</span>
                <span>{locale === 'en' ? insight.en : insight.ko}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
