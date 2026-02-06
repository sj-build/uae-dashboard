// Weekly analysis cron job
// Runs every Sunday at midnight UTC
// Vercel Cron: Add to vercel.json: { "crons": [{ "path": "/api/cron/weekly-analysis", "schedule": "0 0 * * 0" }] }

import { NextResponse } from 'next/server'
import { getAnthropicClient } from '@/lib/anthropic'
import {
  getRecentQuestions,
  getQuestionStats,
  saveWeeklyReport,
  logAdminAction,
} from '@/lib/question-logger'
import type { WeeklyAnalysisReport, ContentGap, SuggestedImprovement, TopicStat } from '@/types/question-log'

// Verify cron secret for security
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET) {
    // Allow in development without secret
    return process.env.NODE_ENV === 'development'
  }
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// Analyze questions with Claude
async function analyzeQuestionsWithAI(questions: readonly { query: string; success: boolean }[]): Promise<{
  topTopics: TopicStat[]
  contentGaps: ContentGap[]
  suggestedImprovements: SuggestedImprovement[]
}> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { topTopics: [], contentGaps: [], suggestedImprovements: [] }
  }

  const client = getAnthropicClient()

  const prompt = `You are analyzing user questions from a UAE information dashboard called "All About UAE".

Here are the questions users asked this week:
${questions.map((q, i) => `${i + 1}. "${q.query}" (${q.success ? 'answered successfully' : 'failed to answer'})`).join('\n')}

Analyze these questions and provide insights in the following JSON format:
{
  "topTopics": [
    { "topic": "topic name", "count": number, "percentage": number, "avgResponseTime": 0, "successRate": number }
  ],
  "contentGaps": [
    { "topic": "topic that needs more coverage", "questionExamples": ["example questions"], "reason": "why this is a gap", "priority": "high|medium|low" }
  ],
  "suggestedImprovements": [
    { "type": "add|update|remove", "targetFile": "suggested file path", "description": "what to change", "reason": "why this improvement helps" }
  ]
}

Focus on:
1. Grouping similar questions into topics
2. Identifying questions that couldn't be answered well (content gaps)
3. Suggesting specific improvements to the dashboard content

Keep the analysis concise and actionable. Return ONLY the JSON object, no markdown.`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = message.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('')

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        topTopics: (parsed.topTopics || []).map((t: TopicStat) => ({
          ...t,
          avgResponseTime: t.avgResponseTime || 0,
        })),
        contentGaps: (parsed.contentGaps || []).map((g: ContentGap) => ({
          ...g,
          priority: g.priority || 'medium',
        })),
        suggestedImprovements: (parsed.suggestedImprovements || []).map((s: Omit<SuggestedImprovement, 'id' | 'status'>) => ({
          id: generateId(),
          ...s,
          status: 'pending' as const,
        })),
      }
    }
  } catch (error) {
    console.error('AI analysis error:', error)
  }

  return { topTopics: [], contentGaps: [], suggestedImprovements: [] }
}

export async function GET(request: Request) {
  // Verify cron secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get questions from the last 7 days
    const questions = await getRecentQuestions(7)
    const stats = await getQuestionStats(7)

    if (questions.length === 0) {
      await logAdminAction({
        type: 'analysis',
        action: 'Weekly analysis skipped',
        details: 'No questions recorded this week',
      })

      return NextResponse.json({
        success: true,
        message: 'No questions to analyze this week',
      })
    }

    // Analyze questions with AI
    const analysis = await analyzeQuestionsWithAI(
      questions.map(q => ({ query: q.query, success: q.success }))
    )

    // Create weekly report
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const report: WeeklyAnalysisReport = {
      id: generateId(),
      weekStartDate: weekAgo.toISOString().split('T')[0],
      weekEndDate: now.toISOString().split('T')[0],
      generatedAt: now.toISOString(),
      totalQuestions: stats.total,
      successRate: stats.successRate,
      topTopics: analysis.topTopics,
      contentGaps: analysis.contentGaps,
      suggestedImprovements: analysis.suggestedImprovements,
      status: 'pending',
    }

    // Save report
    await saveWeeklyReport(report)

    // Log the analysis
    await logAdminAction({
      type: 'analysis',
      action: 'Weekly analysis completed',
      details: `Analyzed ${stats.total} questions. Found ${analysis.contentGaps.length} content gaps, ${analysis.suggestedImprovements.length} improvement suggestions.`,
      metadata: {
        reportId: report.id,
        totalQuestions: stats.total,
        successRate: stats.successRate,
        contentGapsCount: analysis.contentGaps.length,
        improvementsCount: analysis.suggestedImprovements.length,
      },
    })

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        totalQuestions: stats.total,
        successRate: stats.successRate,
        contentGapsCount: analysis.contentGaps.length,
        improvementsCount: analysis.suggestedImprovements.length,
      },
    })
  } catch (error) {
    console.error('Weekly analysis error:', error)

    await logAdminAction({
      type: 'analysis',
      action: 'Weekly analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      { error: 'Analysis failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Also allow POST for manual triggers from admin
export async function POST(request: Request) {
  return GET(request)
}
