'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { IndustryCluster, GdpSector, Sector } from '@/types/sector'
import { SectorCard } from './SectorCard'

interface ClusterCardProps {
  readonly cluster: IndustryCluster
  readonly gdpSectors: readonly GdpSector[]
  readonly sectors: readonly Sector[]
  readonly defaultOpen?: boolean
  readonly locale?: 'ko' | 'en'
}

function GdpBadge({ gdpSector }: { readonly gdpSector: GdpSector }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border"
      style={{
        backgroundColor: `${gdpSector.color}12`,
        borderColor: `${gdpSector.color}30`,
        color: gdpSector.color,
      }}
    >
      {gdpSector.icon} {gdpSector.name} {gdpSector.gdpSharePct}%
    </span>
  )
}

// Calculate total market size from sector size strings for display
function extractTotalMarketSize(sectors: readonly Sector[]): string | null {
  let totalB = 0
  let count = 0

  for (const sector of sectors) {
    const match = sector.size.match(/\$?([\d.]+)([TBM])\s*\(\d{4}/)
    if (match) {
      const val = parseFloat(match[1])
      const unit = match[2]
      if (unit === 'T') totalB += val * 1000
      else if (unit === 'B') totalB += val
      else if (unit === 'M') totalB += val / 1000
      count++
    }
  }

  if (count === 0) return null

  if (totalB >= 1000) return `$${(totalB / 1000).toFixed(1)}T`
  if (totalB >= 1) return `$${totalB.toFixed(1)}B`
  return `$${(totalB * 1000).toFixed(0)}M`
}

export function ClusterCard({
  cluster,
  gdpSectors,
  sectors,
  defaultOpen = false,
  locale = 'ko',
}: ClusterCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const matchedGdpSectors = cluster.gdpSectorIds
    .map(id => gdpSectors.find(g => g.id === id))
    .filter((g): g is GdpSector => g !== undefined)

  const matchedSectors = cluster.sectorNames
    .map(name => sectors.find(s => s.name === name))
    .filter((s): s is Sector => s !== undefined)

  const totalSize = extractTotalMarketSize(matchedSectors)

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        className={`group w-full flex items-center gap-3 p-4 px-5 bg-bg3/60 border rounded-xl cursor-pointer transition-[background-color,border-color] duration-400 ease-out hover:bg-bg3/90 text-left focus-visible:ring-2 focus-visible:ring-gold/50 ${
          isOpen ? 'rounded-b-none border-b-transparent border-brd2/60' : 'border-brd/80 hover:border-brd2/40'
        }`}
      >
        {/* Cluster icon + name */}
        <span className="text-xl">{cluster.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[15px] font-bold text-t1">{cluster.name}</h3>
            {totalSize && (
              <span
                className="px-2 py-0.5 rounded-md text-[11px] font-semibold border"
                style={{
                  backgroundColor: `${cluster.color}10`,
                  borderColor: `${cluster.color}25`,
                  color: cluster.color,
                }}
              >
                {totalSize}
              </span>
            )}
          </div>
          {/* GDP Badges */}
          {matchedGdpSectors.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {matchedGdpSectors.map(g => (
                <GdpBadge key={g.id} gdpSector={g} />
              ))}
            </div>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-t4 transition-transform duration-400 ease-out shrink-0 group-hover:text-t3 ${
            isOpen ? 'rotate-180 text-gold/50' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="border border-brd2/50 border-t-0 rounded-b-xl p-5 bg-bg2/70 backdrop-blur-sm animate-fade-in">
          {/* Cluster description */}
          <p className="text-[11px] text-t3 mb-4 leading-relaxed">{cluster.description}</p>

          {/* Sector cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))' }}>
            {matchedSectors.map(sector => (
              <SectorCard key={sector.name} sector={sector} locale={locale} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
