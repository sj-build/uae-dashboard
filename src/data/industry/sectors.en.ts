import type { Sector } from '@/types/sector'

// Data Sources (2024-2025 latest):
// - Energy: WAM UAE GDP Report (2024), ADNOC Gas Annual Report, IMARC Renewables
// - Tourism: IMARC UAE Travel & Tourism (2024), UAE Ministry of Economy, WTTC
// - Real Estate: Dubai Land Department, Economy Middle East (2024), IMARC Real Estate
// - Defense: GlobalData UAE Defense (2025), AIJOURN Defense Report
// - Healthcare: Consultancy-ME Healthcare Ecosystem, Statista Hospitals UAE (2024)
// - Finance: CBUAE Banking Report (2024), Economy Middle East
// - Luxury: IMARC UAE Luxury Goods, Chalhoub Group (2024)
// - Fintech: TechSci Research UAE Fintech (2024)
// - Beauty: PS Market Research Beauty & Personal Care (2025)
// - AI: Statista AI Market Forecast UAE, IMARC AI Market (2024)
// - Manufacturing: UAE MoIAT Operation 300bn, EGA Annual Report (2024), IMARC Steel
// - Logistics: DP World Annual Report, AD Ports Group, JAFZA (2024)

// Sorted by market size (descending)
export const sectors: readonly Sector[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // ⚡ Energy (25% of UAE GDP, largest sector)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    icon: '⚡',
    name: 'Energy · Oil & Gas · Renewables',
    size: 'Energy GDP $118B (2024) → $135B (2030E) · RE $4.8B → $12B (2033E)',
    cagr: '25% of GDP · RE CAGR 10.8%',
    valueChain: [
      { label: 'Crude oil/gas production' },
      { label: 'Refining/petrochemicals' },
      { label: 'Transmission/distribution' },
      { label: 'Renewables (solar/wind)' },
      { label: 'Hydrogen/nuclear' },
    ],
    players: [
      { name: 'ADNOC', owner: 'Abu Dhabi government', revenueUsd: 'Rev $49.7B', marketCapUsd: '$90B+', valueChainPosition: 'Upstream', note: 'World #12 oil reserves, $30B+ Korean contracts' },
      { name: 'XRG', owner: 'ADNOC spinoff', revenueUsd: 'New', marketCapUsd: '$80B+', valueChainPosition: 'Low-carbon', note: 'Energy transition investment vehicle' },
      { name: 'Masdar', owner: 'Mubadala+ADNOC+TAQA', revenue: '50GW RE', marketCapUsd: '', valueChainPosition: 'Renewables', note: '100GW target by 2030' },
      { name: 'Barakah Nuclear', owner: 'ENEC/built by KEPCO', revenue: '5.6GW', marketCapUsd: '', valueChainPosition: 'Nuclear', note: 'Korean $23.8B contract (first Arab nuclear plant)' },
      { name: 'TAQA', owner: 'Abu Dhabi government 74%', revenueUsd: 'Rev $15.4B', marketCapUsd: '$28B', valueChainPosition: 'Utility', note: 'Water/electricity utility' },
      { name: 'DEWA', owner: 'ICD/Dubai', revenueUsd: 'Rev $8B', marketCapUsd: '$23B', valueChainPosition: 'Utility', note: 'Mohammed bin Rashid Solar Park (5GW)' },
    ],
    insight: 'Korean leverage: KEPCO Barakah $23.8B + Samsung Engineering $8B+ + SK E&C $1.2B = $30B+ Korean energy footprint in the UAE.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ✈️ Tourism · Hotels · MICE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    icon: '✈️',
    name: 'Tourism · Hotels · MICE',
    size: 'Tourism $61.3B (2024) → $163B (2033E)',
    cagr: 'CAGR 11.4%',
    valueChain: [
      { label: 'Aviation/entry' },
      { label: 'Hotels/resorts' },
      { label: 'MICE/exhibitions' },
      { label: 'Retail/shopping' },
      { label: 'Medical tourism' },
    ],
    players: [
      { name: 'Dubai Tourism (DTCM)', owner: 'Dubai government', revenue: '18M+ visitors', marketCapUsd: '', valueChainPosition: 'Tourism', note: '2024 visitor target exceeded' },
      { name: 'Emirates (airline)', owner: 'ICD/Dubai', revenueUsd: 'Rev $35.6B', marketCapUsd: 'State-owned', valueChainPosition: 'Aviation', note: '270+ cities, largest A380 operator' },
      { name: 'Jumeirah Group', owner: 'Dubai Holding', revenue: '25+ hotels', marketCapUsd: 'State-owned', valueChainPosition: 'Hotels', note: 'Burj Al Arab, luxury hotel group' },
      { name: 'ADNEC/DWTC', owner: 'Abu Dhabi/Dubai government', revenue: '500+ events/year', marketCapUsd: '', valueChainPosition: 'MICE', note: 'GITEX, Gulfood, IDEX mega exhibitions' },
      { name: 'Emaar Hospitality', owner: 'Emaar/ICD', revenue: '60+ hotels', marketCapUsd: '', valueChainPosition: 'Hotels', note: 'Address Hotels, Vida Hotels' },
    ],
    insight: 'Korean tourists 400K+ in 2024, up 25% YoY. Growing medical tourism (cosmetic/dental) + MICE (Korean company exhibition participation).',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎬 Entertainment · Media · Gaming
  // ═══════════════════════════════════════════════════════════════════════════
  {
    icon: '🎬',
    name: 'Entertainment · Media · Gaming',
    size: 'Entertainment $6.6B (2024) → $9.6B (2033E)',
    cagr: 'CAGR 4.2%',
    valueChain: [
      { label: 'Content production' },
      { label: 'Streaming/distribution' },
      { label: 'Theme parks/experiences' },
      { label: 'Events/festivals' },
      { label: 'Gaming/esports' },
    ],
    players: [
      { name: 'Miral (Yas Island)', owner: "L'imad/ADQ", revenueUsd: '$4.1B invested', marketCapUsd: 'State-owned', valueChainPosition: 'Theme parks', note: 'Ferrari World, Warner Bros, SeaWorld' },
      { name: 'twofour54', owner: 'Abu Dhabi government', revenue: 'Media hub', marketCapUsd: '', valueChainPosition: 'Content production', note: 'CNN, Sky News Arabia, MBC tenants' },
      { name: 'VOX Cinemas', owner: 'Majid Al Futtaim', revenue: '600+ screens', marketCapUsd: 'Private', valueChainPosition: 'Distribution', note: 'MENA\'s largest cinema chain' },
      { name: 'AD Gaming', owner: 'Abu Dhabi government', revenue: 'Esports hub', marketCapUsd: '', valueChainPosition: 'Gaming', note: 'Abu Dhabi gaming/esports ecosystem' },
    ],
    insight: 'K-Entertainment opportunity: K-Pop concerts (Coca-Cola Arena), K-Drama IP licensing, beauty+entertainment collabs. 1.8M+ K-Pop fans in UAE/GCC.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏭 Manufacturing & Industry
  // ═══════════════════════════════════════════════════════════════════════════
  {
    icon: '🏭',
    name: 'Manufacturing · Industry · Advanced Manufacturing',
    size: 'Industrial GDP $57B (2024) → $82B (2031E)',
    cagr: 'CAGR 8.8% (Operation 300bn)',
    valueChain: [
      { label: 'Raw materials (aluminum/steel)' },
      { label: 'Petrochemicals/materials' },
      { label: 'Aerospace parts/advanced manufacturing' },
      { label: 'Food processing/pharma' },
      { label: 'Industrial automation/Industry 4.0' },
    ],
    players: [
      { name: 'EGA', owner: 'Mubadala+ICD', revenueUsd: 'Rev $8.2B', marketCapUsd: '', valueChainPosition: 'Aluminum', note: 'World #5 aluminum, largest non-oil export' },
      { name: 'EMSTEEL', owner: 'SENAAT/ADQ', revenue: '3.5M tonnes/year', marketCapUsd: '', valueChainPosition: 'Steel', note: 'UAE largest integrated steel, green steel push' },
      { name: 'Borouge', owner: 'ADNOC+Borealis', revenueUsd: 'Rev $5.2B', marketCapUsd: '$20B', valueChainPosition: 'Petrochemicals', note: 'ADX listed, global polyolefins leader' },
      { name: 'Strata Manufacturing', owner: 'Mubadala', revenue: 'Boeing 787 parts', marketCapUsd: '', valueChainPosition: 'Aerospace parts', note: 'Airbus/Boeing Tier 1 supplier' },
      { name: 'SENAAT', owner: 'ADQ', revenueUsd: 'Rev $4.5B', marketCapUsd: '', valueChainPosition: 'Industrial holding', note: 'Owns DUCAB, National Cement, etc.' },
    ],
    insight: 'Key: Operation 300bn (AED 300B industrial GDP target by 2031). Currently AED 210B achieved (70%). Korean firms Samsung Engineering, Hyundai actively involved in UAE industrial projects.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🚢 Trade & Logistics
  // ═══════════════════════════════════════════════════════════════════════════
  {
    icon: '🚢',
    name: 'Trade · Logistics · Free Zones',
    size: 'Trade/Logistics GDP $55B (2024) → $70B (2030E)',
    cagr: 'CAGR 4.1%',
    valueChain: [
      { label: 'Port/airport infrastructure' },
      { label: 'Shipping/air cargo' },
      { label: 'Free zones/bonded areas' },
      { label: '3PL/last mile' },
      { label: 'Trade finance/customs' },
    ],
    players: [
      { name: 'DP World', owner: 'Dubai government/ICD', revenueUsd: 'Rev $18.9B', marketCapUsd: '$35B', valueChainPosition: 'Ports', note: 'World #3 port operator, 78 countries' },
      { name: 'AD Ports (ADNOC Logistics)', owner: 'ADQ', revenueUsd: 'Rev $7.5B', marketCapUsd: '$15B', valueChainPosition: 'Ports/logistics', note: 'Khalifa Port, KIZAD industrial zone' },
      { name: 'Emirates SkyCargo', owner: 'ICD/Dubai', revenue: 'World #1 cargo airline', marketCapUsd: '', valueChainPosition: 'Air cargo', note: '270+ city network' },
      { name: 'JAFZA', owner: 'DP World', revenue: '9,000+ companies', marketCapUsd: '', valueChainPosition: 'Free zone', note: 'Jebel Ali Free Zone, 23% of UAE non-oil trade' },
      { name: 'Aramex', owner: 'ADQ', revenueUsd: 'Rev $1.6B', marketCapUsd: '$3.2B', valueChainPosition: '3PL/courier', note: 'MENA largest logistics, ADX listed' },
    ],
    insight: 'Essential infrastructure for Korean companies entering UAE. JAFZA/KIZAD free zones = 100% foreign ownership + corporate tax exemption. DP World actively partnering with Korean firms.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏗️ Real Estate & Construction
  // ═══════════════════════════════════════════════════════════════════════════
  {
    icon: '🏗️',
    name: 'Real Estate · Construction',
    size: 'Market $37B (2024) → $50B (2033E) · Transactions $243B',
    cagr: 'Market CAGR 3.1% · Transactions +36% YoY',
    valueChain: [
      { label: 'Land development/master planning' },
      { label: 'Construction (Samsung Engineering, etc.)' },
      { label: 'Developers' },
      { label: 'Brokers/agents' },
      { label: 'Proptech/management' },
    ],
    players: [
      { name: 'Emaar Properties', owner: 'ICD/Dubai government', revenueUsd: 'Rev $9.5B', marketCapUsd: '$22B', valueChainPosition: 'Developer', note: 'Burj Khalifa, Dubai Mall' },
      { name: 'Aldar Properties', owner: 'Mubadala 25%', revenueUsd: 'Rev $4.5B', marketCapUsd: '$14B', valueChainPosition: 'Developer', note: 'Abu Dhabi\'s #1 developer' },
      { name: 'DAMAC', owner: 'Hussain Sajwani', revenueUsd: 'Rev $6.7B', marketCapUsd: '$10B', valueChainPosition: 'Developer', note: 'Trump brand partner' },
      { name: 'Nakheel', owner: 'Dubai government', revenue: 'Palm Jumeirah', marketCapUsd: '', valueChainPosition: 'Developer', note: 'Merged with Dubai Holding' },
      { name: 'Modon', owner: 'IHC subsidiary', revenueUsd: 'Rev $5.5B+', marketCapUsd: '', valueChainPosition: 'Developer', note: 'Saadiyat, Yas Bay development' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🦾 Defense & Space
  // ═══════════════════════════════════════════════════════════════════════════
  {
    icon: '🦾',
    name: 'Robotics · Space · Defense',
    size: 'Defense budget $23.9B (2025) → $30.2B (2030E)',
    cagr: 'CAGR 4.7%',
    valueChain: [
      { label: 'R&D (ATRC/TIRA)' },
      { label: 'Defense manufacturing (EDGE)' },
      { label: 'Drones/unmanned systems' },
      { label: 'Satellites/space' },
      { label: 'Industrial automation' },
    ],
    players: [
      { name: 'EDGE Group', owner: 'UAE government', revenueUsd: 'Rev $5B', marketCapUsd: '', valueChainPosition: 'Defense manufacturing', note: 'World\'s 22nd largest defense firm' },
      { name: 'Space42', owner: 'G42 subsidiary', revenue: 'Satellite AI', marketCapUsd: '$3.5B', valueChainPosition: 'Satellites/space', note: 'Bayanat + Yahsat merger' },
      { name: 'MBRSC', owner: 'Dubai government', revenue: 'Hope Probe', marketCapUsd: '', valueChainPosition: 'Space', note: 'UAE Mars mission, lunar exploration plans' },
      { name: 'Tawazun (IHC)', owner: 'IHC subsidiary', revenue: 'Defense investment', marketCapUsd: '', valueChainPosition: 'Defense investment', note: 'Offset program management' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏥 Healthcare
  // ═══════════════════════════════════════════════════════════════════════════
  {
    icon: '🏥',
    name: 'Healthcare · Biotech',
    size: 'Healthcare ecosystem $22B (2024) → $50B (2029E)',
    cagr: 'CAGR 18%',
    valueChain: [
      { label: 'Pharmaceutical imports/production' },
      { label: 'Hospital/clinic networks' },
      { label: 'Insurance/payments' },
      { label: 'Digital health' },
      { label: 'Genomics/precision medicine' },
    ],
    players: [
      { name: 'M42 (G42 Healthcare)', owner: 'Sheikh Tahnoun', revenueUsd: '', marketCapUsd: '', valueChainPosition: 'Digital health', note: 'Genomics + AI diagnostics' },
      { name: 'SEHA (Abu Dhabi Health)', owner: "L'imad/ADQ", revenue: '12 hospitals', marketCapUsd: 'State-owned', valueChainPosition: 'Hospital network', note: 'Abu Dhabi public healthcare' },
      { name: 'Mediclinic Middle East', owner: "Mediclinic Int'l", revenue: '7 hospitals', marketCapUsd: '$5.7B', valueChainPosition: 'Hospital network', note: 'Premium private healthcare' },
      { name: 'Burjeel Holdings', owner: 'ADX listed', revenueUsd: 'Rev $1.4B', marketCapUsd: '$3.8B', valueChainPosition: 'Hospital network', note: '83 facilities, key medical tourism player' },
      { name: 'Aster DM Healthcare', owner: 'Indian-origin', revenueUsd: 'Rev $870M', marketCapUsd: '$2.1B', valueChainPosition: 'Hospital network', note: 'GCC + India network' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏦 Finance & Investment
  // ═══════════════════════════════════════════════════════════════════════════
  {
    icon: '🏦',
    name: 'Finance · Banking · Insurance',
    size: 'Bank assets $1.24T (2024) · Islamic finance $370B · Insurance $65B',
    cagr: 'CAGR 6-8%',
    valueChain: [
      { label: 'Central bank/regulation (CBUAE)' },
      { label: 'Commercial banking' },
      { label: 'Islamic banking (Sukuk/Takaful)' },
      { label: 'Investment banking/asset management' },
      { label: 'Insurance (Takaful)' },
    ],
    players: [
      { name: 'First Abu Dhabi Bank', owner: 'Mubadala/IHC', revenueUsd: 'Rev $9.2B', marketCapUsd: '$52B', valueChainPosition: 'Commercial bank', note: 'UAE #1, GCC largest bank' },
      { name: 'Emirates NBD', owner: 'ICD/Dubai government', revenueUsd: 'Rev $7.8B', marketCapUsd: '$35B', valueChainPosition: 'Commercial bank', note: 'UAE #2, owns DenizBank' },
      { name: 'Abu Dhabi Commercial Bank', owner: 'Government 61%', revenueUsd: 'Rev $4.2B', marketCapUsd: '$18B', valueChainPosition: 'Commercial bank', note: 'UAE #3' },
      { name: 'Dubai Islamic Bank', owner: 'ICD', revenueUsd: 'Rev $3.5B', marketCapUsd: '$12B', valueChainPosition: 'Islamic bank', note: 'World\'s largest Islamic bank' },
      { name: 'ADIA', owner: 'Abu Dhabi government', revenueUsd: '$1T+ AUM', marketCapUsd: 'Sovereign Fund', valueChainPosition: 'Asset management', note: 'Top 3 global SWF' },
      { name: 'Mubadala', owner: 'Abu Dhabi government', revenueUsd: '$302B AUM', marketCapUsd: 'Sovereign Fund', valueChainPosition: 'Asset management', note: 'Tech/healthcare focus' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🛍️ Consumer & Lifestyle
  // ═══════════════════════════════════════════════════════════════════════════
  {
    icon: '👗',
    name: 'Fashion · Luxury · Retail',
    size: 'Luxury $4.2B (2024) → $7.0B (2033E)',
    cagr: 'CAGR 5.5%',
    valueChain: [
      { label: 'Global brand sourcing' },
      { label: 'Local distributor exclusive contracts' },
      { label: 'Malls/department stores/boutiques' },
      { label: 'E-commerce' },
      { label: 'Consumers' },
    ],
    players: [
      { name: 'Chalhoub Group', owner: 'Chalhoub family', revenueUsd: 'Rev $3-5B', marketCapUsd: 'Private', valueChainPosition: 'Distribution', note: 'LVMH, Chanel, Dior exclusive' },
      { name: 'Al Tayer Group', owner: 'Al Tayer family', revenueUsd: 'Rev $8B', marketCapUsd: 'Private', valueChainPosition: 'Distribution/retail', note: "Harvey Nichols, Bloomingdale's" },
      { name: 'Majid Al Futtaim', owner: 'MAF Group', revenueUsd: 'Rev $9.2B', marketCapUsd: 'Private', valueChainPosition: 'Retail/malls', note: 'Carrefour, Mall of Emirates' },
      { name: 'Lulu Hypermarket', owner: 'Yusuff Ali/ADQ', revenueUsd: 'Rev $8.4B', marketCapUsd: '$6.5B', valueChainPosition: 'Retail', note: '259 stores, ADX listed' },
      { name: 'Noon.com', owner: 'Emaar/MBR', revenue: 'MENA\'s largest e-commerce', marketCapUsd: 'Private', valueChainPosition: 'E-commerce', note: 'Noon Minutes quick commerce' },
    ],
    insight: 'K-Fashion opportunity: Chalhoub/Al Tayer = gatekeepers. For independent entry, leverage DMCC/DIFC free zones. D2C targeting the Korean Wave fanbase is also viable.',
  },
  {
    icon: '₿',
    name: 'Fintech · Digital Payments',
    size: 'Fintech $3.0B (2024) → $6.4B (2030E)',
    cagr: 'CAGR 13.8%',
    valueChain: [
      { label: 'Regulation (VARA/ADGM/CBUAE)' },
      { label: 'Infrastructure (blockchain/DC)' },
      { label: 'Exchanges/payments' },
      { label: 'Stablecoins/DeFi' },
      { label: 'Asset tokenization/RWA' },
    ],
    players: [
      { name: 'Binance (VARA)', owner: 'CZ/MGX $2B', revenueUsd: 'Rev $12B+', marketCapUsd: '$80B+', valueChainPosition: 'Exchange', note: 'Dubai HQ, VASP license' },
      { name: 'Phoenix Group', owner: 'IHC', revenueUsd: '$370M IPO', marketCapUsd: '$2.8B', valueChainPosition: 'Mining/infra', note: '500MW BTC mining, ADX listed' },
      { name: 'AED Stablecoin', owner: 'IHC+ADQ+FAB', revenueUsd: '$120M investment', marketCapUsd: '', valueChainPosition: 'Stablecoin', note: 'ADI Foundation L2 blockchain' },
      { name: 'VARA', owner: 'Dubai government', revenue: '~23 VASPs', marketCapUsd: 'Regulator', valueChainPosition: 'Regulation', note: 'World\'s first dedicated crypto regulator' },
      { name: 'ADGM/FSRA', owner: 'Abu Dhabi', revenue: 'Pioneer since 2018', marketCapUsd: 'Regulator', valueChainPosition: 'Regulation', note: 'RegLab, Kraken chose ADGM' },
    ],
    insight: 'Key points: AED stablecoin as state-backed project (IHC+ADQ+FAB), ADGM fund license framework, Phoenix Group → IHC → Tahnoun connection.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 💄 Beauty & Personal Care
  // ═══════════════════════════════════════════════════════════════════════════
  {
    icon: '💄',
    name: 'Beauty · Cosmetics · Personal Care',
    size: 'B&PC $1.9B (2025) → $2.4B (2032E)',
    cagr: 'CAGR 3.6%',
    valueChain: [
      { label: 'Brand/manufacturing (90%+ imported)' },
      { label: 'Distribution/logistics' },
      { label: 'Retail (department stores/online)' },
      { label: 'Beauty salons/spas' },
      { label: 'Consumers' },
    ],
    players: [
      { name: 'Chalhoub (Sephora)', owner: 'Chalhoub family', revenueUsd: 'Rev $3-5B', marketCapUsd: 'Private', valueChainPosition: 'Distribution/retail', note: "Dior, Chanel, L'Oreal exclusive" },
      { name: 'Faces (Al Tayer)', owner: 'Al Tayer family', revenue: '~80 stores', marketCapUsd: 'Private', valueChainPosition: 'Retail', note: 'Multi-brand beauty retail chain' },
      { name: 'Huda Beauty', owner: 'Huda Kattan', revenueUsd: 'Rev $200M+', marketCapUsd: 'Private', valueChainPosition: 'Brand/manufacturing', note: 'Dubai-based global indie brand' },
      { name: 'Paris Gallery', owner: 'UAE local', revenue: '50+ stores', marketCapUsd: '', valueChainPosition: 'Retail', note: 'Luxury perfume/cosmetics retail' },
    ],
    insight: 'K-Beauty opportunity: Ideal timing for Olive Young entry. UAE consumers spend $460+/year per capita on beauty (among the highest globally). Chalhoub/Al Tayer distribution partnership or independent entry possible.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🤖 Technology & Infrastructure
  // ═══════════════════════════════════════════════════════════════════════════
  {
    icon: '🤖',
    name: 'AI · Technology · Data Centers',
    size: 'AI $950M (2024) → $4.3B (2030E)',
    cagr: 'AI CAGR 28.5% · DC CAGR 17.6%',
    valueChain: [
      { label: 'Semiconductor/chip imports' },
      { label: 'Data center infrastructure' },
      { label: 'Cloud/AI platforms' },
      { label: 'AI models/services' },
      { label: 'Industry applications (finance/healthcare/logistics)' },
    ],
    players: [
      { name: 'G42 / Core42', owner: 'Sheikh Tahnoun', revenue: '24,000 employees', marketCapUsd: 'Private', valueChainPosition: 'AI platform', note: 'Falcon LLM, Cerebras partner' },
      { name: 'Khazna Data Centers', owner: 'G42 subsidiary', revenue: 'UAE DC 70%+', marketCapUsd: '', valueChainPosition: 'DC infra', note: 'Dominant market share' },
      { name: 'MGX', owner: 'G42+Mubadala', revenueUsd: '$50B+ AUM', marketCapUsd: 'Investment firm', valueChainPosition: 'AI investment', note: 'OpenAI, xAI, Anthropic investments' },
      { name: 'Presight AI', owner: 'G42 (ADX listed)', revenueUsd: 'Rev $180M', marketCapUsd: '$4.2B', valueChainPosition: 'AI services', note: 'Government/security big data analytics' },
      { name: 'Stargate UAE', owner: 'G42+OpenAI+SoftBank', revenueUsd: '$500B global', marketCapUsd: 'JV', valueChainPosition: 'DC infra', note: '5GW AI campus, 200MW Phase 1 in 2026' },
      { name: 'e& (Etisalat)', owner: 'Abu Dhabi government 60%', revenueUsd: 'Rev $14.7B', marketCapUsd: '$58B', valueChainPosition: 'Cloud/telecom', note: '5G, cloud, AI services' },
    ],
  },
] as const satisfies ReadonlyArray<Sector>
