import type { DemographicStat, NationalityGroup, EmiratePopulation, KafalaItem } from './population'

export const demographicStats: readonly DemographicStat[] = [
  { label: 'Total Population', value: '~10.5M', note: '35x growth in 50 years, from ~300K in 1971', icon: '👥' },
  { label: 'Foreign Nationals', value: '~88.5%', note: '3rd highest globally (after Qatar, Vatican)', icon: '🌍' },
  { label: 'Emiratis (Citizens)', value: '~1.21M (11.5%)', note: 'Only major country where nationals are a minority', icon: '🇦🇪' },
  { label: 'Gender Ratio', value: 'Male 64% : Female 36%', note: 'Extreme imbalance due to male labor migration', icon: '⚤' },
  { label: 'Median Age', value: '31.6 years', note: 'Very young population structure', icon: '🎂' },
  { label: 'Urbanization Rate', value: '~81%', note: 'Concentrated in Abu Dhabi, Dubai, Sharjah', icon: '🏙️' },
  { label: 'Fertility Rate (TFR)', value: '1.46 (overall) / 3.1 (Emiratis)', note: 'Emirati fertility rate also declining', icon: '👶' },
  { label: 'Nationalities', value: '200+', note: 'Most multinational country in the world', icon: '🗺️' },
] as const

export const nationalityGroups: readonly NationalityGroup[] = [
  {
    flag: '🇮🇳',
    name: 'India',
    percentage: 38,
    population: '~4M',
    characteristics: 'Mainly from Kerala, Tamil Nadu, AP. Across all sectors: construction, IT, finance, healthcare. Core of cricket culture',
    color: '#f59e0b',
  },
  {
    flag: '🇵🇰',
    name: 'Pakistan',
    percentage: 17,
    population: '~1.78M',
    characteristics: 'Construction, retail, transportation. Urdu-speaking. $6B+ annual remittances to home country',
    color: '#34d399',
  },
  {
    flag: '🇧🇩',
    name: 'Bangladesh',
    percentage: 7,
    population: '~740K',
    characteristics: 'Construction, domestic work, retail. Concentrated in Abu Dhabi/Sharjah',
    color: '#22d3ee',
  },
  {
    flag: '🇵🇭',
    name: 'Philippines',
    percentage: 5,
    population: '~530K',
    characteristics: 'Services, healthcare, domestic work. English fluency makes them essential to the service industry',
    color: '#a78bfa',
  },
  {
    flag: '🇪🇬',
    name: 'Egypt+Arabs',
    percentage: 8,
    population: '~840K',
    characteristics: 'Largest Arab expatriate community. Education, finance, law, consulting, media',
    color: '#ef4444',
  },
  {
    flag: '🇦🇪',
    name: 'Emiratis',
    percentage: 11.5,
    population: '~1.21M',
    characteristics: 'Citizens. Primarily employed in government/state-owned enterprises. Extensive social welfare benefits',
    color: '#c8a44e',
  },
  {
    flag: '🌍',
    name: 'Other Expats',
    percentage: 13.4,
    population: '~1.4M',
    characteristics: 'Westerners, Iranians, other Asians. High proportion in management/professional roles',
    color: '#6b7280',
  },
] as const

export const populationInsights: readonly string[] = [
  'Target customer segmentation is essential: Selling K-Beauty to Emiratis vs. Indian middle class vs. Western expats requires completely different price points and marketing channels',
  'Indians at 38%: An unmissable segment for B2C businesses. The most overlooked factor by Korean companies',
  'Gender imbalance: 64% male population means surprisingly large market for male-targeted services and products',
  'Young population: Median age 31.6 means digital natives with high responsiveness to social commerce and short-form content',
] as const

export const emiratePopulations: readonly EmiratePopulation[] = [
  {
    name: 'Dubai',
    nameEn: 'Dubai',
    population: '~3.95M (largest)',
    characteristics: 'Global business/tourism hub. Emiratis ~15%, rest are foreigners. Most cosmopolitan',
    icon: '🏙️',
  },
  {
    name: 'Abu Dhabi',
    nameEn: 'Abu Dhabi',
    population: '~3.79M',
    characteristics: 'Capital. Highest proportion of Emiratis. Government/energy/industry center. SWF headquarters',
    icon: '🏛️',
  },
  {
    name: 'Sharjah',
    nameEn: 'Sharjah',
    population: '~1.8M',
    characteristics: 'Large South Asian community. Bedroom community for Dubai commuters. Complete alcohol ban',
    icon: '📚',
  },
  {
    name: 'Ajman',
    nameEn: 'Ajman',
    population: '~505K',
    characteristics: 'Small but growing',
    icon: '🏗️',
  },
  {
    name: 'RAK',
    nameEn: 'Ras Al Khaimah',
    population: '~400K',
    characteristics: 'Pursuing casino legalization (first in an Islamic country). Tourism/manufacturing',
    icon: '🎰',
  },
  {
    name: 'Fujairah',
    nameEn: 'Fujairah',
    population: '~317K',
    characteristics: 'Maritime trade/port-centric',
    icon: '⚓',
  },
  {
    name: 'UAQ',
    nameEn: 'Umm Al Quwain',
    population: '~49K',
    characteristics: 'Smallest population, traditional',
    icon: '🌴',
  },
] as const

export const emirateInsights: readonly string[] = [
  'Abu Dhabi = money (SWFs), Dubai = market (consumers). Seek investment in Abu Dhabi, launch business in Dubai',
  'Sharjah: Strict regulations (complete alcohol ban, conservative dress code) -- very different business environment',
  'Top 3 emirates (Dubai + Abu Dhabi + Sharjah) account for ~85% of total population',
] as const

export const kafalaSystem: readonly KafalaItem[] = [
  { label: 'Definition', content: 'A sponsorship system tying foreign workers\' residency to their employer (sponsor)' },
  { label: 'History', content: 'Originated during British colonial era (1920s), later delegated sponsorship to citizens after independence' },
  { label: 'Core Structure', content: 'Work visa = employer as sponsor -- changing jobs/leaving the country required employer consent (under reform)' },
  { label: 'Recent Reforms (2021~)', content: 'Digital labor contracts mandatory, relaxed employer consent for job changes, exit permit requirement removed, Wage Protection System (WPS) strengthened' },
  { label: '2024 Labor Law Amendment', content: 'All employment contracts must be fixed-term (effective 2025.1.1), flexible work officially recognized, dispute resolution procedures simplified' },
  { label: 'Emiratization', content: 'Companies with 50+ employees: mandatory 2% annual increase in Emirati hiring (10% target by 2026). AED 96,000/person penalty for non-compliance' },
  { label: 'Controversies', content: 'Cases of passport confiscation, contract violations, and forced labor still reported. Domestic and construction workers are the most vulnerable' },
] as const

export const kafalaWarnings: readonly string[] = [
  'When establishing a UAE entity, Emiratization hiring obligations must be understood and included in recruitment plans',
  'The company is responsible for employee visa sponsorship -- visa cancellation procedures are required upon termination',
  'WPS (Wage Protection System): A mandatory system requiring salaries to be paid only through UAE bank accounts',
] as const
