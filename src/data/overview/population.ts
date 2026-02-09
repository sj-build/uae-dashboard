export interface PopulationGroup {
  readonly flag: string
  readonly label: string
  readonly percentage: number
  readonly count: string
  readonly color: string
  readonly bold?: boolean
}

export const populationGroups: readonly PopulationGroup[] = [
  { flag: '🇮🇳', label: '인도', percentage: 38, count: '~400만', color: 'linear-gradient(90deg,#f59e0b,#d97706)' },
  { flag: '🇵🇰', label: '파키스탄', percentage: 17, count: '~178만', color: 'linear-gradient(90deg,#34d399,#059669)' },
  { flag: '🇦🇪', label: '에미라티', percentage: 11.5, count: '~121만', color: 'linear-gradient(90deg,#c8a44e,#e8c85a)', bold: true },
  { flag: '🇧🇩', label: '방글라데시', percentage: 7, count: '~74만', color: '#22d3ee' },
  { flag: '🇵🇭', label: '필리핀', percentage: 5, count: '~53만', color: '#a78bfa' },
  { flag: '🇪🇬', label: '이집트+아랍', percentage: 8, count: '~84만', color: '#ef4444' },
  { flag: '🌍', label: '기타 외국인', percentage: 13.2, count: '~139만', color: '#4b5563' },
  { flag: '🇰🇷', label: '한국', percentage: 0.1, count: '~1.2만', color: '#4a9eff' },
] as const

export interface AgeGroup {
  readonly label: string
  readonly percentage: string
  readonly count: string
  readonly color: string
}

export const ageGroups: readonly AgeGroup[] = [
  { label: '0~14세', percentage: '20.4%', count: '~220만 · 미래 소비층', color: '#22d3ee' },
  { label: '15~64세', percentage: '78.7%', count: '~840만 · 핵심 노동력', color: '#34d399' },
  { label: '65세+', percentage: '0.9%', count: '~10만 · 고령화 없음', color: '#ef4444' },
  { label: '중위 연령', percentage: '31.6세', count: '한국 44.9세 대비 매우 젊음', color: '#c8a44e' },
] as const

export const demographicInsights: readonly string[] = [
  '성비: 남성 724만(64%) vs 여성 411만(36%) — 건설/물류 남성 노동자 유입',
  '도시화율: 81.2% (Abu Dhabi·Dubai·Sharjah 집중)',
  '문해율: 95%+ · 200+개국 국적 거주',
] as const

export const businessImplications: readonly string[] = [
  'UAE 소비 시장은 에미라티가 아닌 외국인이 88%',
  '인도인(38%) 취향이 소비시장 최대 영향력',
  'K-Beauty·K-Entertainment는 인도+필리핀+아랍 팬층 동시 공략',
  '고령화 0% → 노인 시장 없음. 청년·가족 시장이 핵심',
] as const
