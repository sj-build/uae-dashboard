// Admin logs API endpoint

import { NextResponse } from 'next/server'
import { getAdminLogs, getQuestionStats, getWeeklyReports } from '@/lib/question-logger'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    // Get admin logs
    const logs = await getAdminLogs(limit)

    // Filter by type if specified
    const filteredLogs = type === 'all'
      ? logs
      : logs.filter(log => log.type === type)

    // Get question stats for summary
    const stats = await getQuestionStats(7)

    // Get recent weekly reports
    const reports = await getWeeklyReports(5)

    return NextResponse.json({
      success: true,
      logs: filteredLogs,
      stats: {
        totalQuestions: stats.total,
        successRate: Math.round(stats.successRate * 10) / 10,
        avgResponseTime: Math.round(stats.avgResponseTime),
        byLocale: stats.byLocale,
      },
      reports: reports.map(r => ({
        id: r.id,
        weekStartDate: r.weekStartDate,
        weekEndDate: r.weekEndDate,
        totalQuestions: r.totalQuestions,
        successRate: r.successRate,
        contentGapsCount: r.contentGaps.length,
        improvementsCount: r.suggestedImprovements.length,
        status: r.status,
      })),
    })
  } catch (error) {
    console.error('Admin logs API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch logs' },
      { status: 500 }
    )
  }
}
