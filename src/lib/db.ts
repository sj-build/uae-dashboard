/**
 * Database utility functions for knowledge accumulation
 * All functions use service role (server-only)
 */

import { getSupabaseAdmin } from './supabase'
import { sha256 } from './hash'
import type { SourceRef, InsightUnitInput } from './types'

// =============================================================================
// Documents: Unified knowledge layer
// =============================================================================

export async function upsertDocumentFromNews(article: {
  title: string
  url: string
  summary?: string | null
  publisher?: string | null
  published_at?: string | null
  tags?: string[] | null
  category?: string | null
}) {
  const supabase = getSupabaseAdmin()
  const content = [article.title, article.summary ?? ''].filter(Boolean).join('\n\n')
  const content_hash = sha256(article.url)

  const { data, error } = await supabase
    .from('documents')
    .upsert({
      source: 'news',
      title: article.title,
      content,
      summary: article.summary ?? null,
      url: article.url,
      tags: article.tags ?? [],
      category: article.category ?? null,
      metadata: {
        publisher: article.publisher ?? null,
      },
      published_at: article.published_at ?? null,
      content_hash,
      last_updated: new Date().toISOString(),
    }, { onConflict: 'content_hash' })
    .select('id')
    .single()

  if (error && !error.message.includes('duplicate')) {
    console.error('upsertDocumentFromNews error:', error)
    throw error
  }

  return data?.id as string | undefined
}

export async function upsertDocumentFromAskMe(session: {
  question: string
  answer: string
  sources_used?: SourceRef[]
  created_at?: string
}) {
  const supabase = getSupabaseAdmin()
  const content = `Q: ${session.question}\n\nA: ${session.answer}`
  const content_hash = sha256(session.question + '|' + session.answer.slice(0, 500))

  const { data, error } = await supabase
    .from('documents')
    .upsert({
      source: 'askme',
      title: session.question,
      content,
      summary: session.answer.slice(0, 300),
      tags: [],
      metadata: { sources_used: session.sources_used ?? [] },
      content_hash,
      last_updated: new Date().toISOString(),
    }, { onConflict: 'content_hash' })
    .select('id')
    .single()

  if (error && !error.message.includes('duplicate')) {
    console.error('upsertDocumentFromAskMe error:', error)
    throw error
  }

  return data?.id as string | undefined
}

export async function upsertDocumentFromInsight(insight: {
  id: string
  topic: string
  claim: string
  rationale: string
  tags?: string[]
  confidence: number
  as_of?: string | null
}) {
  const supabase = getSupabaseAdmin()
  const content = `Claim: ${insight.claim}\n\nRationale: ${insight.rationale}`
  const content_hash = sha256('insight|' + insight.id)

  const { error } = await supabase
    .from('documents')
    .upsert({
      source: 'insight',
      title: insight.topic,
      content,
      summary: insight.claim,
      tags: insight.tags ?? [],
      metadata: { insight_id: insight.id, confidence: insight.confidence },
      as_of: insight.as_of ?? null,
      content_hash,
      last_updated: new Date().toISOString(),
    }, { onConflict: 'content_hash' })

  if (error && !error.message.includes('duplicate')) {
    console.error('upsertDocumentFromInsight error:', error)
    throw error
  }
}

// =============================================================================
// Places: Neighborhood guide → RAG documents
// =============================================================================

export async function upsertDocumentFromPlace(place: {
  id: string
  slug: string
  city: string
  name_en: string
  name_ko: string
  tagline_en: string
  tagline_ko: string
  categories: string[]
  best_for: string[]
  description_en: string
  description_ko: string
  highlights: Array<{ label: string; value: string }>
  practical: { access: string; vibe: string; typical_meetings: string; tips: string }
  free_zone?: { is_free_zone: boolean; name?: string; focus?: string; benefits?: string[] } | null
  keywords: string[]
  as_of?: string | null
  confidence?: number
}) {
  const supabase = getSupabaseAdmin()

  const highlightsText = place.highlights
    .map(h => `- ${h.label}: ${h.value}`)
    .join('\n')

  const practicalText = [
    `접근성: ${place.practical.access}`,
    `분위기: ${place.practical.vibe}`,
    `주요 미팅: ${place.practical.typical_meetings}`,
    `팁: ${place.practical.tips}`,
  ].join('\n')

  const freeZoneText = place.free_zone?.is_free_zone
    ? `프리존: ${place.free_zone.name ?? ''} — ${place.free_zone.focus ?? ''}`
    : ''

  const content = [
    `${place.name_ko} (${place.name_en}) — ${place.city === 'abudhabi' ? '아부다비' : '두바이'}`,
    place.tagline_ko,
    '',
    place.description_ko,
    '',
    '주요 하이라이트:',
    highlightsText,
    '',
    '실용 정보:',
    practicalText,
    freeZoneText ? `\n${freeZoneText}` : '',
  ].filter(Boolean).join('\n')

  const content_hash = sha256('place|' + place.slug)

  const { data, error } = await supabase
    .from('documents')
    .upsert({
      source: 'place',
      title: `${place.name_ko} (${place.name_en})`,
      content,
      summary: place.tagline_ko,
      tags: [...place.categories, ...place.keywords, place.city],
      metadata: { place_id: place.id, slug: place.slug, city: place.city },
      as_of: place.as_of ?? null,
      content_hash,
      last_updated: new Date().toISOString(),
    }, { onConflict: 'content_hash' })
    .select('id')
    .single()

  if (error && !error.message.includes('duplicate')) {
    console.error('upsertDocumentFromPlace error:', error)
    throw error
  }

  return data?.id as string | undefined
}

// =============================================================================
// Insights: Structured insight units
// =============================================================================

export async function upsertInsightUnit(u: InsightUnitInput): Promise<string> {
  const supabase = getSupabaseAdmin()
  const content_hash = sha256(
    [u.topic, u.sector ?? '', u.claim, u.rationale, JSON.stringify(u.evidence_ids ?? [])].join('|')
  )

  const { data, error } = await supabase
    .from('insights')
    .upsert({
      topic: u.topic,
      sector: u.sector ?? null,
      claim: u.claim,
      rationale: u.rationale,
      evidence_ids: u.evidence_ids ?? [],
      tags: u.tags ?? [],
      confidence: u.confidence ?? 0.6,
      as_of: u.as_of ?? null,
      content_hash,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'content_hash' })
    .select('id')
    .single()

  if (error) {
    console.error('upsertInsightUnit error:', error)
    throw error
  }

  return data?.id as string
}

export async function getRecentInsights(options?: {
  sector?: string
  limit?: number
  minConfidence?: number
}): Promise<Array<{
  id: string
  topic: string
  sector: string | null
  claim: string
  rationale: string
  evidence_ids: string[]
  tags: string[]
  confidence: number
  as_of: string | null
  created_at: string
}>> {
  const supabase = getSupabaseAdmin()
  const { sector, limit = 20, minConfidence = 0.5 } = options ?? {}

  let query = supabase
    .from('insights')
    .select('*')
    .gte('confidence', minConfidence)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (sector) {
    query = query.eq('sector', sector)
  }

  const { data, error } = await query

  if (error) {
    console.error('getRecentInsights error:', error)
    throw error
  }

  return data ?? []
}

// =============================================================================
// RAG: Search for relevant sources (V2 with insights priority)
// =============================================================================

export async function searchRelevantSourcesV2(
  query: string,
  limit = 10
): Promise<{
  sources: SourceRef[]
  context: string
}> {
  const supabase = getSupabaseAdmin()
  const sources: SourceRef[] = []
  let context = ''

  // Extract keywords from query
  const keywords = query
    .toLowerCase()
    .replace(/[^a-z가-힣0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2)

  // Helper to check keyword match
  const matchesKeywords = (text: string) => {
    const lowerText = text.toLowerCase()
    return keywords.some(kw => lowerText.includes(kw))
  }

  // 1. PRIORITY: Search insights first
  try {
    const { data: insightsData } = await supabase
      .from('insights')
      .select('id, topic, claim, rationale, sector, confidence, as_of, tags, created_at')
      .gte('confidence', 0.5)
      .order('confidence', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)

    if (insightsData) {
      const matchedInsights = insightsData
        .filter(insight => {
          const text = `${insight.topic} ${insight.claim} ${insight.rationale} ${(insight.tags ?? []).join(' ')}`
          return matchesKeywords(text)
        })
        .slice(0, Math.floor(limit / 2))

      for (const insight of matchedInsights) {
        sources.push({
          type: 'insight',
          id: insight.id,
          title: insight.topic,
          snippet: insight.claim,
          confidence: insight.confidence,
          as_of: insight.as_of,
          tags: insight.tags,
        })

        context += `\n[인사이트: ${insight.topic}]\n${insight.claim}\n${insight.rationale}\n`
      }
    }
  } catch (e) {
    console.warn('Insights search failed:', e)
  }

  // 2. Search documents (includes news, askme, manual)
  try {
    const { data: docsData } = await supabase
      .from('documents')
      .select('id, source, title, summary, content, url, published_at, as_of, tags')
      .order('last_updated', { ascending: false })
      .limit(100)

    if (docsData) {
      const matchedDocs = docsData
        .filter(doc => {
          const text = `${doc.title ?? ''} ${doc.summary ?? ''} ${doc.content ?? ''} ${(doc.tags ?? []).join(' ')}`
          return matchesKeywords(text)
        })
        .slice(0, limit - sources.length)

      for (const doc of matchedDocs) {
        sources.push({
          type: doc.source === 'news' ? 'news' : doc.source === 'askme' ? 'askme' : 'document',
          id: doc.id,
          title: doc.title ?? 'Untitled',
          url: doc.url,
          snippet: doc.summary ?? doc.content?.slice(0, 200),
          published_at: doc.published_at,
          as_of: doc.as_of,
          tags: doc.tags,
        })

        if (doc.summary || doc.content) {
          const snippet = doc.summary ?? doc.content?.slice(0, 500)
          context += `\n[${doc.source}: ${doc.title}]\n${snippet}\n`
        }
      }
    }
  } catch (e) {
    console.warn('Documents search failed:', e)
  }

  // 3. Fallback: Search news_articles directly if we need more
  if (sources.length < limit) {
    try {
      const { data: newsData } = await supabase
        .from('news_articles')
        .select('id, title, url, summary, published_at, publisher, tags')
        .order('published_at', { ascending: false })
        .limit(50)

      if (newsData) {
        const existingIds = new Set(sources.map(s => s.id))
        const matchedNews = newsData
          .filter(article => {
            if (existingIds.has(article.id)) return false
            const text = `${article.title} ${article.summary ?? ''} ${(article.tags ?? []).join(' ')}`
            return matchesKeywords(text)
          })
          .slice(0, limit - sources.length)

        for (const article of matchedNews) {
          sources.push({
            type: 'news',
            id: article.id,
            title: article.title,
            url: article.url,
            snippet: article.summary ?? undefined,
            published_at: article.published_at,
            source_name: article.publisher,
            tags: article.tags,
          })

          if (article.summary) {
            context += `\n[뉴스: ${article.title}]\n${article.summary}\n`
          }
        }
      }
    } catch (e) {
      console.warn('News search failed:', e)
    }
  }

  return { sources, context }
}

// =============================================================================
// Export: Get insights for Hashed agent (one-way sync)
// =============================================================================

export async function getInsightsForExport(options?: {
  since?: string    // ISO timestamp
  limit?: number
  includeEvidence?: boolean
}): Promise<{
  insights: Array<{
    id: string
    topic: string
    sector: string | null
    claim: string
    rationale: string
    evidence_ids: string[]
    tags: string[]
    confidence: number
    as_of: string | null
    created_at: string
    evidence?: Array<{ id: string; type: string; title: string; url?: string }>
  }>
  exported_at: string
}> {
  const supabase = getSupabaseAdmin()
  const { since, limit = 50, includeEvidence = false } = options ?? {}

  let query = supabase
    .from('insights')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (since) {
    query = query.gte('created_at', since)
  }

  const { data, error } = await query

  if (error) {
    console.error('getInsightsForExport error:', error)
    throw error
  }

  const insights = data ?? []

  // Optionally enrich with evidence metadata
  if (includeEvidence && insights.length > 0) {
    const allEvidenceIds = new Set<string>()
    for (const insight of insights) {
      for (const evidenceId of insight.evidence_ids ?? []) {
        allEvidenceIds.add(evidenceId)
      }
    }

    if (allEvidenceIds.size > 0) {
      const { data: docsData } = await supabase
        .from('documents')
        .select('id, source, title, url')
        .in('id', Array.from(allEvidenceIds))

      const evidenceMap = new Map<string, { id: string; type: string; title: string; url?: string }>()
      for (const doc of docsData ?? []) {
        evidenceMap.set(doc.id, {
          id: doc.id,
          type: doc.source,
          title: doc.title ?? 'Untitled',
          url: doc.url ?? undefined,
        })
      }

      for (const insight of insights) {
        (insight as { evidence?: Array<{ id: string; type: string; title: string; url?: string }> }).evidence =
          (insight.evidence_ids ?? [])
            .map((id: string) => evidenceMap.get(id))
            .filter(Boolean) as Array<{ id: string; type: string; title: string; url?: string }>
      }
    }
  }

  return {
    insights,
    exported_at: new Date().toISOString(),
  }
}

// =============================================================================
// Vector RAG: Chunk-based embeddings and semantic search
// =============================================================================

export interface ChunkHit {
  readonly id: string
  readonly document_id: string
  readonly chunk_index: number
  readonly content: string
  readonly similarity: number
  readonly doc_title: string
  readonly doc_url: string | null
  readonly doc_source: string
  readonly doc_source_type: string | null
}

/**
 * Upsert document chunks with embeddings
 */
export async function upsertDocumentChunks(
  documentId: string,
  chunks: ReadonlyArray<{
    content: string
    index: number
    tokenCount: number
    embedding: readonly number[]
  }>
): Promise<void> {
  const supabase = getSupabaseAdmin()

  // Format embeddings for pgvector
  const rows = chunks.map(chunk => ({
    document_id: documentId,
    chunk_index: chunk.index,
    content: chunk.content,
    token_count: chunk.tokenCount,
    embedding: `[${chunk.embedding.join(',')}]`,
  }))

  const { error } = await supabase
    .from('document_chunks')
    .upsert(rows, { onConflict: 'document_id,chunk_index' })

  if (error) {
    console.error('upsertDocumentChunks error:', error)
    throw error
  }
}

/**
 * Delete all chunks for a document (for re-embedding)
 */
export async function deleteDocumentChunks(documentId: string): Promise<void> {
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('document_chunks')
    .delete()
    .eq('document_id', documentId)

  if (error) {
    console.error('deleteDocumentChunks error:', error)
    throw error
  }
}

/**
 * Search relevant sources using vector similarity (RAG V3)
 */
export async function searchRelevantSourcesVector(
  queryEmbedding: readonly number[],
  options?: {
    limit?: number
    threshold?: number
  }
): Promise<{
  sources: SourceRef[]
  context: string
  chunks: ChunkHit[]
}> {
  const supabase = getSupabaseAdmin()
  const { limit = 10, threshold = 0.7 } = options ?? {}

  // Call the RPC function for vector search
  const { data, error } = await supabase.rpc('match_document_chunks', {
    query_embedding: `[${queryEmbedding.join(',')}]`,
    match_threshold: threshold,
    match_count: limit,
  })

  if (error) {
    console.error('match_document_chunks error:', error)
    throw error
  }

  const chunks: ChunkHit[] = (data ?? []).map((row: {
    id: string
    document_id: string
    chunk_index: number
    content: string
    similarity: number
    doc_title: string
    doc_url: string | null
    doc_source: string
    doc_source_type: string | null
  }) => ({
    id: row.id,
    document_id: row.document_id,
    chunk_index: row.chunk_index,
    content: row.content,
    similarity: row.similarity,
    doc_title: row.doc_title,
    doc_url: row.doc_url,
    doc_source: row.doc_source,
    doc_source_type: row.doc_source_type,
  }))

  // Deduplicate sources by document_id
  const seenDocIds = new Set<string>()
  const sources: SourceRef[] = []
  let context = ''

  for (const chunk of chunks) {
    // Add to context
    context += `\n[${chunk.doc_source}: ${chunk.doc_title}]\n${chunk.content}\n`

    // Add unique sources
    if (!seenDocIds.has(chunk.document_id)) {
      seenDocIds.add(chunk.document_id)
      sources.push({
        type: chunk.doc_source as SourceRef['type'],
        id: chunk.document_id,
        title: chunk.doc_title,
        url: chunk.doc_url ?? undefined,
        snippet: chunk.content.slice(0, 200),
        confidence: chunk.similarity,
      })
    }
  }

  return { sources, context, chunks }
}

/**
 * Get documents pending embedding generation
 */
export async function getPendingDocumentsForEmbedding(
  limit = 50
): Promise<Array<{
  id: string
  source: string
  title: string | null
  content: string | null
}>> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('documents')
    .select('id, source, title, content')
    .eq('embedding_status', 'pending')
    .not('content', 'is', null)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('getPendingDocumentsForEmbedding error:', error)
    throw error
  }

  return data ?? []
}

/**
 * Update document embedding status
 */
export async function updateDocumentEmbeddingStatus(
  documentId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed'
): Promise<void> {
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('documents')
    .update({ embedding_status: status })
    .eq('id', documentId)

  if (error) {
    console.error('updateDocumentEmbeddingStatus error:', error)
    throw error
  }
}

/**
 * Combined: Process document embeddings for pending documents
 * This is the main function to call from ingestion pipelines
 */
export async function processDocumentEmbeddings(
  documentId: string,
  content: string,
  title: string
): Promise<{ chunksCreated: number; tokensUsed: number }> {
  // Dynamically import to avoid circular deps and only load when needed
  const { chunkDocument } = await import('./chunking')
  const { generateEmbeddingsBatch, isEmbeddingConfigured } = await import('./embeddings')

  if (!isEmbeddingConfigured()) {
    console.warn('Embeddings not configured, skipping chunk generation')
    return { chunksCreated: 0, tokensUsed: 0 }
  }

  try {
    // Mark as processing
    await updateDocumentEmbeddingStatus(documentId, 'processing')

    // Generate chunks
    const chunks = chunkDocument(title, content)

    if (chunks.length === 0) {
      await updateDocumentEmbeddingStatus(documentId, 'completed')
      return { chunksCreated: 0, tokensUsed: 0 }
    }

    // Generate embeddings
    const { embeddings, totalTokens } = await generateEmbeddingsBatch(
      chunks.map(c => c.content)
    )

    // Combine chunks with embeddings
    const chunksWithEmbeddings = chunks.map((chunk, i) => ({
      ...chunk,
      embedding: embeddings[i].embedding,
    }))

    // Delete old chunks and upsert new ones
    await deleteDocumentChunks(documentId)
    await upsertDocumentChunks(documentId, chunksWithEmbeddings)

    // Mark as completed
    await updateDocumentEmbeddingStatus(documentId, 'completed')

    return { chunksCreated: chunks.length, tokensUsed: totalTokens }
  } catch (error) {
    console.error('processDocumentEmbeddings error:', error)
    await updateDocumentEmbeddingStatus(documentId, 'failed')
    throw error
  }
}
