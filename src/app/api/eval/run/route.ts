import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import {
  extractClaims,
  extractClaimsFromObject,
  getActiveSources,
  checkRules,
  verifyClaim,
  type EvalRun,
  type EvalIssue,
  type RunType,
  type ExtractedClaim,
  type VerificationResult,
} from '@/lib/eval'

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

const EvalRunRequestSchema = z.object({
  run_type: z.enum(['daily_rules', 'weekly_factcheck', 'on_demand']),
  scope: z
    .object({
      pages: z.array(z.string()).optional(),
      documents: z.array(z.string()).optional(),
      since: z.string().optional(),
    })
    .optional(),
  dry_run: z.boolean().optional().default(false),
})

/**
 * Create a new eval run record
 */
async function createEvalRun(runType: RunType, scope: Record<string, unknown>): Promise<string> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('eval_runs')
    .insert({
      run_type: runType,
      scope,
      model: 'claude-sonnet-4',
      status: 'running',
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to create eval run: ${error.message}`)
  }

  return data.id
}

/**
 * Update eval run status
 */
async function updateEvalRun(
  runId: string,
  update: Partial<Pick<EvalRun, 'status' | 'finished_at' | 'summary' | 'logs'>>
): Promise<void> {
  const supabase = getSupabaseAdmin()

  const { error } = await supabase.from('eval_runs').update(update).eq('id', runId)

  if (error) {
    throw new Error(`Failed to update eval run: ${error.message}`)
  }
}

/**
 * Create eval issue record
 */
async function createEvalIssue(issue: Omit<EvalIssue, 'id' | 'created_at' | 'updated_at' | 'approved_at' | 'approved_by'>): Promise<string> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase.from('eval_issues').insert(issue).select('id').single()

  if (error) {
    throw new Error(`Failed to create eval issue: ${error.message}`)
  }

  return data.id
}

/**
 * Fetch site snapshot for evaluation
 */
async function fetchSiteSnapshot(secret: string): Promise<Record<string, unknown>> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const response = await fetch(`${baseUrl}/api/export/site-snapshot`, {
    headers: { 'x-cron-secret': secret },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch site snapshot: ${response.statusText}`)
  }

  const data = await response.json()
  return data.pages || {}
}

/**
 * Fetch knowledge snapshot for evaluation
 */
async function fetchKnowledgeSnapshot(
  secret: string,
  since?: string
): Promise<{ documents: unknown[]; insights: unknown[] }> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const params = new URLSearchParams()
  if (since) params.set('since', since)
  params.set('limit', '200')

  const response = await fetch(`${baseUrl}/api/export/knowledge-snapshot?${params}`, {
    headers: { 'x-cron-secret': secret },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch knowledge snapshot: ${response.statusText}`)
  }

  const data = await response.json()
  return {
    documents: data.documents || [],
    insights: data.insights || [],
  }
}

/**
 * Run daily rules check (quick, pattern-based)
 */
async function runDailyRules(runId: string, scope: Record<string, unknown>): Promise<number> {
  const secret = process.env.CRON_SECRET || ''
  const pages = await fetchSiteSnapshot(secret)
  const sources = await getActiveSources()

  const logs: string[] = []
  let issueCount = 0

  // Extract claims from site data
  const claims: ExtractedClaim[] = []
  const pagesArray = scope.pages as string[] | undefined

  for (const [pageName, pageData] of Object.entries(pages)) {
    if (pagesArray && !pagesArray.includes(pageName)) continue

    // Extract structured claims
    const pageClaims = extractClaimsFromObject(pageData, pageName)
    claims.push(...pageClaims)
    logs.push(`Extracted ${pageClaims.length} claims from ${pageName}`)
  }

  // Quick rule check
  for (const claim of claims) {
    const { needsLLMVerification, hints, relevantSources } = checkRules(claim, sources)

    if (hints.length > 0) {
      // Create issue for flagged claims
      await createEvalIssue({
        run_id: runId,
        object_type: 'page',
        object_id: claim.object_locator.split('.')[0],
        object_locator: claim.object_locator,
        claim: claim.claim,
        claim_type: claim.claim_type,
        status: 'open',
        verdict: 'unverifiable',
        severity: 'low',
        confidence: 0.5,
        current_text: claim.current_text,
        suggested_fix: hints.join('; '),
        suggested_patch: null,
        references: relevantSources.map((s) => ({ url: s.base_url, source: s.name })),
      })
      issueCount++
    }
  }

  await updateEvalRun(runId, {
    logs: logs.join('\n'),
  })

  return issueCount
}

/**
 * Run weekly factcheck (LLM-based verification)
 */
async function runWeeklyFactcheck(runId: string, scope: Record<string, unknown>): Promise<number> {
  const secret = process.env.CRON_SECRET || ''
  const pages = await fetchSiteSnapshot(secret)
  const { documents, insights } = await fetchKnowledgeSnapshot(secret, scope.since as string | undefined)
  const sources = await getActiveSources()

  const logs: string[] = []
  let issueCount = 0
  const summary: Record<string, number> = {
    supported: 0,
    needs_update: 0,
    contradicted: 0,
    unverifiable: 0,
  }

  // Extract claims from high-priority pages
  const priorityPages = ['economy', 'legal', 'politics']
  const claims: Array<{ claim: ExtractedClaim; objectType: 'page' | 'document' | 'insight' }> = []

  for (const pageName of priorityPages) {
    if (!pages[pageName]) continue

    // Use LLM to extract more nuanced claims
    const pageContent = JSON.stringify(pages[pageName])
    const extractedClaims = await extractClaims(pageContent.slice(0, 8000), {
      page: pageName,
      locale: 'ko',
    })

    claims.push(...extractedClaims.map((c) => ({ claim: c, objectType: 'page' as const })))
    logs.push(`Extracted ${extractedClaims.length} LLM claims from ${pageName}`)
  }

  // Also check recent documents/insights
  const recentDocs = (documents as Array<{ title: string; content: string; id: string }>).slice(0, 10)
  for (const doc of recentDocs) {
    const docClaims = await extractClaims(`${doc.title}\n${doc.content}`.slice(0, 4000), {
      section: 'documents',
    })
    claims.push(...docClaims.map((c) => ({ claim: c, objectType: 'document' as const })))
  }

  logs.push(`Total claims to verify: ${claims.length}`)

  // Verify claims (limit to prevent timeout)
  const claimsToVerify = claims.slice(0, 30)

  for (const { claim, objectType } of claimsToVerify) {
    const { relevantSources } = checkRules(claim, sources)

    const result: VerificationResult = await verifyClaim({
      claim,
      sourceContent: '',
      relevantSources,
    })

    summary[result.verdict] = (summary[result.verdict] || 0) + 1

    // Create issue for non-supported verdicts
    if (result.verdict !== 'supported') {
      await createEvalIssue({
        run_id: runId,
        object_type: objectType,
        object_id: claim.object_locator.split('.')[0],
        object_locator: claim.object_locator,
        claim: claim.claim,
        claim_type: claim.claim_type,
        status: 'open',
        verdict: result.verdict,
        severity: result.severity,
        confidence: result.confidence,
        current_text: claim.current_text,
        suggested_fix: result.suggested_fix,
        suggested_patch: result.suggested_patch as Record<string, unknown> | null,
        references: result.references,
      })
      issueCount++
    }
  }

  await updateEvalRun(runId, {
    logs: logs.join('\n'),
    summary: { total_claims: claimsToVerify.length, by_verdict: summary },
  })

  return issueCount
}

/**
 * POST /api/eval/run
 *
 * Trigger an evaluation run
 *
 * Body:
 * - run_type: 'daily_rules' | 'weekly_factcheck' | 'on_demand'
 * - scope: { pages?: string[], documents?: string[], since?: string }
 * - dry_run: boolean (default false)
 *
 * Auth: x-cron-secret header
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Auth check
    const cronSecret = request.headers.get('x-cron-secret')
    const expectedCronSecret = process.env.CRON_SECRET

    if (!expectedCronSecret || cronSecret !== expectedCronSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate body
    const body = await request.json()
    const parseResult = EvalRunRequestSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parseResult.error.issues },
        { status: 400 }
      )
    }

    const { run_type, scope = {}, dry_run } = parseResult.data

    // Dry run mode - just return what would be checked
    if (dry_run) {
      return NextResponse.json({
        success: true,
        dry_run: true,
        run_type,
        scope,
        message: `Would run ${run_type} evaluation`,
      })
    }

    // Create eval run record
    const runId = await createEvalRun(run_type, scope)

    try {
      let issueCount = 0

      if (run_type === 'daily_rules') {
        issueCount = await runDailyRules(runId, scope)
      } else if (run_type === 'weekly_factcheck') {
        issueCount = await runWeeklyFactcheck(runId, scope)
      } else {
        // on_demand - run both
        issueCount = await runDailyRules(runId, scope)
        issueCount += await runWeeklyFactcheck(runId, scope)
      }

      // Mark as done
      await updateEvalRun(runId, {
        status: 'done',
        finished_at: new Date().toISOString(),
      })

      return NextResponse.json({
        success: true,
        run_id: runId,
        run_type,
        issues_found: issueCount,
        status: 'done',
      })
    } catch (evalError) {
      // Mark as failed
      await updateEvalRun(runId, {
        status: 'failed',
        finished_at: new Date().toISOString(),
        logs: evalError instanceof Error ? evalError.message : 'Unknown error',
      })

      throw evalError
    }
  } catch (error) {
    console.error('Eval run error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}

/**
 * GET /api/eval/run
 *
 * Get recent eval runs
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    // Auth check
    const cronSecret = request.headers.get('x-cron-secret')
    const expectedCronSecret = process.env.CRON_SECRET

    if (!expectedCronSecret || cronSecret !== expectedCronSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '10', 10)

    const supabase = getSupabaseAdmin()

    const { data: runs, error } = await supabase
      .from('eval_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(Math.min(limit, 50))

    if (error) {
      throw new Error(`Failed to fetch runs: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      runs,
    })
  } catch (error) {
    console.error('Get eval runs error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
