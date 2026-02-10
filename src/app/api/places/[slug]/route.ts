import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export const maxDuration = 55

/**
 * GET /api/places/:slug
 *
 * Get place detail with related news
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params

    if (!slug || !/^[a-z0-9-]+$/.test(slug) || slug.length > 100) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Fetch place
    const { data: place, error } = await supabase
      .from('places')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !place) {
      return NextResponse.json(
        { error: 'Place not found' },
        { status: 404 }
      )
    }

    // Attach hero image: place_image_selected (priority) > neighborhood_images (legacy)
    let heroImage: Record<string, string | undefined> | null = null
    try {
      const { data: selImg } = await supabase
        .from('place_image_selected')
        .select('image_url, source')
        .eq('place_slug', slug)
        .maybeSingle()

      if (selImg) {
        const src = (selImg.source ?? {}) as Record<string, string>
        heroImage = {
          public_url: selImg.image_url,
          photographer: src.photographer,
          photographer_url: src.photographer_url,
          source_url: src.source_url,
          attribution_text: src.attribution,
        }
      } else {
        const { data: legacyImg } = await supabase
          .from('neighborhood_images')
          .select('public_url, photographer, photographer_url, source_url, attribution_text')
          .eq('neighborhood_slug', slug)
          .eq('is_active', true)
          .maybeSingle()

        if (legacyImg) {
          heroImage = legacyImg
        }
      }
    } catch {
      // Tables may not exist yet — skip gracefully
    }

    const placeWithImage = heroImage
      ? { ...place, hero_image: heroImage }
      : place

    // Fetch related news using keyword ilike filters (server-side)
    let relatedNews: Array<{ id: string; title: string; url: string; summary: string | null; published_at: string | null }> = []

    const keywords = (place.keywords as string[] | null) ?? []
    if (keywords.length > 0) {
      const orFilter = keywords
        .slice(0, 5)
        .map((k: string) => `title.ilike.%${k}%,summary.ilike.%${k}%`)
        .join(',')

      const { data: newsData } = await supabase
        .from('news_articles')
        .select('id, title, url, summary, published_at')
        .or(orFilter)
        .order('published_at', { ascending: false })
        .limit(5)

      relatedNews = newsData ?? []
    }

    return NextResponse.json({
      place: placeWithImage,
      relatedNews,
    })
  } catch (error) {
    console.error('Place detail API error:', error)
    return NextResponse.json({ error: 'Failed to load place detail' }, { status: 500 })
  }
}
