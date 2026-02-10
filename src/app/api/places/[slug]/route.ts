import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

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

    // Fetch related news using keywords
    let relatedNews: Array<{ id: string; title: string; url: string; summary: string | null; published_at: string | null }> = []

    if (place.keywords && place.keywords.length > 0) {
      const { data: newsData } = await supabase
        .from('news_articles')
        .select('id, title, url, summary, published_at')
        .order('published_at', { ascending: false })
        .limit(50)

      if (newsData) {
        const keywords = (place.keywords as string[]).map((k: string) => k.toLowerCase())
        relatedNews = newsData
          .filter((article) => {
            const text = `${article.title} ${article.summary ?? ''}`.toLowerCase()
            return keywords.some((kw) => text.includes(kw))
          })
          .slice(0, 5)
      }
    }

    return NextResponse.json({
      place,
      relatedNews,
    })
  } catch (error) {
    console.error('Place detail API error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
