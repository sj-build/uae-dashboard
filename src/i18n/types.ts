export type Locale = 'ko' | 'en'

export interface Translations {
  readonly nav: {
    readonly home: string
    readonly comparison: string
    readonly places: string
    readonly politics: string
    readonly economy: string
    readonly society: string
    readonly industry: string
    readonly legal: string
    readonly news: string
    readonly search: string
  }
  readonly header: {
    readonly title: string
    readonly subtitle: string
  }
  readonly search: {
    readonly placeholder: string
    readonly button: string
    readonly quickSearch: string
    readonly recent: string
    readonly title: string
    readonly description: string
    readonly loading: string
    readonly error: string
  }
  readonly common: {
    readonly opportunity: string
    readonly risk: string
    readonly insight: string
    readonly source: string
    readonly close: string
  }
  readonly locale: {
    readonly toggle: string
    readonly ko: string
    readonly en: string
  }
  readonly pages: {
    readonly home: {
      readonly title: string
      readonly subtitle: string
      readonly governmentHeader: string
      readonly governmentSubheader: string
      readonly industryHeader: string
      readonly industrySubheader: string
      readonly newsTitle: string
      readonly newsSubtitle: string
      readonly newsCount: string
      readonly newsLoading: string
      readonly newsError: string
      readonly newsEmpty: string
      readonly newsRetry: string
      readonly newsMore: string
      readonly newsLoadError: string
      readonly newsDataError: string
      readonly newsUnknownError: string
      readonly timeJustNow: string
      readonly timeHoursAgo: string
      readonly timeDaysAgo: string
      readonly timeWeeksAgo: string
      readonly macroRiskTitle: string
    }
    readonly comparison: {
      readonly title: string
      readonly subtitle: string
      readonly statsTitle: string
      readonly statsSubtitle: string
      readonly populationTitle: string
      readonly populationSubtitle: string
      readonly bilateralTitle: string
      readonly bilateralSubtitle: string
      readonly governanceTitle: string
      readonly governanceSubtitle: string
      readonly differencesTitle: string
      readonly differencesSubtitle: string
      readonly statsHeader: string
      readonly tableIndicator: string
      readonly tableNote: string
      readonly populationHeader: string
      readonly populationByNationality: string
      readonly populationByAge: string
      readonly businessImplication: string
      readonly bilateralHeader: string
      readonly tableCategory: string
      readonly tableContent: string
      readonly tableAmount: string
      readonly tableSignificance: string
      readonly korea: string
    }
    readonly politics: {
      readonly title: string
      readonly subtitle: string
      readonly systemTitle: string
      readonly systemSubtitle: string
      readonly emiratesTitle: string
      readonly emiratesSubtitle: string
      readonly abuDhabiVsDubaiTitle: string
      readonly abuDhabiVsDubaiSubtitle: string
      readonly governmentTitle: string
      readonly governmentSubtitle: string
      readonly powerTitle: string
      readonly powerSubtitle: string
      readonly powerTierHeader: string
      readonly powerTierSubheader: string
      readonly networkTitle: string
      readonly networkSubtitle: string
      readonly networkTreeHeader: string
      readonly networkTreeSubheader: string
    }
    readonly economy: {
      readonly title: string
      readonly subtitle: string
      readonly overviewTitle: string
      readonly structureTitle: string
      readonly uniquenessTitle: string
      readonly macroRiskTitle: string
    }
    readonly society: {
      readonly title: string
      readonly subtitle: string
      readonly populationTitle: string
      readonly businessCultureTitle: string
      readonly religionTitle: string
      readonly essentialTitle: string
      readonly trendsTitle: string
    }
    readonly industry: {
      readonly title: string
      readonly subtitle: string
    }
    readonly legal: {
      readonly title: string
      readonly subtitle: string
      readonly frameworkTitle: string
      readonly regulationsTitle: string
      readonly freeZonesTitle: string
      readonly timelineTitle: string
    }
    readonly news: {
      readonly title: string
      readonly subtitle: string
      readonly allNews: string
      readonly uaeGeneral: string
      readonly uaeKorea: string
      readonly business: string
      readonly energy: string
      readonly realEstate: string
      readonly finance: string
      readonly tech: string
      readonly articles: string
      readonly filteredFrom: string
      readonly total: string
      readonly noNews: string
    }
  }
}
