export const NEWS_KEYWORD_PACK = {

  // -----------------------------
  // EN — Google News RSS
  // -----------------------------
  google_news_rss_en: {

    // UAE 현지 뉴스 — 주요 영어 미디어에서 UAE 관련 기사
    uae_local: {
      always_on: [
        // Broad UAE coverage from major outlets
        '"Abu Dhabi" economy OR investment OR policy',
        '"Dubai" business OR economy OR government',
        'UAE government policy OR reform OR strategy',

        // Key entities that generate quality English media coverage
        'ADNOC',
        'Mubadala investment',
        'ADIA investment',
        'ADQ acquisition OR investment',
        'G42 AI UAE',
        'Masdar renewable energy',
        'Emirates airline',
        'DP World logistics',

        // Major sectors
        'UAE AI data center',
        'Abu Dhabi sovereign wealth fund',
        'Dubai real estate market',
        'UAE fintech regulation VARA ADGM',
        'Abu Dhabi industrial strategy',

        // Governance / mega-agendas
        'UAE cabinet decision',
        'Dubai Economic Agenda D33',
        'Abu Dhabi economic vision',
        'UAE diversification strategy',
        'ADIO Abu Dhabi investment office',
      ] as const,
    },

    // Deal/investment signals (no Korea overlap)
    deal: {
      always_on: [
        // Capital / Policy / Platforms
        'ADGM venture fund',
        'Hub71 startup',
        'DIFC venture capital',
        'Dubai Future Foundation',
        'Abu Dhabi Finance Week ADFW',
        'VARA regulation crypto',

        // AI / Infra / Tech
        'sovereign AI UAE',
        'UAE robotics',
        'UAE healthcare AI',
        'Stargate UAE data center',

        // Beauty / Healthcare / Consumer
        'dermocosmetics UAE',
        'medical tourism UAE',
        'Chalhoub Group beauty',

        // Web3 / Finance
        'UAE stablecoin',
        'digital dirham',
        'CBDC UAE',
        'tokenization ADGM',
      ] as const,
    },

    // Korea-UAE (tightened — compound queries only)
    korea_uae: {
      always_on: [
        '"Korea" "UAE" investment OR partnership OR MOU',
        '"Korean company" UAE',
        'KEPCO UAE OR "Abu Dhabi"',
        'Samsung Engineering UAE',
        'Hyundai UAE OR "Abu Dhabi"',
        '"K-beauty" UAE OR Dubai OR "Abu Dhabi"',
        '"K-pop" UAE OR Dubai concert',
        'Barakah nuclear Korea',
        'Korea UAE CEPA trade',
      ] as const,
    },

    macro: {
      always_on: [
        'UAE economic policy',
        'UAE regulation reform',
        'UAE foreign policy',
        'UAE central bank policy',
        'UAE interest rate',
        'UAE inflation',
      ] as const,
    },

    noise_filters_suggested: [
      'luxury villa',
      'mortgage rate',
      'brent crude price',
      'football transfer',
      'cricket',
      'weather forecast',
      'visa application how to',
      'best restaurants',
      'hotel review',
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

        // AI / 테크
        'UAE AI 데이터센터',
        'G42 아부다비',
        'UAE 로봇',

        // K-Beauty / 헬스케어
        'UAE K뷰티',
        'UAE 한국 화장품',
        'UAE 의료관광',
        '중동 K뷰티',

        // 크립토/금융
        'UAE 스테이블코인',
        'VARA 가상자산',
        'ADGM 토큰증권',
      ] as const,
    },

    // Korea-UAE (tightened)
    korea_uae: {
      always_on: [
        '한국 UAE 투자 협력',
        '한국 기업 UAE 진출',
        '한국 UAE MOU 체결',
        'UAE 한국 스타트업 투자',
        '바라카 원전 한국',
        '한화 UAE',
        '삼성엔지니어링 UAE',
        '현대건설 UAE',
        'SK UAE',
        'K뷰티 중동 진출',
        'K팝 두바이 콘서트',
      ] as const,
    },

    macro: {
      always_on: [
        'UAE 경제정책',
        'UAE 산업정책',
        'UAE 규제 개편',
        'UAE 내각 결정',
        '두바이 D33',
        '아부다비 경제 비전',
        'UAE 중앙은행',
      ] as const,
    },
  },
} as const
