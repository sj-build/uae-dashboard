// API endpoint to get and update weekly analysis reports

import { NextResponse } from 'next/server'
import { logAdminAction } from '@/lib/question-logger'
import type { WeeklyAnalysisReport } from '@/types/question-log'

// In-memory storage for development (same as question-logger)
const inMemoryReports: Map<string, WeeklyAnalysisReport> = new Map()

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

// Verify admin authorization
function verifyAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET) {
    return process.env.NODE_ENV === 'development'
  }
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const kv = await getKV()
    let report: WeeklyAnalysisReport | null = null

    if (kv) {
      report = await kv.kv.get<WeeklyAnalysisReport>(`report:${id}`)
    } else {
      report = inMemoryReports.get(id) || null
    }

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, report })
  } catch (error) {
    console.error('Get report error:', error)
    return NextResponse.json(
      { error: 'Failed to get report' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json() as { status?: string; improvementId?: string; improvementStatus?: string }
    const kv = await getKV()
    let report: WeeklyAnalysisReport | null = null

    if (kv) {
      report = await kv.kv.get<WeeklyAnalysisReport>(`report:${id}`)
    } else {
      report = inMemoryReports.get(id) || null
    }

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Update report status
    if (body.status) {
      const updatedReport: WeeklyAnalysisReport = {
        ...report,
        status: body.status as 'pending' | 'approved' | 'rejected' | 'applied',
      }

      if (kv) {
        await kv.kv.set(`report:${id}`, updatedReport)
      } else {
        inMemoryReports.set(id, updatedReport)
      }

      await logAdminAction({
        type: 'manual',
        action: `Report ${body.status}`,
        details: `Weekly report ${id} marked as ${body.status}`,
        metadata: { reportId: id, newStatus: body.status },
      })

      return NextResponse.json({ success: true, report: updatedReport })
    }

    // Update specific improvement status
    if (body.improvementId && body.improvementStatus) {
      const updatedImprovements = report.suggestedImprovements.map(imp =>
        imp.id === body.improvementId
          ? { ...imp, status: body.improvementStatus as 'pending' | 'approved' | 'rejected' | 'applied' }
          : imp
      )

      const updatedReport: WeeklyAnalysisReport = {
        ...report,
        suggestedImprovements: updatedImprovements,
      }

      if (kv) {
        await kv.kv.set(`report:${id}`, updatedReport)
      } else {
        inMemoryReports.set(id, updatedReport)
      }

      await logAdminAction({
        type: 'manual',
        action: `Improvement ${body.improvementStatus}`,
        details: `Improvement ${body.improvementId} marked as ${body.improvementStatus}`,
        metadata: { reportId: id, improvementId: body.improvementId, newStatus: body.improvementStatus },
      })

      return NextResponse.json({ success: true, report: updatedReport })
    }

    return NextResponse.json({ error: 'No valid update provided' }, { status: 400 })
  } catch (error) {
    console.error('Update report error:', error)
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    )
  }
}
