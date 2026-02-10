/**
 * Image refresh: "candidate collection" pipeline
 * Searches Unsplash → filters by relevance keywords → scores → saves to place_image_candidates
 * Does NOT auto-confirm. Admin must select via /admin/place-images.
 */

import { searchPhotos, scorePhoto, buildAttribution } from '@/lib/unsplash'
import type { UnsplashPhoto } from '@/lib/unsplash'
import { getSupabaseAdmin } from '@/lib/supabase'
import { NEIGHBORHOOD_QUERIES } from '@/data/neighborhood-queries'
import { NEIGHBORHOOD_KEYWORDS, NEGATIVE_KEYWORDS } from '@/data/neighborhood-keywords'

export interface RefreshInput {
  readonly slug: string
  readonly queries?: readonly string[]
  readonly maxCandidates?: number
}

export interface CandidateResult {
  readonly provider_ref: string
  readonly image_url: string
  readonly thumb_url: string
  readonly photographer: string
  readonly score: number
}

export interface RefreshResult {
  readonly success: boolean
  readonly slug: string
  readonly searched: number
  readonly passed_filter: number
  readonly saved: number
  readonly candidates: readonly CandidateResult[]
  readonly error?: string
}

/**
 * Build searchable text from all photo metadata (description + alt + tags)
 */
function buildPhotoText(photo: UnsplashPhoto): string {
  const parts = [
    photo.description,
    photo.alt_description,
  ].filter(Boolean)

  // Unsplash tags contain the most reliable location info
  if (photo.tags) {
    for (const tag of photo.tags) {
      parts.push(tag.title)
    }
  }

  return parts.join(' ').toLowerCase()
}

/**
 * Check if a photo matches must-include keywords for the given place
 */
function matchesMustKeywords(photo: UnsplashPhoto, slug: string): number {
  const mustKeywords = NEIGHBORHOOD_KEYWORDS[slug]
  if (!mustKeywords) return 0

  const text = buildPhotoText(photo)
  return mustKeywords.reduce((hits, kw) => text.includes(kw.toLowerCase()) ? hits + 1 : hits, 0)
}

/**
 * Count negative keyword hits in a photo's text
 */
function countNegativeHits(photo: UnsplashPhoto): number {
  const text = buildPhotoText(photo)
  return NEGATIVE_KEYWORDS.reduce(
    (hits, kw) => text.includes(kw.toLowerCase()) ? hits + 1 : hits,
    0
  )
}

/**
 * Score a photo with relevance, quality, and negative keyword penalties
 */
function scoreCandidatePhoto(photo: UnsplashPhoto, slug: string): number {
  const baseScore = scorePhoto(photo)
  const keywordHits = matchesMustKeywords(photo, slug)
  const negativeHits = countNegativeHits(photo)

  return baseScore + (keywordHits * 10) - (negativeHits * 30)
}

/**
 * Collect image candidates for a place slug.
 * Saves top candidates to place_image_candidates table.
 * Does NOT auto-select or change what's displayed.
 */
export async function collectCandidates(input: RefreshInput): Promise<RefreshResult> {
  const { slug, maxCandidates = 6 } = input
  const queries = input.queries
    ?? NEIGHBORHOOD_QUERIES[slug]
    ?? [`${slug.replace(/-/g, ' ')}`]

  // 1. Search Unsplash across all queries
  const allPhotos: UnsplashPhoto[] = []
  const seenIds = new Set<string>()

  for (const query of queries) {
    try {
      const photos = await searchPhotos(query, 10, 'landscape')
      for (const photo of photos) {
        if (!seenIds.has(photo.id)) {
          seenIds.add(photo.id)
          allPhotos.push(photo)
        }
      }
    } catch {
      // continue with other queries
    }
  }

  if (allPhotos.length === 0) {
    return {
      success: false,
      slug,
      searched: 0,
      passed_filter: 0,
      saved: 0,
      candidates: [],
      error: `No photos found for ${slug}`,
    }
  }

  // 2. Filter: require at least 1 must-keyword hit (if keywords exist for this slug)
  const mustKeywords = NEIGHBORHOOD_KEYWORDS[slug]
  const filtered = mustKeywords
    ? allPhotos.filter(p => matchesMustKeywords(p, slug) >= 1)
    : allPhotos

  // If nothing passed filter, use all but with lower scores
  const pool = filtered.length > 0 ? filtered : allPhotos

  // 3. Score and rank
  const scored = pool
    .map(photo => ({
      photo,
      score: scoreCandidatePhoto(photo, slug),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCandidates)

  if (scored.length === 0) {
    return {
      success: false,
      slug,
      searched: allPhotos.length,
      passed_filter: filtered.length,
      saved: 0,
      candidates: [],
      error: `All candidates scored 0 or below for ${slug}`,
    }
  }

  // 4. Save candidates to DB (replace previous candidates for this slug)
  const supabase = getSupabaseAdmin()

  // Clear old candidates for this slug
  await supabase
    .from('place_image_candidates')
    .delete()
    .eq('place_slug', slug)

  const candidateRows = scored.map(({ photo, score }) => ({
    place_slug: slug,
    provider: 'unsplash',
    provider_ref: photo.id,
    image_url: `${photo.urls.raw}&w=1200&q=85&fm=jpg&fit=crop`,
    thumb_url: photo.urls.small,
    photographer: photo.user.name,
    photographer_url: photo.user.links.html,
    license: 'Unsplash License',
    source_url: photo.links.html,
    score,
    meta: {
      width: photo.width,
      height: photo.height,
      likes: photo.likes,
      description: photo.alt_description ?? photo.description,
      attribution: buildAttribution(photo),
    },
  }))

  const { error: insertError } = await supabase
    .from('place_image_candidates')
    .insert(candidateRows)

  if (insertError) {
    return {
      success: false,
      slug,
      searched: allPhotos.length,
      passed_filter: filtered.length,
      saved: 0,
      candidates: [],
      error: `DB insert failed: ${insertError.message}`,
    }
  }

  return {
    success: true,
    slug,
    searched: allPhotos.length,
    passed_filter: filtered.length,
    saved: scored.length,
    candidates: scored.map(({ photo, score }) => ({
      provider_ref: photo.id,
      image_url: `${photo.urls.raw}&w=1200&q=85&fm=jpg&fit=crop`,
      thumb_url: photo.urls.small,
      photographer: photo.user.name,
      score,
    })),
  }
}
