import type { ComparisonRow } from './comparison-stats'

export const comparisonStats: readonly ComparisonRow[] = [
  { indicator: 'Political System', uae: 'Federal Absolute Monarchy (7 Emirates)', korea: 'Presidential Democratic Republic', note: 'UAE has no elections, political parties, or parliament', whyItMatters: 'Royal/government connections are key to business success. Relationships and access to decision-makers matter most.' },
  { indicator: 'Founding', uae: '1971 (54 years)', korea: '1948 (78 years)', note: 'UAE founded 23 years after Korea' },
  { indicator: 'Head of State', uae: 'MBZ (President = Ruler of Abu Dhabi)', korea: 'President (5-year direct election)', note: 'UAE presidency is effectively hereditary' },
  { indicator: 'Population', uae: '~10.5M', korea: '~51.7M', note: '88.5% of UAE population are foreigners', uaeHighlight: true, whyItMatters: 'High expat ratio makes multinational hiring easy. However, Emiratization policy is increasing local hiring requirements.' },
  { indicator: 'National Population', uae: '~1.2M (11.5%)', korea: '~51.7M', note: 'Actual Emiratis number roughly 1/3 of Busan\'s population', uaeHighlight: true },
  { indicator: 'Area', uae: '83,600 km²', korea: '100,210 km²', note: 'Roughly the size of South Carolina' },
  { indicator: 'GDP (Nominal)', uae: '$537B (2024)', korea: '$1,713B (2024)', note: '~31% of Korea\'s, but UAE leads in GDP per capita', uaeHighlight: true },
  { indicator: 'GDP per Capita', uae: '$49,500', korea: '$33,100', note: 'UAE is 1.5x higher', uaeHighlight: true, whyItMatters: 'High-income market enables premium pricing. Strong purchasing power in the Middle East hub.' },
  { indicator: 'GDP Growth', uae: '4.0% (2024)', korea: '2.0% (2024)', note: 'UAE targets: 4.8% (2025), 5.7% (2026)' },
  { indicator: 'SWF Total Assets', uae: '$2.5T+', korea: '$890B (KIC+NPS)', note: 'UAE SWFs = 1.5x Korea\'s GDP', uaeHighlight: true, whyItMatters: 'ADIA/Mubadala/ADQ are world\'s largest LPs. Opportunities from startup investment to major M&A.' },
  { indicator: 'Income Tax', uae: '0% (Tax-free)', korea: '6~45% Progressive', note: 'Corporate tax: UAE 9% (2023~), Korea 9~24%', uaeHighlight: true, whyItMatters: '9% corporate + 0% income tax minimizes burden. Note: 5% VAT applies; consider costs outside free zones.' },
  { indicator: 'Unemployment', uae: '~2.1%', korea: '~3.7%', note: 'UAE benefits from flexible foreign labor structure' },
  { indicator: 'Inflation', uae: '1.6% (2025E)', korea: '~2.3%', note: 'UAE: AED pegged to USD ($1 = 3.6725 AED)' },
  { indicator: 'Trade Volume', uae: '$1.42T (2024)', korea: '$1.26T (2024)', note: 'UAE exceeds Korea due to re-export hub status' },
  { indicator: 'Bilateral Relations', uae: 'CEPA in effect (May 2024) · 100-Year Strategic Partnership', korea: '', note: 'KEPCO nuclear $23.8B, Samsung Eng. $8B+', whyItMatters: 'CEPA eliminates tariffs, protects investments. Favorable partnership environment for Korean companies.' },
] as const
