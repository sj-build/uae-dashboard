import type { Sector } from '@/types/sector'

// 데이터 출처 (2024-2025 최신):
// - 에너지: WAM UAE GDP Report (2024), ADNOC Gas Annual Report, IMARC Renewables
// - 관광: IMARC UAE Travel & Tourism (2024), UAE Ministry of Economy, WTTC
// - 부동산: Dubai Land Department, Economy Middle East (2024), IMARC Real Estate
// - 방위: GlobalData UAE Defense (2025), AIJOURN Defense Report
// - 헬스케어: Consultancy-ME Healthcare Ecosystem, Statista Hospitals UAE (2024)
// - 금융: CBUAE Banking Report (2024), Economy Middle East
// - 럭셔리: IMARC UAE Luxury Goods, Chalhoub Group (2024)
// - 핀테크: TechSci Research UAE Fintech (2024)
// - 뷰티: PS Market Research Beauty & Personal Care (2025)
// - AI: Statista AI Market Forecast UAE, IMARC AI Market (2024)
// - 제조: UAE MoIAT Operation 300bn, EGA Annual Report (2024), IMARC Steel
// - 물류: DP World Annual Report, AD Ports Group, JAFZA (2024)

// 시장 규모 순 정렬 (Market size descending)
export const sectors: readonly Sector[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // ⚡ 에너지 (UAE GDP의 25%, 최대 산업)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    icon: '⚡',
    name: '에너지 · 석유가스 · 재생에너지',
    size: '에너지 GDP $118B (2024) → $135B (2030E) · RE $4.8B → $12B (2033E)',
    cagr: 'GDP 비중 25% · RE CAGR 10.8%',
    valueChain: [
      { label: '원유/가스 생산' },
      { label: '정제/석유화학' },
      { label: '송배전 인프라' },
      { label: '재생에너지 (태양광/풍력)' },
      { label: '수소/원자력' },
    ],
    players: [
      { name: 'ADNOC', owner: 'Abu Dhabi 정부', revenueUsd: '매출 $49.7B', marketCapUsd: '$90B+', valueChainPosition: 'Upstream', note: '세계 12위 원유 매장, 한국 $30B+ 계약' },
      { name: 'XRG', owner: 'ADNOC 스핀오프', revenueUsd: '신설', marketCapUsd: '$80B+', valueChainPosition: '저탄소', note: '에너지 전환 투자 차량' },
      { name: 'Masdar', owner: 'Mubadala+ADNOC+TAQA', revenue: '50GW RE', marketCapUsd: '', valueChainPosition: '재생에너지', note: '100GW 목표 2030' },
      { name: 'Barakah Nuclear', owner: 'ENEC/KEPCO 건설', revenue: '5.6GW', marketCapUsd: '', valueChainPosition: '원자력', note: '한국 $23.8B 계약 (아랍 최초 원전)' },
      { name: 'TAQA', owner: 'Abu Dhabi 정부 74%', revenueUsd: '매출 $15.4B', marketCapUsd: '$28B', valueChainPosition: '유틸리티', note: '수도/전기 유틸리티' },
      { name: 'DEWA', owner: 'ICD/Dubai', revenueUsd: '매출 $8B', marketCapUsd: '$23B', valueChainPosition: '유틸리티', note: 'Mohammed bin Rashid Solar Park (5GW)' },
    ],
    insight: '한국 레버리지: KEPCO Barakah $23.8B + 삼성엔지니어링 $8B+ + SK E&C $1.2B = UAE 내 $30B+ 한국 에너지 풋프린트.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ✈️ 관광 · 호텔 · MICE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    icon: '✈️',
    name: '관광 · 호텔 · MICE',
    size: '관광 $61.3B (2024) → $163B (2033E)',
    cagr: 'CAGR 11.4%',
    valueChain: [
      { label: '항공/입국' },
      { label: '호텔/리조트' },
      { label: 'MICE/전시' },
      { label: '소비/쇼핑' },
      { label: '의료관광' },
    ],
    players: [
      { name: 'Dubai Tourism (DTCM)', owner: 'Dubai 정부', revenue: '방문객 18M+', marketCapUsd: '', valueChainPosition: '관광', note: '2024 방문객 목표 초과 달성' },
      { name: 'Emirates (항공)', owner: 'ICD/Dubai', revenueUsd: '매출 $35.6B', marketCapUsd: '국영기업', valueChainPosition: '항공', note: '270+도시, A380 최대 운영사' },
      { name: 'Jumeirah Group', owner: 'Dubai Holding', revenue: '25+호텔', marketCapUsd: '국영기업', valueChainPosition: '호텔', note: 'Burj Al Arab, 럭셔리 호텔 그룹' },
      { name: 'ADNEC/DWTC', owner: 'Abu Dhabi/Dubai 정부', revenue: '500+이벤트/년', marketCapUsd: '', valueChainPosition: 'MICE', note: 'GITEX, Gulfood, IDEX 등 메가 전시' },
      { name: 'Emaar Hospitality', owner: 'Emaar/ICD', revenue: '60+호텔', marketCapUsd: '', valueChainPosition: '호텔', note: 'Address Hotels, Vida Hotels' },
    ],
    insight: '한국 관광객 2024년 40만명+, 전년 대비 25% 증가. 의료관광(성형/치과) + MICE(한국기업 전시 참가) 확대 중.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎬 엔터테인먼트 · 미디어 · 게이밍
  // ═══════════════════════════════════════════════════════════════════════════
  {
    icon: '🎬',
    name: '엔터테인먼트 · 미디어 · 게이밍',
    size: '엔터테인먼트 $6.6B (2024) → $9.6B (2033E)',
    cagr: 'CAGR 4.2%',
    valueChain: [
      { label: '콘텐츠 제작' },
      { label: '스트리밍/배급' },
      { label: '테마파크/체험' },
      { label: '이벤트/페스티벌' },
      { label: '게이밍/e스포츠' },
    ],
    players: [
      { name: 'Miral (Yas Island)', owner: "L'imad/ADQ", revenueUsd: '$4.1B 투자', marketCapUsd: '국영기업', valueChainPosition: '테마파크', note: 'Ferrari World, Warner Bros, SeaWorld' },
      { name: 'twofour54', owner: 'Abu Dhabi 정부', revenue: '미디어 허브', marketCapUsd: '', valueChainPosition: '콘텐츠 제작', note: 'CNN, Sky News Arabia, MBC 입주' },
      { name: 'VOX Cinemas', owner: 'Majid Al Futtaim', revenue: '600+스크린', marketCapUsd: '비상장', valueChainPosition: '배급', note: 'MENA 최대 시네마 체인' },
      { name: 'AD Gaming', owner: 'Abu Dhabi 정부', revenue: 'e스포츠 허브', marketCapUsd: '', valueChainPosition: '게이밍', note: 'Abu Dhabi 게이밍/e스포츠 생태계' },
    ],
    insight: 'K-Entertainment 기회: K-Pop 공연 (Coca-Cola Arena), K-Drama IP 라이선싱, 뷰티+엔터 컬래버. K-Pop 팬 UAE/GCC 1.8M+.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏭 제조 & 산업
  // ═══════════════════════════════════════════════════════════════════════════
  {
    icon: '🏭',
    name: '제조 · 산업 · 첨단제조',
    size: '산업 GDP $57B (2024) → $82B (2031E)',
    cagr: 'CAGR 8.8% (Operation 300bn)',
    valueChain: [
      { label: '원자재 (알루미늄/철강)' },
      { label: '석유화학/소재' },
      { label: '항공부품/첨단제조' },
      { label: '식품가공/제약' },
      { label: '산업자동화/Industry 4.0' },
    ],
    players: [
      { name: 'EGA', owner: 'Mubadala+ICD', revenueUsd: '매출 $8.2B', marketCapUsd: '', valueChainPosition: '알루미늄', note: '세계 5위 알루미늄, 비석유 수출 1위' },
      { name: 'EMSTEEL', owner: 'SENAAT/ADQ', revenue: '350만톤/년', marketCapUsd: '', valueChainPosition: '철강', note: 'UAE 최대 통합 철강, 그린스틸 추진' },
      { name: 'Borouge', owner: 'ADNOC+Borealis', revenueUsd: '매출 $5.2B', marketCapUsd: '$20B', valueChainPosition: '석유화학', note: 'ADX 상장, 폴리올레핀 글로벌 선도' },
      { name: 'Strata Manufacturing', owner: 'Mubadala', revenue: 'Boeing 787 부품', marketCapUsd: '', valueChainPosition: '항공부품', note: 'Airbus/Boeing 티어1 공급사' },
      { name: 'SENAAT', owner: 'ADQ', revenueUsd: '매출 $4.5B', marketCapUsd: '', valueChainPosition: '산업 지주', note: 'DUCAB, National Cement 등 보유' },
    ],
    insight: '핵심: Operation 300bn (AED 300B 산업 GDP 목표 2031). 현재 AED 210B 달성 (70%). 한국 기업 삼성엔지니어링, 현대건설 등 UAE 산업 프로젝트 활발.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🚢 무역 & 물류
  // ═══════════════════════════════════════════════════════════════════════════
  {
    icon: '🚢',
    name: '무역 · 물류 · 프리존',
    size: '무역/물류 GDP $55B (2024) → $70B (2030E)',
    cagr: 'CAGR 4.1%',
    valueChain: [
      { label: '항만/공항 인프라' },
      { label: '해운/항공화물' },
      { label: '프리존/보세구역' },
      { label: '3PL/라스트마일' },
      { label: '무역금융/통관' },
    ],
    players: [
      { name: 'DP World', owner: 'Dubai 정부/ICD', revenueUsd: '매출 $18.9B', marketCapUsd: '$35B', valueChainPosition: '항만', note: '세계 3위 항만, 78개국 운영' },
      { name: 'AD Ports (ADNOC Logistics)', owner: 'ADQ', revenueUsd: '매출 $7.5B', marketCapUsd: '$15B', valueChainPosition: '항만/물류', note: 'Khalifa Port, KIZAD 산업단지' },
      { name: 'Emirates SkyCargo', owner: 'ICD/Dubai', revenue: '세계 1위 화물', marketCapUsd: '', valueChainPosition: '항공화물', note: '270+도시 네트워크' },
      { name: 'JAFZA', owner: 'DP World', revenue: '9,000+기업', marketCapUsd: '', valueChainPosition: '프리존', note: 'Jebel Ali 프리존, UAE 비석유 무역 23%' },
      { name: 'Aramex', owner: 'ADQ', revenueUsd: '매출 $1.6B', marketCapUsd: '$3.2B', valueChainPosition: '3PL/택배', note: 'MENA 최대 물류, ADX 상장' },
    ],
    insight: '한국 기업 UAE 진출 필수 인프라. JAFZA/KIZAD 프리존 = 100% 외국인 소유 + 법인세 면제. DP World 한국 파트너십 활발.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏗️ 부동산 & 건설
  // ═══════════════════════════════════════════════════════════════════════════
  {
    icon: '🏗️',
    name: '부동산 · 건설',
    size: '시장 $37B (2024) → $50B (2033E) · 거래 $243B',
    cagr: '시장 CAGR 3.1% · 거래량 +36% YoY',
    valueChain: [
      { label: '토지 개발/마스터플랜' },
      { label: '건설 (삼성엔지니어링 등)' },
      { label: '디벨로퍼' },
      { label: '브로커/중개' },
      { label: '프롭테크/관리' },
    ],
    players: [
      { name: 'Emaar Properties', owner: 'ICD/Dubai 정부', revenueUsd: '매출 $9.5B', marketCapUsd: '$22B', valueChainPosition: '디벨로퍼', note: 'Burj Khalifa, Dubai Mall' },
      { name: 'Aldar Properties', owner: 'Mubadala 25%', revenueUsd: '매출 $4.5B', marketCapUsd: '$14B', valueChainPosition: '디벨로퍼', note: 'Abu Dhabi 1위 디벨로퍼' },
      { name: 'DAMAC', owner: 'Hussain Sajwani', revenueUsd: '매출 $6.7B', marketCapUsd: '$10B', valueChainPosition: '디벨로퍼', note: 'Trump 브랜드 파트너' },
      { name: 'Nakheel', owner: 'Dubai 정부', revenue: 'Palm Jumeirah', marketCapUsd: '', valueChainPosition: '디벨로퍼', note: 'Dubai Holding 합병' },
      { name: 'Modon', owner: 'IHC 자회사', revenueUsd: '매출 $5.5B+', marketCapUsd: '', valueChainPosition: '디벨로퍼', note: 'Saadiyat, Yas Bay 개발' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🦾 방위산업
  // ═══════════════════════════════════════════════════════════════════════════
  {
    icon: '🦾',
    name: '로보틱스 · 우주 · 방위산업',
    size: '방위예산 $23.9B (2025) → $30.2B (2030E)',
    cagr: 'CAGR 4.7%',
    valueChain: [
      { label: 'R&D (ATRC/TIRA)' },
      { label: '방위 제조 (EDGE)' },
      { label: '드론/무인시스템' },
      { label: '위성/우주' },
      { label: '산업 자동화' },
    ],
    players: [
      { name: 'EDGE Group', owner: 'UAE 정부', revenueUsd: '매출 $5B', marketCapUsd: '', valueChainPosition: '방위 제조', note: '세계 22위 방위산업' },
      { name: 'Space42', owner: 'G42 자회사', revenue: '위성 AI', marketCapUsd: '$3.5B', valueChainPosition: '위성/우주', note: 'Bayanat+Yahsat 합병' },
      { name: 'MBRSC', owner: 'Dubai 정부', revenue: 'Hope Probe', marketCapUsd: '', valueChainPosition: '우주', note: 'UAE 화성탐사선, 달 탐사 계획' },
      { name: 'Tawazun (IHC)', owner: 'IHC 자회사', revenue: '방위 투자', marketCapUsd: '', valueChainPosition: '방위 투자', note: '오프셋 프로그램 관리' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏥 헬스케어
  // ═══════════════════════════════════════════════════════════════════════════
  {
    icon: '🏥',
    name: '헬스케어 · 바이오',
    size: '의료 생태계 $22B (2024) → $50B (2029E)',
    cagr: 'CAGR 18%',
    valueChain: [
      { label: '의약품 수입/생산' },
      { label: '병원/클리닉 네트워크' },
      { label: '보험/지급' },
      { label: '디지털 헬스' },
      { label: '게노믹스/정밀의료' },
    ],
    players: [
      { name: 'M42 (G42 Healthcare)', owner: 'Sheikh Tahnoun', revenueUsd: '', marketCapUsd: '', valueChainPosition: '디지털 헬스', note: '게노믹스+AI 진단' },
      { name: 'SEHA (Abu Dhabi Health)', owner: "L'imad/ADQ", revenue: '12개 병원', marketCapUsd: '국영기업', valueChainPosition: '병원 네트워크', note: 'Abu Dhabi 공공의료' },
      { name: 'Mediclinic Middle East', owner: "Mediclinic Int'l", revenue: '7개 병원', marketCapUsd: '$5.7B', valueChainPosition: '병원 네트워크', note: '프리미엄 민간' },
      { name: 'Burjeel Holdings', owner: 'ADX 상장', revenueUsd: '매출 $1.4B', marketCapUsd: '$3.8B', valueChainPosition: '병원 네트워크', note: '83개 시설, 의료관광 핵심' },
      { name: 'Aster DM Healthcare', owner: '인도계', revenueUsd: '매출 $870M', marketCapUsd: '$2.1B', valueChainPosition: '병원 네트워크', note: 'GCC+인도 네트워크' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏦 금융 & 투자
  // ═══════════════════════════════════════════════════════════════════════════
  {
    icon: '🏦',
    name: '금융 · 은행 · 보험',
    size: '은행자산 $1.24T (2024) · 이슬람금융 $370B · 보험 $65B',
    cagr: 'CAGR 6-8%',
    valueChain: [
      { label: '중앙은행/규제 (CBUAE)' },
      { label: '상업은행' },
      { label: '이슬람은행 (수쿡/타카풀)' },
      { label: '투자은행/자산운용' },
      { label: '보험 (타카풀)' },
    ],
    players: [
      { name: 'First Abu Dhabi Bank', owner: 'Mubadala/IHC', revenueUsd: '매출 $9.2B', marketCapUsd: '$52B', valueChainPosition: '상업은행', note: 'UAE 1위, GCC 최대 은행' },
      { name: 'Emirates NBD', owner: 'ICD/Dubai 정부', revenueUsd: '매출 $7.8B', marketCapUsd: '$35B', valueChainPosition: '상업은행', note: 'UAE 2위, DenizBank 소유' },
      { name: 'Abu Dhabi Commercial Bank', owner: '정부 61%', revenueUsd: '매출 $4.2B', marketCapUsd: '$18B', valueChainPosition: '상업은행', note: 'UAE 3위' },
      { name: 'Dubai Islamic Bank', owner: 'ICD', revenueUsd: '매출 $3.5B', marketCapUsd: '$12B', valueChainPosition: '이슬람은행', note: '세계 최대 이슬람은행' },
      { name: 'ADIA', owner: 'Abu Dhabi 정부', revenueUsd: '$1T+ AUM', marketCapUsd: '국부펀드', valueChainPosition: '자산운용', note: '세계 3대 SWF' },
      { name: 'Mubadala', owner: 'Abu Dhabi 정부', revenueUsd: '$302B AUM', marketCapUsd: '국부펀드', valueChainPosition: '자산운용', note: '기술/헬스케어 집중' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🛍️ 소비재 & 라이프스타일
  // ═══════════════════════════════════════════════════════════════════════════
  {
    icon: '👗',
    name: '패션 · 럭셔리 · 리테일',
    size: '럭셔리 $4.2B (2024) → $7.0B (2033E)',
    cagr: 'CAGR 5.5%',
    valueChain: [
      { label: '글로벌 브랜드 소싱' },
      { label: '현지 유통사 독점계약' },
      { label: '몰/백화점/부티크' },
      { label: '이커머스' },
      { label: '소비자' },
    ],
    players: [
      { name: 'Chalhoub Group', owner: 'Chalhoub 가문', revenueUsd: '매출 $3-5B', marketCapUsd: '비상장', valueChainPosition: '유통', note: 'LVMH, Chanel, Dior 독점유통' },
      { name: 'Al Tayer Group', owner: 'Al Tayer 가문', revenueUsd: '매출 $8B', marketCapUsd: '비상장', valueChainPosition: '유통/리테일', note: "Harvey Nichols, Bloomingdale's" },
      { name: 'Majid Al Futtaim', owner: 'MAF Group', revenueUsd: '매출 $9.2B', marketCapUsd: '비상장', valueChainPosition: '리테일/몰', note: 'Carrefour, Mall of Emirates' },
      { name: 'Lulu Hypermarket', owner: 'Yusuff Ali/ADQ', revenueUsd: '매출 $8.4B', marketCapUsd: '$6.5B', valueChainPosition: '리테일', note: '259개 점, ADX 상장' },
      { name: 'Noon.com', owner: 'Emaar/MBR', revenue: '중동 최대 이커머스', marketCapUsd: '비상장', valueChainPosition: '이커머스', note: 'Noon Minutes 퀵커머스' },
    ],
    insight: 'K-Fashion 기회: Chalhoub/Al Tayer = 게이트키퍼. 독자 진출 시 DMCC/DIFC 프리존 활용. 한류 팬층 타겟 D2C도 가능.',
  },
  {
    icon: '₿',
    name: '핀테크 · 디지털결제',
    size: '핀테크 $3.0B (2024) → $6.4B (2030E)',
    cagr: 'CAGR 13.8%',
    valueChain: [
      { label: '규제 (VARA/ADGM/CBUAE)' },
      { label: '인프라 (블록체인/DC)' },
      { label: '거래소/결제' },
      { label: '스테이블코인/DeFi' },
      { label: '자산 토큰화/RWA' },
    ],
    players: [
      { name: 'Binance (VARA)', owner: 'CZ/MGX $2B', revenueUsd: '매출 $12B+', marketCapUsd: '$80B+', valueChainPosition: '거래소', note: 'Dubai 본사, VASP 라이선스' },
      { name: 'Phoenix Group', owner: 'IHC', revenueUsd: '$370M IPO', marketCapUsd: '$2.8B', valueChainPosition: '채굴/인프라', note: '500MW BTC 채굴, ADX 상장' },
      { name: 'AED Stablecoin', owner: 'IHC+ADQ+FAB', revenueUsd: '$120M 투자', marketCapUsd: '', valueChainPosition: '스테이블코인', note: 'ADI Foundation L2 블록체인' },
      { name: 'VARA', owner: 'Dubai 정부', revenue: '~23개 VASP', marketCapUsd: '규제기관', valueChainPosition: '규제', note: '세계 최초 전담 크립토 규제기관' },
      { name: 'ADGM/FSRA', owner: 'Abu Dhabi', revenue: '2018 선구자', marketCapUsd: '규제기관', valueChainPosition: '규제', note: 'RegLab, Kraken ADGM 선택' },
    ],
    insight: '핵심 포인트: AED 스테이블코인 국영 프로젝트 (IHC+ADQ+FAB), ADGM 펀드 라이선스 체계, Phoenix Group → IHC → Tahnoun 연결고리.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 💄 뷰티 & 퍼스널케어
  // ═══════════════════════════════════════════════════════════════════════════
  {
    icon: '💄',
    name: '뷰티 · 화장품 · 퍼스널케어',
    size: 'B&PC $1.9B (2025) → $2.4B (2032E)',
    cagr: 'CAGR 3.6%',
    valueChain: [
      { label: '브랜드/제조 (수입 90%+)' },
      { label: '유통/물류' },
      { label: '리테일 (백화점/온라인)' },
      { label: '뷰티 살롱/스파' },
      { label: '소비자' },
    ],
    players: [
      { name: 'Chalhoub (Sephora)', owner: 'Chalhoub 가문', revenueUsd: '매출 $3-5B', marketCapUsd: '비상장', valueChainPosition: '유통/리테일', note: "Dior, Chanel, L'Oreal 독점" },
      { name: 'Faces (Al Tayer)', owner: 'Al Tayer 가문', revenue: '~80개점', marketCapUsd: '비상장', valueChainPosition: '리테일', note: '뷰티 편집숍 체인' },
      { name: 'Huda Beauty', owner: 'Huda Kattan', revenueUsd: '매출 $200M+', marketCapUsd: '비상장', valueChainPosition: '브랜드/제조', note: 'Dubai 기반 글로벌 인디 브랜드' },
      { name: 'Paris Gallery', owner: 'UAE 로컬', revenue: '50+매장', marketCapUsd: '', valueChainPosition: '리테일', note: '럭셔리 향수/화장품 리테일' },
    ],
    insight: 'K-Beauty 기회: Olive Young 진출 적기. UAE 소비자 1인당 뷰티 지출 $460+/년 (세계 최고 수준). Chalhoub/Al Tayer 유통 파트너십 or 독자 진출 가능.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🤖 기술 & 인프라
  // ═══════════════════════════════════════════════════════════════════════════
  {
    icon: '🤖',
    name: 'AI · 기술 · 데이터센터',
    size: 'AI $950M (2024) → $4.3B (2030E)',
    cagr: 'AI CAGR 28.5% · DC CAGR 17.6%',
    valueChain: [
      { label: '반도체/칩 수입' },
      { label: '데이터센터 인프라' },
      { label: '클라우드/AI 플랫폼' },
      { label: 'AI 모델/서비스' },
      { label: '산업 응용 (금융/의료/물류)' },
    ],
    players: [
      { name: 'G42 / Core42', owner: 'Sheikh Tahnoun', revenue: '직원 24,000명', marketCapUsd: '비상장', valueChainPosition: 'AI 플랫폼', note: 'Falcon LLM, Cerebras 파트너' },
      { name: 'Khazna Data Centers', owner: 'G42 자회사', revenue: 'UAE DC 70%+', marketCapUsd: '', valueChainPosition: 'DC 인프라', note: '시장 점유율 압도적' },
      { name: 'MGX', owner: 'G42+Mubadala', revenueUsd: '$50B+ AUM', marketCapUsd: '투자기관', valueChainPosition: 'AI 투자', note: 'OpenAI, xAI, Anthropic 투자' },
      { name: 'Presight AI', owner: 'G42 (ADX 상장)', revenueUsd: '매출 $180M', marketCapUsd: '$4.2B', valueChainPosition: 'AI 서비스', note: '정부/안보 빅데이터 분석' },
      { name: 'Stargate UAE', owner: 'G42+OpenAI+SoftBank', revenueUsd: '$500B 글로벌', marketCapUsd: 'JV', valueChainPosition: 'DC 인프라', note: '5GW AI 캠퍼스, 200MW 1단계 2026' },
      { name: 'e& (Etisalat)', owner: 'Abu Dhabi 정부 60%', revenueUsd: '매출 $14.7B', marketCapUsd: '$58B', valueChainPosition: '클라우드/통신', note: '5G, 클라우드, AI 서비스' },
    ],
  },
] as const satisfies ReadonlyArray<Sector>
