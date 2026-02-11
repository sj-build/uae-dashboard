'use client'

import { useState } from 'react'
import type { GdpSector } from '@/types/sector'

interface EconomyMapProps {
  readonly sectors: readonly GdpSector[]
  readonly totalGdpB: number
  readonly locale?: 'ko' | 'en'
}

function KpiBar({
  label,
  value,
  color,
}: {
  readonly label: string
  readonly value: number
  readonly color: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-[11px] text-t3 shrink-0">{label}</span>
      <div className="flex-1 h-5 bg-bg/60 rounded overflow-hidden">
        <div
          className="h-full rounded transition-all duration-500 ease-out"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-12 text-[12px] font-semibold text-t1 text-right">{value}%</span>
    </div>
  )
}

// CSS Grid treemap layout: hand-tuned for 9 sectors
// Row 1: oil-gas (24.5) | wholesale (16.5) | manufacturing (15)
// Row 2: finance (12.5) | construction (11.6) | accommodation (9)
// Row 3: transport (6) | ict (3) | public (2)
const GRID_LAYOUT: Record<string, string> = {
  'oil-gas':              'col-span-4 row-span-2 md:col-start-1 md:row-start-1',
  'wholesale-retail':     'col-span-3 row-span-1 md:col-start-5 md:row-start-1',
  'manufacturing':        'col-span-3 row-span-1 md:col-start-8 md:row-start-1',
  'finance-insurance':    'col-span-3 row-span-1 md:col-start-5 md:row-start-2',
  'construction':         'col-span-3 row-span-1 md:col-start-8 md:row-start-2',
  'accommodation-food':   'col-span-4 row-span-1 md:col-start-1 md:row-start-3',
  'transport-logistics':  'col-span-3 row-span-1 md:col-start-5 md:row-start-3',
  'ict':                  'col-span-2 row-span-1 md:col-start-8 md:row-start-3',
  'public-defense':       'col-span-1 row-span-1 md:col-start-10 md:row-start-3',
}

function TreemapCell({
  sector,
  isSelected,
  onSelect,
}: {
  readonly sector: GdpSector
  readonly isSelected: boolean
  readonly onSelect: () => void
}) {
  const gridClass = GRID_LAYOUT[sector.id] ?? ''

  return (
    <button
      onClick={onSelect}
      aria-label={`${sector.name}: $${sector.gdpValueB}B, ${sector.gdpSharePct}% GDP`}
      className={`relative p-3 rounded-lg border transition-all duration-300 cursor-pointer text-left overflow-hidden group ${gridClass} ${
        isSelected
          ? 'border-t1/40 shadow-[0_0_20px_rgba(200,164,78,0.15)] scale-[1.02] z-10'
          : 'border-transparent hover:border-t4/30'
      }`}
      style={{
        backgroundColor: isSelected
          ? `${sector.color}25`
          : `${sector.color}12`,
      }}
    >
      <div className="flex flex-col h-full justify-between min-h-[60px]">
        <div>
          <span className="text-base">{sector.icon}</span>
          <span className="text-[11px] font-semibold text-t1 ml-1.5">{sector.name}</span>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-[18px] font-black" style={{ color: sector.color }}>${sector.gdpValueB}B</span>
          <span className="text-[10px] text-t4">{sector.gdpSharePct}%</span>
        </div>
      </div>
    </button>
  )
}

function KpiPanel({
  sector,
  locale,
}: {
  readonly sector: GdpSector
  readonly locale: 'ko' | 'en'
}) {
  const isEn = locale === 'en'

  return (
    <div className="mt-4 p-5 rounded-xl bg-bg3/80 border border-brd/50 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xl">{sector.icon}</span>
        <div>
          <h3 className="text-[15px] font-bold text-t1">{sector.name}</h3>
          <p className="text-[11px] text-t3 mt-0.5 leading-relaxed">{sector.description}</p>
        </div>
      </div>

      <div className="space-y-2.5">
        <KpiBar
          label={isEn ? 'GDP Share' : 'GDP 비중'}
          value={sector.gdpSharePct}
          color="#c8a44e"
        />
        <KpiBar
          label={isEn ? 'Employment' : '고용 비중'}
          value={sector.employmentSharePct}
          color="#22d3ee"
        />
        <KpiBar
          label={isEn ? 'Exports' : '수출 비중'}
          value={sector.exportSharePct}
          color="#34d399"
        />
      </div>

      <div className="mt-3 pt-3 border-t border-brd/30 flex items-center gap-2">
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#c8a44e' }} />
        <span className="text-[10px] text-t4">{isEn ? 'GDP' : 'GDP'}</span>
        <div className="h-3 w-3 rounded-full ml-3" style={{ backgroundColor: '#22d3ee' }} />
        <span className="text-[10px] text-t4">{isEn ? 'Employment' : '고용'}</span>
        <div className="h-3 w-3 rounded-full ml-3" style={{ backgroundColor: '#34d399' }} />
        <span className="text-[10px] text-t4">{isEn ? 'Exports' : '수출'}</span>
        <span className="text-[10px] text-t4 ml-auto">{isEn ? '0-100% scale' : '0-100% 기준'}</span>
      </div>
    </div>
  )
}

export function EconomyMap({ sectors, totalGdpB, locale = 'ko' }: EconomyMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const isEn = locale === 'en'

  const selectedSector = selectedId
    ? sectors.find(s => s.id === selectedId) ?? null
    : null

  const handleSelect = (id: string) => {
    setSelectedId(prev => (prev === id ? null : id))
  }

  return (
    <section className="mb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-[18px] font-bold text-t1">
            {isEn ? 'UAE Economy Map' : 'UAE 경제 지도'}
          </h2>
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-gold/10 text-gold border border-gold/20">
            GDP ${totalGdpB}B
          </span>
        </div>
        <span className="text-[10px] text-t4">
          {isEn ? 'Click a sector for details' : '섹터 클릭 시 상세 비교'}
        </span>
      </div>

      {/* Treemap Grid */}
      <div className="grid grid-cols-2 md:grid-cols-10 md:grid-rows-3 gap-1.5">
        {sectors.map(sector => (
          <TreemapCell
            key={sector.id}
            sector={sector}
            isSelected={selectedId === sector.id}
            onSelect={() => handleSelect(sector.id)}
          />
        ))}
      </div>

      {/* KPI Panel */}
      {selectedSector && <KpiPanel sector={selectedSector} locale={locale} />}
    </section>
  )
}
