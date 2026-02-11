import type { IndustryCluster } from '@/types/sector'

// Sorted by total market size descending
export const clusters: readonly IndustryCluster[] = [
  {
    id: 'infrastructure',
    name: 'Core Industries',
    nameShort: 'Core',
    icon: '🏗️',
    description: 'Backbone of the UAE economy. Oil/gas+manufacturing+construction+logistics+defense = 63% of GDP. Sovereign wealth funds (ADIA/Mubadala/ADQ) own key assets.',
    gdpSectorIds: ['oil-gas', 'manufacturing', 'construction', 'transport-logistics', 'public-defense'],
    sectorNames: [
      'Energy · Oil & Gas · Renewables',
      'Manufacturing · Industry · Advanced Manufacturing',
      'Real Estate · Construction',
      'Trade · Logistics · Free Zones',
      'Robotics · Space · Defense',
    ],
    color: '#c8a44e',
  },
  {
    id: 'tourism-entertainment',
    name: 'Tourism & Entertainment',
    nameShort: 'Tourism',
    icon: '✈️',
    description: 'Dubai 18M+ visitors, tourism market projected at $163B by 2033. MICE, theme parks, K-content growth.',
    gdpSectorIds: ['accommodation-food'],
    sectorNames: [
      'Tourism · Hotels · MICE',
      'Entertainment · Media · Gaming',
    ],
    color: '#22d3ee',
  },
  {
    id: 'finance-digital',
    name: 'Finance & Digital',
    nameShort: 'Finance',
    icon: '🏦',
    description: 'Bank assets $1.24T, global Islamic finance hub. VARA/ADGM lead crypto regulation. AED stablecoin national project.',
    gdpSectorIds: ['finance-insurance'],
    sectorNames: [
      'Finance · Banking · Insurance',
      'Fintech · Digital Payments',
    ],
    color: '#a78bfa',
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    nameShort: 'Healthcare',
    icon: '🏥',
    description: 'Healthcare ecosystem $22B → $50B by 2029E. M42 (G42 Healthcare), Burjeel, SEHA. Leading in genomics+AI precision medicine.',
    // Healthcare is separate from top 9 ISIC-based GDP sectors - included as growth opportunity cluster
    gdpSectorIds: [],
    sectorNames: [
      'Healthcare · Biotech',
    ],
    color: '#34d399',
  },
  {
    id: 'consumer-lifestyle',
    name: 'Consumer & Lifestyle',
    nameShort: 'Consumer',
    icon: '🛍️',
    description: 'Chalhoub/Al Tayer as distribution gatekeepers. Luxury+beauty market combined $6B+. Prime timing for K-Fashion/K-Beauty entry.',
    gdpSectorIds: ['wholesale-retail'],
    sectorNames: [
      'Fashion · Luxury · Retail',
      'Beauty · Cosmetics · Personal Care',
    ],
    color: '#4a9eff',
  },
  {
    id: 'advanced-tech',
    name: 'Advanced Technology',
    nameShort: 'Tech',
    icon: '🤖',
    description: 'G42/Core42 AI ecosystem. Stargate UAE 5GW DC. MGX $50B+ AI investments. CAGR 28.5% — highest growth rate.',
    gdpSectorIds: ['ict'],
    sectorNames: [
      'AI · Technology · Data Centers',
    ],
    color: '#818cf8',
  },
] as const satisfies ReadonlyArray<IndustryCluster>
