/**
 * Image refresh: "candidate collection" pipeline
 * 1. Google Places (if Place ID mapped) → 2. Unsplash fallback
 * Scores, merges, saves top candidates to place_image_candidates.
 * Does NOT auto-confirm. Admin must select via /admin/place-images.
 */

import { searchPhotos, scorePhoto, buildAttribution } from '@/lib/unsplash'
import type { UnsplashPhoto } from '@/lib/unsplash'
import {
  fetchPlacePhotos,
  buildPhotoRef,
  buildPhotoThumbRef,
  scoreGooglePhoto,
  resolvePhotoRedirect,
} from '@/lib/google-places'
import type { GooglePlacePhoto } from '@/lib/google-places'
import { getSupabaseAdmin } from '@/lib/supabase'
import { NEIGHBORHOOD_QUERIES } from '@/data/neighborhood-queries'
import { NEIGHBORHOOD_KEYWORDS, NEGATIVE_KEYWORDS } from '@/data/neighborhood-keywords'
import { GOOGLE_PLACE_IDS } from '@/data/google-place-ids'

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
  readonly google_count: number
  readonly unsplash_count: number
  readonly candidates: readonly CandidateResult[]
  readonly error?: string
}

/** DB row shape for insert */
interface CandidateRow {
  readonly place_slug: string
  readonly provider: string
  readonly provider_ref: string
  readonly image_url: string
  readonly thumb_url: string
  readonly photographer: string
  readonly photographer_url: string
  readonly license: string
  readonly source_url: string
  readonly score: number
  readonly meta: Record<string, unknown>
}

// ── Unsplash helpers ────────────────────────────────────────────────

function buildPhotoText(photo: UnsplashPhoto): string {
  const parts = [
    photo.description,
    photo.alt_description,
  ].filter(Boolean)

  if (photo.tags) {
    for (const tag of photo.tags) {
      parts.push(tag.title)
    }
  }

  return parts.join(' ').toLowerCase()
}

function matchesMustKeywords(photo: UnsplashPhoto, slug: string): number {
  const mustKeywords = NEIGHBORHOOD_KEYWORDS[slug]
  if (!mustKeywords) return 0

  const text = buildPhotoText(photo)
  return mustKeywords.reduce((hits, kw) => text.includes(kw.toLowerCase()) ? hits + 1 : hits, 0)
}

function countNegativeHits(photo: UnsplashPhoto): number {
  const text = buildPhotoText(photo)
  return NEGATIVE_KEYWORDS.reduce(
    (hits, kw) => text.includes(kw.toLowerCase()) ? hits + 1 : hits,
    0
  )
}

function scoreCandidatePhoto(photo: UnsplashPhoto, slug: string): number {
  const baseScore = scorePhoto(photo)
  const keywordHits = matchesMustKeywords(photo, slug)
  const negativeHits = countNegativeHits(photo)

  return baseScore + (keywordHits * 10) - (negativeHits * 30)
}

// ── Google Places candidates ────────────────────────────────────────

function hasGooglePlacesKey(): boolean {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY)
}

async function collectGoogleCandidates(
  slug: string
): Promise<readonly CandidateRow[]> {
  const placeId = GOOGLE_PLACE_IDS[slug]
  if (!placeId || !hasGooglePlacesKey()) return []

  const photos = await fetchPlacePhotos(placeId, 10)

  // Resolve thumb redirects in parallel for admin preview
  const thumbUrls = await Promise.all(
    photos.map(photo => resolvePhotoRedirect(photo.name, 400))
  )

  return photos.map((photo: GooglePlacePhoto, i: number) => {
    const attribution = photo.authorAttributions[0]
    return {
      place_slug: slug,
      provider: 'google_places',
      provider_ref: photo.name,
      image_url: buildPhotoRef(photo.name),
      thumb_url: thumbUrls[i] ?? buildPhotoThumbRef(photo.name),
      photographer: attribution?.displayName ?? 'Google Maps User',
      photographer_url: attribution?.uri ?? '',
      license: 'Google Places',
      source_url: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
      score: scoreGooglePhoto(photo),
      meta: {
        width: photo.widthPx,
        height: photo.heightPx,
        attribution: `Photo by ${attribution?.displayName ?? 'Google Maps User'} via Google`,
      },
    }
  })
}

// ── Unsplash candidates ─────────────────────────────────────────────

async function collectUnsplashCandidates(
  slug: string,
  queries: readonly string[]
): Promise<{ readonly rows: readonly CandidateRow[]; readonly searched: number; readonly passed_filter: number }> {
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

  const mustKeywords = NEIGHBORHOOD_KEYWORDS[slug]
  const filtered = mustKeywords
    ? allPhotos.filter(p => matchesMustKeywords(p, slug) >= 1)
    : allPhotos

  const pool = filtered.length > 0 ? filtered : allPhotos

  const scored = pool
    .map(photo => ({ photo, score: scoreCandidatePhoto(photo, slug) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)

  const rows: readonly CandidateRow[] = scored.map(({ photo, score }) => ({
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

  return { rows, searched: allPhotos.length, passed_filter: filtered.length }
}

// ── Main pipeline ───────────────────────────────────────────────────

export async function collectCandidates(input: RefreshInput): Promise<RefreshResult> {
  const { slug, maxCandidates = 6 } = input
  const queries = input.queries
    ?? NEIGHBORHOOD_QUERIES[slug]
    ?? [`${slug.replace(/-/g, ' ')}`]

  // 1. Try Google Places first
  let googleRows: readonly CandidateRow[] = []
  try {
    googleRows = await collectGoogleCandidates(slug)
  } catch (error) {
    console.error(`[image-refresh] Google Places failed for ${slug}:`, error)
  }

  // 2. Unsplash fallback (always run if Google returned < maxCandidates)
  let unsplashResult = { rows: [] as readonly CandidateRow[], searched: 0, passed_filter: 0 }
  if (googleRows.length < maxCandidates) {
    try {
      unsplashResult = await collectUnsplashCandidates(slug, queries)
    } catch {
      // Unsplash also failed
    }
  }

  // 3. Merge both sources, sort by score, take top N
  const allRows = [...googleRows, ...unsplashResult.rows]
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCandidates)

  const totalSearched = googleRows.length + unsplashResult.searched

  if (allRows.length === 0) {
    return {
      success: false,
      slug,
      searched: totalSearched,
      passed_filter: unsplashResult.passed_filter,
      saved: 0,
      google_count: googleRows.length,
      unsplash_count: unsplashResult.rows.length,
      candidates: [],
      error: `No photos found for ${slug}`,
    }
  }

  // 4. Save to DB (replace previous candidates for this slug)
  const supabase = getSupabaseAdmin()

  await supabase
    .from('place_image_candidates')
    .delete()
    .eq('place_slug', slug)

  const { error: insertError } = await supabase
    .from('place_image_candidates')
    .insert(allRows)

  if (insertError) {
    return {
      success: false,
      slug,
      searched: totalSearched,
      passed_filter: unsplashResult.passed_filter,
      saved: 0,
      google_count: googleRows.length,
      unsplash_count: unsplashResult.rows.length,
      candidates: [],
      error: `DB insert failed: ${insertError.message}`,
    }
  }

  return {
    success: true,
    slug,
    searched: totalSearched,
    passed_filter: unsplashResult.passed_filter,
    saved: allRows.length,
    google_count: googleRows.length,
    unsplash_count: unsplashResult.rows.length,
    candidates: allRows.map(row => ({
      provider_ref: row.provider_ref,
      image_url: row.image_url,
      thumb_url: row.thumb_url,
      photographer: row.photographer,
      score: row.score,
    })),
  }
}
