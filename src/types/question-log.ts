// Question log types for the auto-analysis system

export interface QuestionLog {
  readonly id: string
  readonly query: string
  readonly timestamp: string
  readonly success: boolean
  readonly responseTimeMs: number
  readonly locale: 'ko' | 'en'
  readonly userAgent?: string
}

export interface WeeklyAnalysisReport {
  readonly id: string
  readonly weekStartDate: string
  readonly weekEndDate: string
  readonly generatedAt: string
  readonly totalQuestions: number
  readonly successRate: number
  readonly topTopics: readonly TopicStat[]
  readonly contentGaps: readonly ContentGap[]
  readonly suggestedImprovements: readonly SuggestedImprovement[]
  readonly status: 'pending' | 'approved' | 'rejected' | 'applied'
}

export interface TopicStat {
  readonly topic: string
  readonly count: number
  readonly percentage: number
  readonly avgResponseTime: number
  readonly successRate: number
}

export interface ContentGap {
  readonly topic: string
  readonly questionExamples: readonly string[]
  readonly reason: string
  readonly priority: 'high' | 'medium' | 'low'
}

export interface SuggestedImprovement {
  readonly id: string
  readonly type: 'add' | 'update' | 'remove'
  readonly targetFile: string
  readonly description: string
  readonly reason: string
  readonly diff?: string
  readonly status: 'pending' | 'approved' | 'rejected' | 'applied'
}

export interface AdminLog {
  readonly id: string
  readonly type: 'auto' | 'manual' | 'analysis'
  readonly action: string
  readonly timestamp: string
  readonly details: string
  readonly metadata?: Record<string, unknown>
}
