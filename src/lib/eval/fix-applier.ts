/**
 * Fix Applier
 *
 * Applies approved eval fixes to the appropriate data store.
 * Routes fixes based on object_type to documents, insights, or page content.
 */

import { getSupabaseAdmin } from '@/lib/supabase'
import { upsertInsightUnit, upsertDocumentFromInsight } from '@/lib/db'
import type { EvalIssue, ApplyFixResult, ObjectType } from './types'

type ApplyHandler = (issue: EvalIssue) => Promise<ApplyFixResult>

const handlers: Record<ObjectType, ApplyHandler> = {
  document: applyDocumentFix,
  insight: applyInsightFix,
  page: applyPageFix,
  news: applyNewsFix,
}

/**
 * Apply an approved eval fix to the data store
 */
export async function applyEvalFix(issue: EvalIssue): Promise<ApplyFixResult> {
  if (!issue.suggested_fix) {
    throw new Error('Cannot apply fix: no suggested_fix provided')
  }

  const handler = handlers[issue.object_type]
  if (!handler) {
    throw new Error(`Unknown object_type: ${issue.object_type}`)
  }

  return handler(issue)
}

/**
 * Safely replace text in content with validation.
 * Throws if current_text is provided but not found in content.
 */
function safeReplace(content: string, currentText: string, newText: string): string {
  if (!content.includes(currentText)) {
    throw new Error(
      'Validation failed: current_text not found in content. ' +
      'Document may have been modified since issue was created.'
    )
  }
  // Escape regex special characters and replace ALL occurrences
  const escaped = currentText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return content.replace(new RegExp(escaped, 'g'), newText)
}

/**
 * Extract as_of from suggested_patch if present
 */
function extractPatchAsOf(issue: EvalIssue, fallback: string | null): string | null {
  const patch = issue.suggested_patch
  if (patch && typeof patch === 'object' && 'as_of' in patch) {
    return String(patch.as_of)
  }
  return fallback
}

/**
 * Update document content directly
 */
async function applyDocumentFix(issue: EvalIssue): Promise<ApplyFixResult> {
  const supabase = getSupabaseAdmin()

  if (!issue.object_id) {
    throw new Error('Cannot apply document fix: no object_id')
  }

  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('id, content, title, summary')
    .eq('id', issue.object_id)
    .single()

  if (fetchError || !doc) {
    throw new Error(`Document not found: ${issue.object_id}`)
  }

  const updatedContent = issue.current_text && doc.content
    ? safeReplace(doc.content, issue.current_text, issue.suggested_fix!)
    : issue.suggested_fix!

  const updatedSummary = issue.current_text && doc.summary && doc.summary.includes(issue.current_text)
    ? safeReplace(doc.summary, issue.current_text, issue.suggested_fix!)
    : doc.summary

  const { error: updateError } = await supabase
    .from('documents')
    .update({
      content: updatedContent,
      summary: updatedSummary,
      last_updated: new Date().toISOString(),
    })
    .eq('id', issue.object_id)

  if (updateError) {
    throw new Error(`Failed to update document: ${updateError.message}`)
  }

  return {
    success: true,
    applied_to: 'document',
    target_id: issue.object_id,
    action: 'updated_document',
    details: `Updated document ${doc.title ?? issue.object_id}`,
  }
}

/**
 * Update insight claim and sync to documents
 */
async function applyInsightFix(issue: EvalIssue): Promise<ApplyFixResult> {
  const supabase = getSupabaseAdmin()

  if (!issue.object_id) {
    throw new Error('Cannot apply insight fix: no object_id')
  }

  const { data: insight, error: fetchError } = await supabase
    .from('insights')
    .select('*')
    .eq('id', issue.object_id)
    .single()

  if (fetchError || !insight) {
    throw new Error(`Insight not found: ${issue.object_id}`)
  }

  const updatedClaim = issue.current_text && insight.claim.includes(issue.current_text)
    ? safeReplace(insight.claim, issue.current_text, issue.suggested_fix!)
    : issue.suggested_fix!

  const patchAsOf = extractPatchAsOf(issue, insight.as_of)

  const { error: updateError } = await supabase
    .from('insights')
    .update({
      claim: updatedClaim,
      as_of: patchAsOf,
      updated_at: new Date().toISOString(),
    })
    .eq('id', issue.object_id)

  if (updateError) {
    throw new Error(`Failed to update insight: ${updateError.message}`)
  }

  await upsertDocumentFromInsight({
    id: insight.id,
    topic: insight.topic,
    claim: updatedClaim,
    rationale: insight.rationale,
    tags: insight.tags,
    confidence: insight.confidence,
    as_of: patchAsOf,
  })

  return {
    success: true,
    applied_to: 'insight',
    target_id: issue.object_id,
    action: 'updated_insight',
    details: `Updated insight "${insight.topic}" and synced to documents`,
  }
}

/**
 * Create insight from page content fix, then sync to documents
 */
async function applyPageFix(issue: EvalIssue): Promise<ApplyFixResult> {
  const patchAsOf = extractPatchAsOf(issue, null)

  const insightId = await upsertInsightUnit({
    topic: issue.object_locator ?? issue.claim.slice(0, 80),
    claim: issue.suggested_fix!,
    rationale: `Eval fix: ${issue.claim} (was: "${issue.current_text ?? 'unknown'}")`,
    evidence_ids: [],
    tags: ['eval-fix', issue.object_type],
    confidence: issue.confidence,
    as_of: patchAsOf,
  })

  await upsertDocumentFromInsight({
    id: insightId,
    topic: issue.object_locator ?? issue.claim.slice(0, 80),
    claim: issue.suggested_fix!,
    rationale: `Eval fix: ${issue.claim} (was: "${issue.current_text ?? 'unknown'}")`,
    tags: ['eval-fix', issue.object_type],
    confidence: issue.confidence,
    as_of: patchAsOf,
  })

  return {
    success: true,
    applied_to: 'page',
    target_id: insightId,
    action: 'created_insight',
    details: `Created insight "${issue.object_locator}" from page eval fix`,
  }
}

/**
 * Update news document or create insight from news fix
 */
async function applyNewsFix(issue: EvalIssue): Promise<ApplyFixResult> {
  const supabase = getSupabaseAdmin()

  if (issue.object_id) {
    const { data: doc } = await supabase
      .from('documents')
      .select('id, content, title')
      .eq('id', issue.object_id)
      .single()

    if (doc) {
      const updatedContent = issue.current_text && doc.content && doc.content.includes(issue.current_text)
        ? safeReplace(doc.content, issue.current_text, issue.suggested_fix!)
        : issue.suggested_fix!

      const { error: updateError } = await supabase
        .from('documents')
        .update({
          content: updatedContent,
          last_updated: new Date().toISOString(),
        })
        .eq('id', issue.object_id)

      if (updateError) {
        throw new Error(`Failed to update news document: ${updateError.message}`)
      }

      return {
        success: true,
        applied_to: 'news',
        target_id: issue.object_id,
        action: 'updated_document',
        details: `Updated news document "${doc.title ?? issue.object_id}"`,
      }
    }
  }

  const patchAsOf = extractPatchAsOf(issue, null)

  const insightId = await upsertInsightUnit({
    topic: issue.object_locator ?? issue.claim.slice(0, 80),
    claim: issue.suggested_fix!,
    rationale: `News eval correction: ${issue.claim}`,
    evidence_ids: [],
    tags: ['eval-fix', 'news'],
    confidence: issue.confidence,
    as_of: patchAsOf,
  })

  await upsertDocumentFromInsight({
    id: insightId,
    topic: issue.object_locator ?? issue.claim.slice(0, 80),
    claim: issue.suggested_fix!,
    rationale: `News eval correction: ${issue.claim}`,
    tags: ['eval-fix', 'news'],
    confidence: issue.confidence,
    as_of: patchAsOf,
  })

  return {
    success: true,
    applied_to: 'news',
    target_id: insightId,
    action: 'created_insight',
    details: `Created corrective insight from news eval`,
  }
}
