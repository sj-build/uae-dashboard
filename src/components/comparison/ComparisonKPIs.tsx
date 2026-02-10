'use client'

import { useLocale } from '@/hooks/useLocale'
import { SourceMeta } from '@/components/ui/SourceMeta'

interface KPIItem {
  readonly id: string
  readonly icon: string
  readonly labelKo: string
  readonly labelEn: string
  readonly uaeValue: string
  readonly koreaValue: string
  readonly uaeHighlight?: boolean
  readonly source: string
  readonly asOf: string
}

const KPI_ITEMS: readonly KPIItem[] = [
  {
    id: 'population',
    icon: '👥',
    labelKo: '인구',
    labelEn: 'Population',
    uaeValue: '10.5M',
    koreaValue: '51.7M',
    uaeHighlight: true,
    source: 'UAE Statistics, World Bank',
    asOf: '2024',
  },
  {
    id: 'gdp-per-capita',
    icon: '💰',
    labelKo: '1인당 GDP',
    labelEn: 'GDP per Capita',
    uaeValue: '$49,500',
    koreaValue: '$33,100',
    uaeHighlight: true,
    source: 'IMF WEO',
    asOf: '2024',
  },
  {
    id: 'tax-rate',
    icon: '📊',
    labelKo: '법인세율',
    labelEn: 'Corporate Tax',
    uaeValue: '9%',
    koreaValue: '24%',
    uaeHighlight: true,
    source: 'OECD, UAE Gov',
    asOf: '2024',
  },
  {
    id: 'swf',
    icon: '🏦',
    labelKo: '국부펀드 규모',
    labelEn: 'SWF AUM',
    uaeValue: '$2.5T+',
    koreaValue: '$890B',
    uaeHighlight: true,
    source: 'SWF Institute',
    asOf: '2024',
  },
]

function KPICard({ item, locale }: { readonly item: KPIItem; readonly locale: 'ko' | 'en' }) {
  const label = locale === 'en' ? item.labelEn : item.labelKo

  return (
    <div className="bg-bg3/80 border border-brd/60 rounded-xl p-4 hover:border-gold/30 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{item.icon}</span>
        <span className="text-[12px] font-semibold text-t2">{label}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* UAE */}
        <div className="text-center">
          <div className="text-[10px] text-t4 mb-1">🇦🇪 UAE</div>
          <div className={`text-lg font-bold ${item.uaeHighlight ? 'text-gold' : 'text-t1'}`}>
            {item.uaeValue}
          </div>
        </div>

        {/* Korea */}
        <div className="text-center">
          <div className="text-[10px] text-t4 mb-1">🇰🇷 Korea</div>
          <div className="text-lg font-bold text-t2">
            {item.koreaValue}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-brd/30">
        <SourceMeta
          sourceName={item.source}
          asOf={item.asOf}
          compact
        />
      </div>
    </div>
  )
}

export function ComparisonKPIs() {
  const { locale } = useLocale()

  return (
    <div className="mb-6">
      <div className="text-sm font-bold mb-4 text-gold">
        {locale === 'en' ? '🎯 Key Metrics at a Glance' : '🎯 핵심 지표 한눈에 보기'}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {KPI_ITEMS.map((item) => (
          <KPICard key={item.id} item={item} locale={locale} />
        ))}
      </div>
    </div>
  )
}
