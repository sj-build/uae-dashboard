export interface ComparisonRow {
  readonly indicator: string
  readonly uae: string
  readonly korea: string
  readonly note: string
  readonly uaeHighlight?: boolean
  readonly koreaHighlight?: boolean
  readonly uaeColor?: string
  readonly whyItMatters?: string
}

export const comparisonStats: readonly ComparisonRow[] = [
  { indicator: '정치체제', uae: '연방 절대군주제 (7개 에미리트)', korea: '대통령제 민주공화국', note: 'UAE는 선거·정당·의회 없는 왕정', whyItMatters: '왕족/정부와의 관계가 비즈니스 성패를 좌우. 로비·로열 커넥션이 핵심.' },
  { indicator: '건국', uae: '1971년 (54년)', korea: '1948년 (78년)', note: 'UAE가 한국보다 23년 늦게 건국' },
  { indicator: '국가원수', uae: 'MBZ (대통령=Abu Dhabi 통치자)', korea: '대통령 (5년 직선제)', note: 'UAE 대통령은 사실상 세습' },
  { indicator: '인구', uae: '~1,050만', korea: '~5,170만', note: 'UAE 인구의 88.5%가 외국인', uaeHighlight: true, whyItMatters: '외국인 비중이 높아 다국적 인력 채용 용이. 단, 에미라티화 정책으로 자국민 고용 의무 증가 추세.' },
  { indicator: '자국민 인구', uae: '~120만 (11.5%)', korea: '~5,170만', note: '실제 에미라티는 부산 인구의 1/3 수준', uaeHighlight: true },
  { indicator: '면적', uae: '83,600 km²', korea: '100,210 km²', note: '경상도+전라도 합친 정도' },
  { indicator: 'GDP (명목)', uae: '$537B (2024)', korea: '$1,713B (2024)', note: '한국의 ~31%. 그러나 1인당 GDP는 UAE 우위', uaeHighlight: true },
  { indicator: '1인당 GDP', uae: '$49,500', korea: '$33,100', note: 'UAE가 1.5배 높음', uaeHighlight: true, whyItMatters: '고소득 시장. 프리미엄 제품/서비스 가격 책정 가능. 소비력 높은 중동 허브.' },
  { indicator: 'GDP 성장률', uae: '4.0% (2024)', korea: '2.0% (2024)', note: 'UAE 목표: 4.8% (2025), 5.7% (2026)' },
  { indicator: '국부펀드(SWF) 총자산', uae: '$2.5T+', korea: '$890B (KIC+NPS)', note: 'UAE SWF = 한국 GDP의 1.5배', uaeHighlight: true, whyItMatters: 'ADIA/Mubadala/ADQ 등 세계 최대 LP. 스타트업 투자부터 대형 M&A까지 자본 조달 기회.' },
  { indicator: '소득세', uae: '0% (면세)', korea: '6~45% 누진세', note: '법인세: UAE 9% (2023~), 한국 9~24%', uaeHighlight: true, whyItMatters: '법인세 9%+소득세 0%로 세금 부담 최소화. 다만 VAT 5%, 프리존 밖 사업시 비용 고려 필요.' },
  { indicator: '실업률', uae: '~2.1%', korea: '~3.7%', note: 'UAE 외국인 노동자 유연 구조' },
  { indicator: '물가상승률', uae: '1.6% (2025E)', korea: '~2.3%', note: 'UAE: AED = USD 페깅 ($1 = 3.6725 AED)' },
  { indicator: '무역 규모', uae: '$1.42T (2024)', korea: '$1.26T (2024)', note: '재수출 허브로 UAE가 한국보다 큼' },
  { indicator: '양자 관계', uae: 'CEPA 발효 (2024.5) · 100년 전략적 파트너십', korea: '', note: 'KEPCO 원전 $23.8B, 삼성엔지니어링 $8B+', whyItMatters: 'CEPA로 관세 철폐, 투자 보호. 한국 기업에 유리한 파트너십 환경.' },
] as const
