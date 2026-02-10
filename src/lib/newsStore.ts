/**
 * News item persistence layer
 *
 * Core design: save title+summary immediately on conflict skip.
 * Fulltext is optional and tracked via fulltext_status.
 */

import { getSupabaseAdmin } from './supabase'
import { upsertDocumentFromNews } from './db'
import type { NaverNewsItem } from './naver'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SaveResult {
  readonly saved: number
  readonly skipped: number
  readonly errors: number
  readonly documentsSynced: number
}

export interface IngestionRun {
  readonly id: number
  readonly provider: string
  readonly status: 'running' | 'success' | 'partial' | 'failed'
  readonly queries: string[]
  readonly fetched: number
  readonly saved: number
  readonly skipped: number
  readonly errors: number
  readonly duration_ms: number | null
  readonly started_at: string
  readonly finished_at: string | null
}

// ---------------------------------------------------------------------------
// Save news items (upsert with content_hash dedup)
// ---------------------------------------------------------------------------

export async function saveNewsItems(
  items: readonly NaverNewsItem[],
  options?: { category?: string; syncToDocuments?: boolean },
): Promise<SaveResult> {
  if (items.length === 0) {
    return { saved: 0, skipped: 0, errors: 0, documentsSynced: 0 }
  }

  const supabase = getSupabaseAdmin()
  const { category, syncToDocuments = true } = options ?? {}

  // Build rows for batch upsert
  const rows = items.map(item => ({
    provider: item.provider,
    url: item.url,
    title: item.title,
    summary: item.summary || null,
    published_at: item.published_at,
    publisher: item.publisher,
    language: 'ko',
    category: category ?? null,
    tags: [] as string[],
    content_hash: item.content_hash,
    meta: item.meta,
    fulltext_status: 'none',
  }))

  // Batch upsert — ignoreDuplicates skips existing rows silently
  const { data: inserted, error } = await supabase
    .from('news_items')
    .upsert(rows, { onConflict: 'content_hash', ignoreDuplicates: true })
    .select('content_hash')

  let saved: number
  let errors = 0

  if (error) {
    // Entire batch failed
    return { saved: 0, skipped: 0, errors: items.length, documentsSynced: 0 }
  }

  // inserted contains only newly saved rows (duplicates are skipped)
  const savedHashes = new Set((inserted ?? []).map(r => r.content_hash as string))
  saved = savedHashes.size
  const skipped = items.length - saved

  // Sync saved items to documents table for RAG
  let documentsSynced = 0
  if (syncToDocuments && saved > 0) {
    const savedItems = items.filter(item => savedHashes.has(item.content_hash))
    for (const item of savedItems) {
      try {
        await upsertDocumentFromNews({
          title: item.title,
          url: item.url,
          summary: item.summary || null,
          publisher: item.publisher,
          published_at: item.published_at,
          tags: [],
          category,
        })
        documentsSynced++
      } catch {
        errors++
      }
    }
  }

  return { saved, skipped, errors, documentsSynced }
}

// ---------------------------------------------------------------------------
// Ingestion run logging
// ---------------------------------------------------------------------------

export async function startIngestionRun(
  provider: string,
  queries: readonly string[],
): Promise<number> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('ingestion_runs')
    .insert({
      provider,
      status: 'running',
      queries: [...queries],
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to create ingestion run: ${error.message}`)
  }

  return data.id as number
}

export async function finishIngestionRun(
  runId: number,
  result: {
    status: 'success' | 'partial' | 'failed'
    fetched: number
    saved: number
    skipped: number
    errors: number
    duration_ms: number
    meta?: Record<string, unknown>
  },
): Promise<void> {
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('ingestion_runs')
    .update({
      status: result.status,
      fetched: result.fetched,
      saved: result.saved,
      skipped: result.skipped,
      errors: result.errors,
      duration_ms: result.duration_ms,
      meta: result.meta ?? {},
      finished_at: new Date().toISOString(),
    })
    .eq('id', runId)

  if (error) {
    throw new Error(`Failed to update ingestion run: ${error.message}`)
  }
}

// ---------------------------------------------------------------------------
// Get recent ingestion runs (for admin visibility)
// ---------------------------------------------------------------------------

export async function getRecentIngestionRuns(
  provider?: string,
  limit = 20,
): Promise<readonly IngestionRun[]> {
  const supabase = getSupabaseAdmin()

  let query = supabase
    .from('ingestion_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit)

  if (provider) {
    query = query.eq('provider', provider)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch ingestion runs: ${error.message}`)
  }

  return (data ?? []) as IngestionRun[]
}
