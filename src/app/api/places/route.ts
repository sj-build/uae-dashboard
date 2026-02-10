import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export const maxDuration = 55

/** Curated display order per city (slugs not listed sort last alphabetically) */
const DISPLAY_ORDER: Record<string, readonly string[]> = {
  abudhabi: [
    'al-maryah-island',
    'al-reem-island',
    'downtown-corniche',
    'yas-island',
    'saadiyat-island',
    'masdar-city',
    'kizad',
  ],
  dubai: [
    'difc',
    'downtown-dubai',
    'business-bay',
    'dubai-marina',
    'jlt',
    'internet-city-media-city',
    'deira-old-dubai',
  ],
}

/**
 * GET /api/places?city=abudhabi|dubai&category=...&q=...
 *
 * Public endpoint to list places with optional filters
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const category = searchParams.get('category')
    const q = searchParams.get('q')

    const supabase = getSupabaseClient()

    let query = supabase
      .from('places')
      .select('id, slug, city, name_en, name_ko, tagline_en, tagline_ko, categories, best_for, icon, free_zone, keywords, as_of, confidence, links')
      .order('confidence', { ascending: false })
      .order('name_en', { ascending: true })
      .limit(100)

    if (city) {
      query = query.eq('city', city)
    }

    if (category) {
      query = query.contains('categories', [category])
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch places: ${error.message}`)
    }

    let items = data ?? []

    // Attach hero images: place_image_selected (priority) > neighborhood_images (legacy)
    const slugs = items.map(p => p.slug)
    if (slugs.length > 0) {
      try {
        // Priority 1: Admin-confirmed images from place_image_selected
        const { data: selectedImages } = await supabase
          .from('place_image_selected')
          .select('place_slug, image_url, source')
          .in('place_slug', slugs)

        const selectedMap = new Map(
          (selectedImages ?? []).map(img => [img.place_slug, img])
        )

        // Priority 2: Legacy neighborhood_images (active)
        const { data: legacyImages } = await supabase
          .from('neighborhood_images')
          .select('neighborhood_slug, public_url, photographer, photographer_url, source_url, attribution_text')
          .in('neighborhood_slug', slugs)
          .eq('is_active', true)

        const legacyMap = new Map(
          (legacyImages ?? []).map(img => [img.neighborhood_slug, img])
        )

        items = items.map(place => {
          const sel = selectedMap.get(place.slug)
          if (sel) {
            const src = (sel.source ?? {}) as Record<string, string>
            return {
              ...place,
              hero_image: {
                public_url: sel.image_url,
                photographer: src.photographer,
                photographer_url: src.photographer_url,
                source_url: src.source_url,
                attribution_text: src.attribution,
              },
            }
          }
          const legacy = legacyMap.get(place.slug)
          if (legacy) {
            return { ...place, hero_image: legacy }
          }
          return place
        })
      } catch {
        // Tables may not exist yet — skip gracefully
      }
    }

    // Apply curated display order
    if (city && DISPLAY_ORDER[city]) {
      const order = DISPLAY_ORDER[city]
      items = [...items].sort((a, b) => {
        const ai = order.indexOf(a.slug)
        const bi = order.indexOf(b.slug)
        const oa = ai >= 0 ? ai : order.length
        const ob = bi >= 0 ? bi : order.length
        return oa - ob
      })
    }

    // Server-side search would be ideal, but with <100 places, client-side is acceptable
    if (q) {
      const lower = q.toLowerCase()
      items = items.filter((place) => {
        const searchText = [
          place.name_en,
          place.name_ko,
          place.tagline_en,
          place.tagline_ko,
          ...(place.keywords ?? []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return searchText.includes(lower)
      })
    }

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Places API error:', error)
    return NextResponse.json({ items: [], error: 'Failed to fetch places' }, { status: 500 })
  }
}
