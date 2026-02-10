import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export const maxDuration = 55

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

    // Attach active hero images from neighborhood_images
    const slugs = items.map(p => p.slug)
    if (slugs.length > 0) {
      const { data: images } = await supabase
        .from('neighborhood_images')
        .select('neighborhood_slug, public_url, photographer, photographer_url, source_url, attribution_text')
        .in('neighborhood_slug', slugs)
        .eq('is_active', true)

      if (images && images.length > 0) {
        const imageMap = new Map(images.map(img => [img.neighborhood_slug, img]))
        items = items.map(place => {
          const img = imageMap.get(place.slug)
          return img ? { ...place, hero_image: img } : place
        })
      }
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
