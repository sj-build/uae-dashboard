// Question logging system using Vercel KV
// Falls back to in-memory storage for local development

import type { QuestionLog, AdminLog, WeeklyAnalysisReport } from '@/types/question-log'

// In-memory fallback for development (Vercel KV in production)
const inMemoryLogs: QuestionLog[] = []
const inMemoryAdminLogs: AdminLog[] = []
const inMemoryReports: WeeklyAnalysisReport[] = []

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// Detect language from query
function detectLocale(query: string): 'ko' | 'en' {
  const koreanPattern = /[가-힣]/
  return koreanPattern.test(query) ? 'ko' : 'en'
}

// Check if Vercel KV is available
async function getKV(): Promise<typeof import('@vercel/kv') | null> {
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const kv = await import('@vercel/kv')
      return kv
    }
  } catch {
    // Vercel KV not available
  }
  return null
}

// Log a question
export async function logQuestion(params: {
  query: string
  success: boolean
  responseTimeMs: number
  userAgent?: string
}): Promise<QuestionLog> {
  const log: QuestionLog = {
    id: generateId(),
    query: params.query,
    timestamp: new Date().toISOString(),
    success: params.success,
    responseTimeMs: params.responseTimeMs,
    locale: detectLocale(params.query),
    userAgent: params.userAgent,
  }

  const kv = await getKV()

  if (kv) {
    // Store in Vercel KV
    const key = `question:${log.id}`
    await kv.kv.set(key, log, { ex: 60 * 60 * 24 * 90 }) // 90 days expiry

    // Add to weekly index
    const weekKey = getWeekKey(new Date())
    await kv.kv.lpush(`questions:${weekKey}`, log.id)
  } else {
    // Fallback to in-memory
    inMemoryLogs.push(log)
    // Keep only last 1000 logs in memory
    if (inMemoryLogs.length > 1000) {
      inMemoryLogs.shift()
    }
  }

  return log
}

// Get week key for indexing (e.g., "2025-W05")
function getWeekKey(date: Date): string {
  const year = date.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7)
  return `${year}-W${week.toString().padStart(2, '0')}`
}

// Get questions for a specific week
export async function getQuestionsForWeek(weekKey: string): Promise<readonly QuestionLog[]> {
  const kv = await getKV()

  if (kv) {
    const ids = await kv.kv.lrange(`questions:${weekKey}`, 0, -1) as string[]
    const logs = await Promise.all(
      ids.map(id => kv.kv.get<QuestionLog>(`question:${id}`))
    )
    return logs.filter((log): log is QuestionLog => log !== null)
  } else {
    // Fallback: return recent in-memory logs
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return inMemoryLogs.filter(log => new Date(log.timestamp) >= weekAgo)
  }
}

// Get recent questions (last N days)
export async function getRecentQuestions(days: number = 7): Promise<readonly QuestionLog[]> {
  const kv = await getKV()

  if (kv) {
    const now = new Date()
    const weeks: string[] = []
    for (let i = 0; i <= Math.ceil(days / 7); i++) {
      const date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
      weeks.push(getWeekKey(date))
    }

    const allLogs: QuestionLog[] = []
    for (const weekKey of weeks) {
      const logs = await getQuestionsForWeek(weekKey)
      allLogs.push(...logs)
    }

    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    return allLogs
      .filter(log => new Date(log.timestamp) >= cutoffDate)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  } else {
    const now = new Date()
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    return inMemoryLogs
      .filter(log => new Date(log.timestamp) >= cutoffDate)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }
}

// Log admin action
export async function logAdminAction(params: {
  type: 'auto' | 'manual' | 'analysis'
  action: string
  details: string
  metadata?: Record<string, unknown>
}): Promise<AdminLog> {
  const log: AdminLog = {
    id: generateId(),
    type: params.type,
    action: params.action,
    timestamp: new Date().toISOString(),
    details: params.details,
    metadata: params.metadata,
  }

  const kv = await getKV()

  if (kv) {
    await kv.kv.lpush('admin:logs', JSON.stringify(log))
    await kv.kv.ltrim('admin:logs', 0, 999) // Keep last 1000 logs
  } else {
    inMemoryAdminLogs.unshift(log)
    if (inMemoryAdminLogs.length > 1000) {
      inMemoryAdminLogs.pop()
    }
  }

  return log
}

// Get admin logs
export async function getAdminLogs(limit: number = 100): Promise<readonly AdminLog[]> {
  const kv = await getKV()

  if (kv) {
    const logs = await kv.kv.lrange('admin:logs', 0, limit - 1) as string[]
    return logs.map(log => JSON.parse(log) as AdminLog)
  } else {
    return inMemoryAdminLogs.slice(0, limit)
  }
}

// Save weekly analysis report
export async function saveWeeklyReport(report: WeeklyAnalysisReport): Promise<void> {
  const kv = await getKV()

  if (kv) {
    await kv.kv.set(`report:${report.id}`, report)
    await kv.kv.lpush('reports:list', report.id)
  } else {
    inMemoryReports.unshift(report)
    if (inMemoryReports.length > 52) {
      inMemoryReports.pop()
    }
  }
}

// Get weekly reports
export async function getWeeklyReports(limit: number = 10): Promise<readonly WeeklyAnalysisReport[]> {
  const kv = await getKV()

  if (kv) {
    const ids = await kv.kv.lrange('reports:list', 0, limit - 1) as string[]
    const reports = await Promise.all(
      ids.map(id => kv.kv.get<WeeklyAnalysisReport>(`report:${id}`))
    )
    return reports.filter((r): r is WeeklyAnalysisReport => r !== null)
  } else {
    return inMemoryReports.slice(0, limit)
  }
}

// Get question statistics
export async function getQuestionStats(days: number = 7): Promise<{
  total: number
  successRate: number
  avgResponseTime: number
  byLocale: { ko: number; en: number }
  topQueries: readonly { query: string; count: number }[]
}> {
  const questions = await getRecentQuestions(days)

  const total = questions.length
  const successful = questions.filter(q => q.success).length
  const successRate = total > 0 ? (successful / total) * 100 : 0
  const avgResponseTime = total > 0
    ? questions.reduce((sum, q) => sum + q.responseTimeMs, 0) / total
    : 0

  const byLocale = {
    ko: questions.filter(q => q.locale === 'ko').length,
    en: questions.filter(q => q.locale === 'en').length,
  }

  // Count query frequencies (simplified)
  const queryCount = new Map<string, number>()
  for (const q of questions) {
    const normalized = q.query.toLowerCase().trim()
    queryCount.set(normalized, (queryCount.get(normalized) || 0) + 1)
  }

  const topQueries = Array.from(queryCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([query, count]) => ({ query, count }))

  return { total, successRate, avgResponseTime, byLocale, topQueries }
}
