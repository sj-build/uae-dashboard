'use client'

import type { IndustryCluster, GdpSector, Sector } from '@/types/sector'
import { ClusterCard } from './ClusterCard'

// First 2 clusters (Infrastructure, Tourism) open by default for immediate context
const DEFAULT_OPEN_COUNT = 2

interface ClusterGridProps {
  readonly clusters: readonly IndustryCluster[]
  readonly gdpSectors: readonly GdpSector[]
  readonly sectors: readonly Sector[]
  readonly locale?: 'ko' | 'en'
}

export function ClusterGrid({ clusters, gdpSectors, sectors, locale = 'ko' }: ClusterGridProps) {
  const isEn = locale === 'en'

  return (
    <section className="mb-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-[18px] font-bold text-t1">
          {isEn ? 'Industry Clusters' : '산업 클러스터'}
        </h2>
        <span className="text-[10px] text-t4">
          {isEn
            ? `${clusters.length} clusters · ${sectors.length} sectors · sorted by market size`
            : `${clusters.length}개 클러스터 · ${sectors.length}개 섹터 · 시장규모순`}
        </span>
      </div>

      {clusters.map((cluster, idx) => (
        <ClusterCard
          key={cluster.id}
          cluster={cluster}
          gdpSectors={gdpSectors}
          sectors={sectors}
          defaultOpen={idx < DEFAULT_OPEN_COUNT}
          locale={locale}
        />
      ))}
    </section>
  )
}
