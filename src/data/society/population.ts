export interface DemographicStat {
  readonly label: string
  readonly value: string
  readonly note: string
  readonly icon: string
}

export const demographicStats: readonly DemographicStat[] = [
  { label: '총 인구', value: '~10.5M', note: '1971년 ~30만에서 50년 만에 35배 성장', icon: '👥' },
  { label: '외국인 비율', value: '~88.5%', note: '세계 3위 (카타르, 바티칸 다음)', icon: '🌍' },
  { label: '에미라티(자국민)', value: '~1.21M (11.5%)', note: '자국에서 소수민족인 유일한 주요 국가', icon: '🇦🇪' },
  { label: '남녀 비율', value: '남 64% : 여 36%', note: '남성 노동자 유입으로 극심한 불균형', icon: '⚤' },
  { label: '중위 연령', value: '31.6세', note: '매우 젊은 인구 구조', icon: '🎂' },
  { label: '도시화율', value: '~81%', note: 'Abu Dhabi, Dubai, Sharjah 집중', icon: '🏙️' },
  { label: '출산율 (TFR)', value: '1.46 (전체) / 3.1 (에미라티)', note: '에미라티 출산율도 하락 중', icon: '👶' },
  { label: '국적 수', value: '200+', note: '세계에서 가장 다국적인 국가', icon: '🗺️' },
] as const

export interface NationalityGroup {
  readonly flag: string
  readonly name: string
  readonly percentage: number
  readonly population: string
  readonly characteristics: string
  readonly color: string
}

export const nationalityGroups: readonly NationalityGroup[] = [
  {
    flag: '🇮🇳',
    name: '인도',
    percentage: 38,
    population: '~4M',
    characteristics: 'Kerala, Tamil Nadu, AP 출신 다수. 건설~IT~금융~의료 전 분야. 크리켓 문화 주축',
    color: '#f59e0b',
  },
  {
    flag: '🇵🇰',
    name: '파키스탄',
    percentage: 17,
    population: '~1.78M',
    characteristics: '건설, 소매, 운수 중심. 우르두어 사용. 연 $6B+ 본국 송금',
    color: '#34d399',
  },
  {
    flag: '🇧🇩',
    name: '방글라데시',
    percentage: 7,
    population: '~740K',
    characteristics: '건설, 가사노동, 소매. Abu Dhabi/Sharjah 집중',
    color: '#22d3ee',
  },
  {
    flag: '🇵🇭',
    name: '필리핀',
    percentage: 5,
    population: '~530K',
    characteristics: '서비스업, 의료, 가사노동. 영어 유창 -> 서비스 산업 핵심',
    color: '#a78bfa',
  },
  {
    flag: '🇪🇬',
    name: '이집트+아랍',
    percentage: 8,
    population: '~840K',
    characteristics: '최대 아랍 외국인 커뮤니티. 교육, 금융, 법률, 컨설팅, 미디어',
    color: '#ef4444',
  },
  {
    flag: '🇦🇪',
    name: '에미라티',
    percentage: 11.5,
    population: '~1.21M',
    characteristics: '자국민. 정부/공기업 중심 고용. 광범위한 시민 복지 수혜',
    color: '#c8a44e',
  },
  {
    flag: '🌍',
    name: '기타 외국인',
    percentage: 13.4,
    population: '~1.4M',
    characteristics: '서양인, 이란, 기타 아시아 등. 경영진/전문직 비율 높음',
    color: '#6b7280',
  },
] as const

export const populationInsights: readonly string[] = [
  '타겟 고객 세분화 필수: K-Beauty 판매 시 에미라티 vs 인도 중산층 vs 서양 주재원 -> 가격대/마케팅 채널이 완전히 다름',
  '인도인 38%: B2C 비즈니스에서 절대 무시 못하는 세그먼트. 한국 기업들이 가장 간과하는 부분',
  '남녀 불균형: 남성 64% -> 남성 타겟 서비스/제품 시장이 의외로 큼',
  '젊은 인구: 중위연령 31.6세 -> 디지털 네이티브, 소셜커머스, 숏폼 콘텐츠 반응 높음',
] as const

export interface EmiratePopulation {
  readonly name: string
  readonly nameEn: string
  readonly population: string
  readonly characteristics: string
  readonly icon: string
}

export const emiratePopulations: readonly EmiratePopulation[] = [
  {
    name: 'Dubai',
    nameEn: 'Dubai',
    population: '~3.95M (최다)',
    characteristics: '글로벌 비즈니스/관광 허브. 에미라티 ~15%, 나머지 외국인. 가장 코즈모폴리탄',
    icon: '🏙️',
  },
  {
    name: 'Abu Dhabi',
    nameEn: 'Abu Dhabi',
    population: '~3.79M',
    characteristics: '수도. 에미라티 비율 가장 높음. 정부/에너지/산업 중심. SWF 본부',
    icon: '🏛️',
  },
  {
    name: 'Sharjah',
    nameEn: 'Sharjah',
    population: '~1.8M',
    characteristics: '남아시아 커뮤니티 집중. Dubai 통근 베드타운. 음주 전면 금지',
    icon: '📚',
  },
  {
    name: 'Ajman',
    nameEn: 'Ajman',
    population: '~505K',
    characteristics: '소규모, 성장 중',
    icon: '🏗️',
  },
  {
    name: 'RAK',
    nameEn: 'Ras Al Khaimah',
    population: '~400K',
    characteristics: '카지노 합법화 추진 중 (이슬람 국가 최초). 관광/제조업',
    icon: '🎰',
  },
  {
    name: 'Fujairah',
    nameEn: 'Fujairah',
    population: '~317K',
    characteristics: '해양 무역/항만 중심',
    icon: '⚓',
  },
  {
    name: 'UAQ',
    nameEn: 'Umm Al Quwain',
    population: '~49K',
    characteristics: '최소 인구, 전통적',
    icon: '🌴',
  },
] as const

export const emirateInsights: readonly string[] = [
  'Abu Dhabi = 돈 (SWF), Dubai = 시장 (소비자). 투자 유치는 Abu Dhabi, 사업 런칭은 Dubai',
  'Sharjah: 규제 엄격 (음주 전면 금지, 보수적 드레스코드) -> 비즈니스 환경 매우 다름',
  '상위 3개 에미리트 (Dubai + Abu Dhabi + Sharjah)가 전체 인구의 ~85% 차지',
] as const

export interface KafalaItem {
  readonly label: string
  readonly content: string
}

export const kafalaSystem: readonly KafalaItem[] = [
  { label: '정의', content: '외국인 노동자의 체류를 고용주(스폰서)에게 묶는 후원 제도' },
  { label: '역사', content: '영국 식민지 시대(1920s)에서 기원, 독립 후 시민에게 후원 위임' },
  { label: '핵심 구조', content: '노동비자 = 고용주가 스폰서 -> 이직/출국에 고용주 동의 필요 (개혁 중)' },
  { label: '최근 개혁 (2021~)', content: '디지털 노동계약 의무화, 이직 시 고용주 동의 요건 완화, 출국허가 요건 제거, 임금보호시스템(WPS) 강화' },
  { label: '2024 노동법 개정', content: '모든 고용계약 기한제 전환 의무 (2025.1.1~), 유연근무 공식 인정, 분쟁 해결 절차 간소화' },
  { label: '에미라티화', content: '50인+ 기업: 매년 2% 에미라티 고용 의무 (2026년 10% 목표). 미달 시 AED 96,000/인 벌금' },
  { label: '논란', content: '여전히 여권 압수, 계약 위반, 강제 노동 등 사례 보고됨. 가사노동자/건설노동자가 가장 취약' },
] as const

export const kafalaWarnings: readonly string[] = [
  'UAE 법인 설립 시 에미라티 고용 의무 반드시 인지 -> 채용 계획에 포함',
  '직원 비자 스폰서십은 회사가 책임 -> 퇴사 시 비자 취소 절차 필요',
  'WPS(임금보호시스템): 급여를 UAE 은행 계좌로만 지급해야 하는 의무 시스템',
] as const
