'use client'

import { populationGroups as populationGroupsKo, ageGroups as ageGroupsKo, demographicInsights as demographicInsightsKo, businessImplications as businessImplicationsKo } from '@/data/overview/population'
import { populationGroups as populationGroupsEn, ageGroups as ageGroupsEn, demographicInsights as demographicInsightsEn, businessImplications as businessImplicationsEn } from '@/data/overview/population.en'
import { useLocalizedData } from '@/hooks/useLocalizedData'
import { useLocale } from '@/hooks/useLocale'
import { WealthDistribution } from '@/components/comparison/WealthDistribution'

export function PopulationDemographics() {
  const populationGroups = useLocalizedData(populationGroupsKo, populationGroupsEn)
  const ageGroups = useLocalizedData(ageGroupsKo, ageGroupsEn)
  const demographicInsights = useLocalizedData(demographicInsightsKo, demographicInsightsEn)
  const businessImplications = useLocalizedData(businessImplicationsKo, businessImplicationsEn)
  const { t } = useLocale()

  return (
    <div className="space-y-6">
      {/* Population Demographics */}
      <div className="bg-bg3 border border-brd rounded-xl p-6 overflow-x-auto">
        <h3 className="font-display text-lg text-gold mb-4">{`👥 ${t.pages.comparison.populationHeader}`}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
          <div>
            <div className="text-[13px] font-bold mb-3 text-t1">{t.pages.comparison.populationByNationality}</div>
            <div className="flex flex-col gap-2">
              {populationGroups.map((group) => (
                <div key={group.label} className="flex items-center gap-2 text-xs">
                  <div className={`w-[90px] font-semibold ${group.bold ? 'font-bold text-gold' : ''}`}>
                    {group.flag} {group.label}
                  </div>
                  <div className="flex-1 h-[22px] bg-bg rounded overflow-hidden">
                    <div
                      className="h-full rounded flex items-center pl-2 text-[10px] font-bold text-black"
                      style={{ width: `${group.percentage}%`, background: group.color }}
                    >
                      {group.percentage >= 5 ? `${group.percentage}%` : ''}
                    </div>
                  </div>
                  <div className={`w-[55px] text-right text-[11px] ${group.bold ? 'text-gold font-semibold' : 'text-t3'}`}>
                    {group.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[13px] font-bold mb-3 text-t1">{t.pages.comparison.populationByAge}</div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {ageGroups.map((group) => (
                <div key={group.label} className="bg-bg rounded-lg p-3 text-center">
                  <div className="text-[10px] text-t4 mb-0.5">{group.label}</div>
                  <div className="font-display text-[22px] font-bold" style={{ color: group.color }}>
                    {group.percentage}
                  </div>
                  <div className="text-[10px] text-t3">{group.count}</div>
                </div>
              ))}
            </div>
            <div className="text-xs text-t2 leading-relaxed">
              {demographicInsights.map((insight, i) => (
                <div key={i} dangerouslySetInnerHTML={{ __html: `<b class="text-t1">${insight.split(':')[0]}:</b>${insight.split(':').slice(1).join(':')}` }} />
              ))}
              <br />
              <span className="text-gold font-semibold">{`💡 ${t.pages.comparison.businessImplication}:`}</span><br />
              {businessImplications.map((item, i) => (
                <span key={i}>• {item}<br /></span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Wealth Distribution */}
      <div className="bg-bg3 border border-brd rounded-xl p-6">
        <WealthDistribution />
      </div>
    </div>
  )
}
