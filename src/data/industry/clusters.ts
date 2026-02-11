import type { IndustryCluster } from '@/types/sector'

// 시장규모 기준 내림차순 정렬
export const clusters: readonly IndustryCluster[] = [
  {
    id: 'infrastructure',
    name: '기간산업',
    nameShort: '기간산업',
    icon: '🏗️',
    description: 'UAE 경제의 뼈대. 석유/가스+제조+건설+물류+방위 = GDP 63%. 국부펀드(ADIA/Mubadala/ADQ)가 핵심 자산 보유.',
    gdpSectorIds: ['oil-gas', 'manufacturing', 'construction', 'transport-logistics', 'public-defense'],
    sectorNames: [
      '에너지 · 석유가스 · 재생에너지',
      '제조 · 산업 · 첨단제조',
      '부동산 · 건설',
      '무역 · 물류 · 프리존',
      '로보틱스 · 우주 · 방위산업',
    ],
    color: '#c8a44e',
  },
  {
    id: 'tourism-entertainment',
    name: '관광 & 엔터테인먼트',
    nameShort: '관광·엔터',
    icon: '✈️',
    description: '두바이 방문객 1,800만+, 2033 관광시장 $163B 전망. MICE, 테마파크, K-콘텐츠 성장.',
    gdpSectorIds: ['accommodation-food'],
    sectorNames: [
      '관광 · 호텔 · MICE',
      '엔터테인먼트 · 미디어 · 게이밍',
    ],
    color: '#22d3ee',
  },
  {
    id: 'finance-digital',
    name: '금융 & 디지털',
    nameShort: '금융·디지털',
    icon: '🏦',
    description: '은행자산 $1.24T, 이슬람금융 글로벌 허브. VARA/ADGM 크립토 규제 선도. AED 스테이블코인 국가 프로젝트.',
    gdpSectorIds: ['finance-insurance'],
    sectorNames: [
      '금융 · 은행 · 보험',
      '핀테크 · 디지털결제',
    ],
    color: '#a78bfa',
  },
  {
    id: 'healthcare',
    name: '헬스케어',
    nameShort: '헬스케어',
    icon: '🏥',
    description: '의료 생태계 $22B → $50B 2029E. M42(G42 헬스케어), Burjeel, SEHA. 게노믹스+AI 정밀의료 선도.',
    // 헬스케어는 ISIC 기준 GDP 상위 9개 섹터와 별도 - 성장 기회 클러스터로 포함
    gdpSectorIds: [],
    sectorNames: [
      '헬스케어 · 바이오',
    ],
    color: '#34d399',
  },
  {
    id: 'consumer-lifestyle',
    name: '소비 & 라이프스타일',
    nameShort: '소비·라이프',
    icon: '🛍️',
    description: 'Chalhoub/Al Tayer 유통 게이트키퍼. 럭셔리+뷰티 시장 합계 $6B+. K-Fashion/K-Beauty 진출 적기.',
    gdpSectorIds: ['wholesale-retail'],
    sectorNames: [
      '패션 · 럭셔리 · 리테일',
      '뷰티 · 화장품 · 퍼스널케어',
    ],
    color: '#4a9eff',
  },
  {
    id: 'advanced-tech',
    name: '첨단기술',
    nameShort: '첨단기술',
    icon: '🤖',
    description: 'G42/Core42 AI 생태계. Stargate UAE 5GW DC. MGX $50B+ AI 투자. CAGR 28.5% 최고 성장률.',
    gdpSectorIds: ['ict'],
    sectorNames: [
      'AI · 기술 · 데이터센터',
    ],
    color: '#818cf8',
  },
] as const satisfies ReadonlyArray<IndustryCluster>
