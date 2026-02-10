/**
 * Core image refresh logic — shared between single and batch API routes
 * Downloads from Unsplash → caches in Supabase Storage → stores metadata in DB
 */

import {
  searchPhotos,
  trackDownload,
  downloadPhoto,
  scorePhoto,
  buildAttribution,
} from '@/lib/unsplash'
import type { UnsplashPhoto } from '@/lib/unsplash'
import { getSupabaseAdmin } from '@/lib/supabase'
import { NEIGHBORHOOD_QUERIES } from '@/data/neighborhood-queries'

export interface RefreshInput {
  readonly city: 'abudhabi' | 'dubai'
  readonly slug: string
  readonly queries?: readonly string[]
  readonly setActive?: boolean
  readonly topN?: number
}

export interface RefreshResult {
  readonly success: boolean
  readonly city: string
  readonly slug: string
  readonly candidates_found: number
  readonly filtered: number
  readonly selected: ReadonlyArray<{
    provider_id: string
    public_url: string
    quality_score: number
    photographer: string
    is_active: boolean
  }>
  readonly error?: string
}

export async function refreshNeighborhoodImages(input: RefreshInput): Promise<RefreshResult> {
  const { city, slug, setActive = true, topN = 3 } = input
  const queries = input.queries
    ?? NEIGHBORHOOD_QUERIES[slug]
    ?? [`${slug.replace(/-/g, ' ')} ${city === 'abudhabi' ? 'Abu Dhabi' : 'Dubai'}`]

  // 1. Search Unsplash for candidates
  const allCandidates: UnsplashPhoto[] = []
  const seenIds = new Set<string>()

  for (const query of queries) {
    try {
      const photos = await searchPhotos(query, 8, 'landscape')
      for (const photo of photos) {
        if (!seenIds.has(photo.id)) {
          seenIds.add(photo.id)
          allCandidates.push(photo)
        }
      }
    } catch {
      // continue with other queries
    }
  }

  if (allCandidates.length === 0) {
    return {
      success: false,
      city,
      slug,
      candidates_found: 0,
      filtered: 0,
      selected: [],
      error: `No photos found for ${city}/${slug}`,
    }
  }

  // 2. Filter: min dimensions
  const minWidth = parseInt(process.env.IMAGE_MIN_WIDTH ?? '1600', 10)
  const minHeight = parseInt(process.env.IMAGE_MIN_HEIGHT ?? '900', 10)
  const filtered = allCandidates.filter(p => p.width >= minWidth && p.height >= minHeight)
  const candidates = filtered.length > 0 ? filtered : allCandidates

  // 3. Score and rank
  const scored = candidates
    .map(photo => ({ photo, score: scorePhoto(photo) }))
    .sort((a, b) => b.score - a.score)
  const topPhotos = scored.slice(0, topN)

  // 4. Download → Storage → DB
  const supabase = getSupabaseAdmin()
  const results: Array<{
    provider_id: string
    public_url: string
    quality_score: number
    photographer: string
    is_active: boolean
  }> = []

  for (let i = 0; i < topPhotos.length; i++) {
    const { photo, score } = topPhotos[i]
    const storagePath = `${city}/${slug}/unsplash-${photo.id}.jpg`

    try {
      const imageBuffer = await downloadPhoto(photo, 2400)
      await trackDownload(photo)

      const { error: uploadError } = await supabase.storage
        .from('neighborhood-images')
        .upload(storagePath, imageBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        })

      if (uploadError) {
        console.error(`Upload failed for ${photo.id}:`, uploadError.message)
        continue
      }

      const { data: urlData } = supabase.storage
        .from('neighborhood-images')
        .getPublicUrl(storagePath)
      const publicUrl = urlData.publicUrl

      const isActive = setActive && i === 0
      const { error: dbError } = await supabase
        .from('neighborhood_images')
        .upsert({
          city,
          neighborhood_slug: slug,
          provider: 'unsplash',
          provider_id: photo.id,
          storage_path: storagePath,
          public_url: publicUrl,
          source_url: photo.links.html,
          photographer: photo.user.name,
          photographer_url: photo.user.links.html,
          attribution_text: buildAttribution(photo),
          width: photo.width,
          height: photo.height,
          is_active: isActive,
          quality_score: score,
          metadata: {
            likes: photo.likes,
            description: photo.alt_description ?? photo.description,
          },
        }, {
          onConflict: 'city,neighborhood_slug,provider,provider_id',
        })

      if (dbError) {
        console.error(`DB upsert failed for ${photo.id}:`, dbError.message)
        continue
      }

      results.push({
        provider_id: photo.id,
        public_url: publicUrl,
        quality_score: score,
        photographer: photo.user.name,
        is_active: isActive,
      })
    } catch (err) {
      console.error(`Processing photo ${photo.id} failed:`, err)
    }
  }

  // Deactivate others for this slug
  if (setActive && results.length > 0) {
    const activeId = results[0].provider_id
    await supabase
      .from('neighborhood_images')
      .update({ is_active: false })
      .eq('city', city)
      .eq('neighborhood_slug', slug)
      .neq('provider_id', activeId)
  }

  return {
    success: results.length > 0,
    city,
    slug,
    candidates_found: allCandidates.length,
    filtered: candidates.length,
    selected: results,
  }
}
