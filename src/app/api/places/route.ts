import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

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

    // Client-side keyword search (text match against name, tagline, keywords)
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
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ items: [], error: msg }, { status: 500 })
  }
}
