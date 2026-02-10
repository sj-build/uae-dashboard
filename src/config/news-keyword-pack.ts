export const NEWS_KEYWORD_PACK = {

  // -----------------------------
  // EN — Google News RSS
  // -----------------------------
  google_news_rss_en: {
    deal: {
      always_on: [
        // Capital / Policy / Platforms
        'ADIA investment',
        'Mubadala investment',
        'ADQ investment',
        'Abu Dhabi Investment Office ADIO',
        'ADGM venture fund',
        'Hub71 startup',
        'DIFC venture capital',
        'Dubai Future Foundation',
        'Abu Dhabi Finance Week ADFW',
        'VARA regulation crypto',

        // AI / Infra / Tech
        'G42 AI',
        'UAE AI data center',
        'Abu Dhabi AI infrastructure',
        'sovereign AI UAE',
        'UAE robotics',
        'UAE healthcare AI',
        'UAE medical AI pilot',
        'physical AI robotics UAE',

        // Cross-border Korea–UAE
        'Korea UAE partnership',
        'Korea UAE investment',
        'Korea UAE MOU',
        'Korean company UAE expansion',
        'Korean startup UAE',

        // Beauty / Healthcare / Consumer
        'K-beauty UAE',
        'Korean skincare UAE',
        'Korean cosmetics UAE',
        'dermocosmetics UAE',
        'dermatology clinic UAE',
        'medical tourism UAE',
        'Sephora Middle East Korean brand',
        'Chalhoub Group beauty',

        // Culture / Entertainment
        'K-pop concert UAE',
        'K-pop Dubai Abu Dhabi',
        'Korean entertainment UAE',
        'Korean music concert Middle East',
        'UAE live entertainment arena',

        // Web3 / Finance (deal signals only)
        'UAE stablecoin',
        'digital dirham',
        'CBDC UAE',
        'tokenization ADGM',
      ] as const,

      watchlist: [
        // Actor × Action × Korea combinations
        'Mubadala investment Korea',
        'ADQ investment Korea',
        'ADIA investment Korea',
        'G42 partnership Korea',
        'Hub71 Korean startup',
        'ADGM fund Korea',
        'Korean startup UAE launch',
        'Korean company JV UAE',
        'Korea UAE pilot project',
        'Korea UAE strategic partnership',

        // Retail / consumer expansion
        'UAE retail expansion Korean brand',
        'Dubai retail Korean brand',
        'Abu Dhabi mall Korean brand',

        // Clinics / healthcare execution
        'dermatology clinic Abu Dhabi',
        'dermatology clinic Dubai',
        'Korean hospital UAE partnership',
        'medical tourism Korea UAE',
      ] as const,

      high_signal_10: [
        'Mubadala investment Korea',
        'ADQ investment Korea',
        'ADGM venture fund Korea',
        'Hub71 Korean startup',
        'G42 partnership Korea',
        'Korean company JV UAE',
        'Korean startup UAE launch',
        'K-beauty UAE Sephora',
        'dermatology clinic UAE Korean',
        'K-pop concert UAE',
      ] as const,
    },

    macro: {
      always_on: [
        // Governance / policy / regulation
        'UAE economic policy',
        'UAE industrial policy',
        'UAE diversification strategy',
        'UAE regulation reform',
        'UAE foreign policy',
        'UAE cabinet decision',

        // Mega agendas
        'Dubai Economic Agenda D33',
        'Abu Dhabi economic vision',

        // Monetary / financial plumbing
        'UAE central bank policy',
        'UAE interest rate',
        'UAE inflation',
      ] as const,

      watchlist: [
        'UAE sanctions policy',
        'UAE trade policy',
        'UAE investment law',
        'UAE visa policy change',
      ] as const,
    },

    noise_filters_suggested: [
      'real estate',
      'property',
      'hotel',
      'luxury villa',
      'mortgage',
      'oil price',
      'brent',
      'crude',
      'ADNOC gas',
      'football',
      'cricket',
      'weather',
    ] as const,
  },

  // -----------------------------
  // KO — Naver Search API
  // -----------------------------
  naver_search_ko: {
    deal: {
      always_on: [
        // 국부펀드 / 플랫폼
        '아부다비 국부펀드 투자',
        '무바달라 투자',
        'ADQ 투자',
        'ADIA 투자',
        'ADGM 펀드',
        '허브71',
        '아부다비 투자청 ADIO',
        '아부다비 파이낸스 위크',

        // AI / 테크
        'UAE AI 데이터센터',
        '아부다비 데이터센터',
        'UAE 인공지능 인프라',
        'G42 아부다비',
        'UAE 로봇',
        '물리적 AI 로봇 UAE',
        'UAE 의료 AI',
        'UAE 헬스케어 AI',

        // 엔터테인먼트 / 문화
        'UAE K팝 콘서트',
        '두바이 K팝',
        '아부다비 K팝',
        '중동 K팝 공연',
        '한국 엔터테인먼트 UAE',

        // K-Beauty / 헬스케어
        'UAE K뷰티',
        'UAE 한국 화장품',
        'UAE 스킨케어 시장',
        'UAE 더마코스메틱',
        'UAE 피부과 클리닉',
        'UAE 의료관광',
        '중동 K뷰티',

        // 한–UAE 교차
        '한국 UAE 협력',
        '한국 UAE 투자',
        '한국 UAE MOU',
        '한국 기업 UAE 진출',
        '한국 스타트업 UAE',

        // 크립토/금융
        'UAE 스테이블코인',
        '디지털 디르함',
        'UAE CBDC',
        'ADGM 토큰증권',
        'VARA 스테이블코인',
      ] as const,

      watchlist: [
        '한국 기업 UAE 합작',
        '한국 스타트업 UAE 런칭',
        '한국 UAE 파일럿',
        '한국 화장품 UAE 세포라',
        '샬룹 그룹 한국 브랜드',
        'UAE 피부과 한국 브랜드',
        '아부다비 병원 한국 협력',
      ] as const,
    },

    macro: {
      always_on: [
        'UAE 경제정책',
        'UAE 산업정책',
        'UAE 규제 개편',
        'UAE 외교 정책',
        'UAE 내각 결정',
        '두바이 D33',
        '아부다비 경제 비전',
        'UAE 중앙은행',
        'UAE 금리',
        'UAE 인플레이션',
      ] as const,

      watchlist: [
        'UAE 투자법 개정',
        'UAE 비자 정책 변경',
        'UAE 무역 정책',
      ] as const,
    },
  },

  // -----------------------------
  // Query builder templates (Optional)
  // -----------------------------
  query_builder_templates: {
    actor_action_sector:
      '(ADIA OR Mubadala OR ADQ OR "ADGM" OR Hub71 OR G42) (investment OR acquisition OR "joint venture" OR JV OR MOU OR launch OR pilot OR IPO) (Korea OR Korean OR "South Korea")',
    beauty_execution:
      '("K-beauty" OR "Korean skincare" OR "Korean cosmetics" OR dermocosmetics OR dermatology) (UAE OR Dubai OR "Abu Dhabi") (launch OR partnership OR distribution OR "retail" OR Sephora OR Chalhoub)',
    culture_execution:
      '(K-pop OR "Korean entertainment") (UAE OR Dubai OR "Abu Dhabi") (concert OR tour OR arena OR launch)',
  },
} as const
