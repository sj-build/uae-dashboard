export interface ValueChainStep {
  readonly label: string
}

export interface Player {
  readonly name: string
  readonly owner?: string
  readonly revenue?: string
  readonly revenueUsd?: string
  readonly marketCapUsd?: string
  readonly valueChainPosition?: string
  readonly note?: string
}

export interface Sector {
  readonly icon: string
  readonly name: string
  readonly size: string
  readonly cagr: string
  readonly valueChain: readonly ValueChainStep[]
  readonly players: readonly Player[]
  readonly insight?: string
}

export interface GdpSector {
  readonly id: string
  readonly name: string
  readonly icon: string
  readonly gdpValueB: number
  readonly gdpSharePct: number
  readonly employmentSharePct: number
  readonly exportSharePct: number
  readonly color: string
  readonly description: string
}

export interface IndustryCluster {
  readonly id: string
  readonly name: string
  readonly nameShort: string
  readonly icon: string
  readonly description: string
  readonly gdpSectorIds: readonly string[]
  readonly sectorNames: readonly string[]
  readonly color: string
}
