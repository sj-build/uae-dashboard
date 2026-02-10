'use client'

import { useState, Fragment } from 'react'
import { ChevronDown, Lightbulb } from 'lucide-react'
import { comparisonStats as comparisonStatsKo } from '@/data/overview/comparison-stats'
import { comparisonStats as comparisonStatsEn } from '@/data/overview/comparison-stats.en'
import { useLocalizedData } from '@/hooks/useLocalizedData'
import { useLocale } from '@/hooks/useLocale'
import { SourceMeta } from '@/components/ui/SourceMeta'

export function StatsComparisonTable() {
  const comparisonStats = useLocalizedData(comparisonStatsKo, comparisonStatsEn)
  const { t, locale } = useLocale()
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (indicator: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(indicator)) {
        next.delete(indicator)
      } else {
        next.add(indicator)
      }
      return next
    })
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-bold text-gold">{`📊 ${t.pages.comparison.statsHeader}`}</div>
        <SourceMeta
          sourceName="World Bank, IMF, UAE Gov"
          asOf="2024"
          method="aggregated"
          compact
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-2.5 px-3.5 text-left bg-bg3 text-t3 font-semibold text-[11px] uppercase tracking-wider border-b border-brd w-[200px]">{t.pages.comparison.tableIndicator}</th>
              <th className="p-2.5 px-3.5 text-left bg-bg3 text-t3 font-semibold text-[11px] uppercase tracking-wider border-b border-brd">🇦🇪 UAE</th>
              <th className="p-2.5 px-3.5 text-left bg-bg3 text-t3 font-semibold text-[11px] uppercase tracking-wider border-b border-brd">🇰🇷 {t.pages.comparison.korea}</th>
              <th className="p-2.5 px-3.5 text-left bg-bg3 text-t3 font-semibold text-[11px] uppercase tracking-wider border-b border-brd">{t.pages.comparison.tableNote}</th>
            </tr>
          </thead>
          <tbody>
            {comparisonStats.map((row) => {
              const isExpanded = expandedRows.has(row.indicator)
              const hasInsight = Boolean(row.whyItMatters)

              return (
                <Fragment key={row.indicator}>
                  <tr className="hover:[&_td]:bg-bg3 group">
                    <td className="p-2.5 px-3.5 border-b border-brd/40 font-bold">
                      <div className="flex items-center gap-2">
                        {row.indicator}
                        {hasInsight && (
                          <button
                            onClick={() => toggleRow(row.indicator)}
                            className="p-1 rounded-md text-gold/60 hover:text-gold hover:bg-gold/10 transition-colors"
                            title={locale === 'en' ? 'Why it matters?' : '왜 중요한가?'}
                          >
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className={`p-2.5 px-3.5 border-b border-brd/40 ${row.uaeHighlight ? 'text-gold font-mono' : ''}`}>
                      {row.uae}
                    </td>
                    <td className="p-2.5 px-3.5 border-b border-brd/40 font-mono">{row.korea}</td>
                    <td className="p-2.5 px-3.5 border-b border-brd/40">{row.note}</td>
                  </tr>
                  {isExpanded && hasInsight && (
                    <tr className="bg-gold/5">
                      <td colSpan={4} className="p-3 px-4 border-b border-brd/40">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-[10px] text-gold font-semibold mb-1 uppercase tracking-wide">
                              {locale === 'en' ? 'Why it matters' : '왜 중요한가?'}
                            </div>
                            <div className="text-[12px] text-t2 leading-relaxed">
                              {row.whyItMatters}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
