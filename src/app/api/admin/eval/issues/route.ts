import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { applyEvalFix } from '@/lib/eval/fix-applier'
import { logAdminAction } from '@/lib/question-logger'
import type { EvalIssue } from '@/lib/eval/types'

export const maxDuration = 55

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Supabase configuration missing')
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}

const UpdateIssueSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['open', 'triaged', 'fixed', 'dismissed']),
})

const ActionSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(['approve', 'dismiss']),
})

/**
 * GET /api/admin/eval/issues
 *
 * Fetch eval issues with optional status filter
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100)

    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('eval_issues')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch issues: ${error.message}`)
    }

    return NextResponse.json({ success: true, data: data ?? [] })
  } catch (error) {
    console.error('Admin eval issues GET error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/eval/issues
 *
 * Update issue status
 */
export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json()
    const parseResult = UpdateIssueSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 400 }
      )
    }

    const { id, status } = parseResult.data
    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('eval_issues')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to update issue: ${error.message}`)
    }

    return NextResponse.json({ success: true, id, status })
  } catch (error) {
    console.error('Admin eval issues error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}

/**
 * POST /api/admin/eval/issues
 *
 * Approve or dismiss an eval issue
 *
 * approve: apply fix → status=fixed, approved_at=now
 * dismiss: status=dismissed, approved_at=now
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json()
    const parseResult = ActionSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request: requires { id, action }' },
        { status: 400 }
      )
    }

    const { id, action } = parseResult.data
    const supabase = getSupabaseAdmin()

    // Fetch the issue
    const { data: issue, error: fetchError } = await supabase
      .from('eval_issues')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !issue) {
      return NextResponse.json(
        { success: false, error: 'Issue not found' },
        { status: 404 }
      )
    }

    // Prevent duplicate processing
    if (issue.status === 'fixed' || issue.status === 'dismissed') {
      return NextResponse.json(
        { success: false, error: `Issue already ${issue.status}` },
        { status: 409 }
      )
    }

    const now = new Date().toISOString()

    if (action === 'dismiss') {
      const { error: updateError } = await supabase
        .from('eval_issues')
        .update({
          status: 'dismissed',
          approved_at: now,
          approved_by: 'admin',
          updated_at: now,
        })
        .eq('id', id)

      if (updateError) {
        throw new Error(`Failed to dismiss issue: ${updateError.message}`)
      }

      await logAdminAction({
        type: 'manual',
        action: 'eval_dismiss',
        details: `Dismissed eval issue: ${issue.claim.slice(0, 100)}`,
        metadata: { issue_id: id, object_type: issue.object_type },
      })

      return NextResponse.json({ success: true, id, status: 'dismissed' })
    }

    // action === 'approve'
    if (!issue.suggested_fix) {
      return NextResponse.json(
        { success: false, error: 'Cannot approve: no suggested_fix available' },
        { status: 400 }
      )
    }

    // Mark as triaged first to prevent double-processing
    const { error: triagedError } = await supabase
      .from('eval_issues')
      .update({ status: 'triaged', updated_at: now })
      .eq('id', id)

    if (triagedError) {
      throw new Error(`Failed to mark issue as processing: ${triagedError.message}`)
    }

    let result
    try {
      result = await applyEvalFix(issue as EvalIssue)
    } catch (applyError) {
      // Rollback to open if fix fails
      await supabase
        .from('eval_issues')
        .update({ status: 'open', updated_at: new Date().toISOString() })
        .eq('id', id)
      throw applyError
    }

    // Mark as fixed
    const { error: updateError } = await supabase
      .from('eval_issues')
      .update({
        status: 'fixed',
        approved_at: now,
        approved_by: 'admin',
        updated_at: now,
      })
      .eq('id', id)

    if (updateError) {
      throw new Error(`Fix applied but status update failed: ${updateError.message}`)
    }

    await logAdminAction({
      type: 'manual',
      action: 'eval_approve',
      details: `Approved and applied eval fix: ${result.details}`,
      metadata: {
        issue_id: id,
        object_type: issue.object_type,
        applied_action: result.action,
        target_id: result.target_id,
      },
    })

    return NextResponse.json({
      success: true,
      id,
      status: 'fixed',
      applied: result,
    })
  } catch (error) {
    console.error('Admin eval issues POST error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
