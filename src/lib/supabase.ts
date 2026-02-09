import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Client for browser (limited access)
export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Server client with full access (for API routes)
// IMPORTANT: This must NEVER be called from browser/client code
export function getSupabaseAdmin() {
  // Security guard: prevent accidental client-side usage
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseAdmin must not be called from browser - use getSupabaseClient instead')
  }
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase admin environment variables')
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// =============================================================================
// Types
// =============================================================================

export interface Document {
  id: string
  content: string
  title?: string
  summary?: string
  source: 'news' | 'dashboard' | 'askme' | 'research' | 'manual'
  category?: string
  tags: string[]
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface NewsArticle {
  id: string
  title: string
  summary?: string
  content?: string
  url: string
  publisher: string
  source: 'google' | 'naver'
  language: 'en' | 'ko'
  image_url?: string
  category?: string
  tags: string[]
  published_at?: string
  crawled_at: string
  view_count: number
  is_featured: boolean
}

export interface AskMeSession {
  id: string
  question: string
  answer: string
  sources_used: unknown[]
  model: string
  rating?: number
  feedback?: string
  locale: 'ko' | 'en'
  session_id?: string
  created_at: string
}

// =============================================================================
// Helper Functions
// =============================================================================

export async function saveNewsArticles(articles: Omit<NewsArticle, 'id' | 'crawled_at' | 'view_count' | 'is_featured'>[]) {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('news_articles')
    .upsert(
      articles.map((article) => ({
        ...article,
        crawled_at: new Date().toISOString(),
      })),
      { onConflict: 'url', ignoreDuplicates: true }
    )
    .select()

  if (error) {
    console.error('Error saving news articles:', error)
    throw error
  }

  return data
}

export async function saveAskMeSession(session: Omit<AskMeSession, 'id' | 'created_at'>) {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('askme_sessions')
    .insert(session)
    .select()
    .single()

  if (error) {
    console.error('Error saving AskMe session:', error)
    throw error
  }

  return data
}

export async function getRecentNews(options?: {
  category?: string
  limit?: number
  source?: 'google' | 'naver'
}) {
  const supabase = getSupabaseClient()
  const { category, limit = 20, source } = options ?? {}

  let query = supabase
    .from('news_articles')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (category) {
    query = query.eq('category', category)
  }
  if (source) {
    query = query.eq('source', source)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching news:', error)
    throw error
  }

  return data as NewsArticle[]
}

export async function searchDocuments(searchTerm: string, options?: {
  source?: string
  category?: string
  limit?: number
}) {
  const supabase = getSupabaseClient()
  const { source, category, limit = 10 } = options ?? {}

  let query = supabase
    .from('documents')
    .select('*')
    .textSearch('content', searchTerm)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (source) {
    query = query.eq('source', source)
  }
  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error searching documents:', error)
    throw error
  }

  return data as Document[]
}

// =============================================================================
// RAG: Search for relevant sources
// =============================================================================

export interface SourceReference {
  type: 'news' | 'askme' | 'document'
  id: string
  title: string
  url?: string
  summary?: string
  published_at?: string
  relevance: 'high' | 'medium' | 'low'
}

export async function searchRelevantSources(query: string, limit = 5): Promise<{
  sources: SourceReference[]
  context: string
}> {
  const supabase = getSupabaseAdmin()
  const sources: SourceReference[] = []
  let context = ''

  // Extract keywords from query
  const keywords = query
    .toLowerCase()
    .replace(/[^a-z가-힣0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2)

  // 1. Search news_articles
  try {
    const { data: newsData } = await supabase
      .from('news_articles')
      .select('id, title, url, summary, published_at')
      .order('published_at', { ascending: false })
      .limit(50)

    if (newsData) {
      const matchedNews = newsData
        .filter(article => {
          const text = `${article.title} ${article.summary || ''}`.toLowerCase()
          return keywords.some(kw => text.includes(kw))
        })
        .slice(0, limit)

      for (const article of matchedNews) {
        sources.push({
          type: 'news',
          id: article.id,
          title: article.title,
          url: article.url,
          summary: article.summary || undefined,
          published_at: article.published_at || undefined,
          relevance: 'high',
        })

        if (article.summary) {
          context += `\n[뉴스: ${article.title}]\n${article.summary}\n`
        }
      }
    }
  } catch (e) {
    console.warn('News search failed:', e)
  }

  // 2. Search past askme_sessions for similar questions
  try {
    const { data: askmeData } = await supabase
      .from('askme_sessions')
      .select('id, question, answer, created_at')
      .order('created_at', { ascending: false })
      .limit(30)

    if (askmeData) {
      const matchedAskme = askmeData
        .filter(session => {
          const text = session.question.toLowerCase()
          return keywords.some(kw => text.includes(kw))
        })
        .slice(0, 3) // Limit to 3 past Q&As

      for (const session of matchedAskme) {
        sources.push({
          type: 'askme',
          id: session.id,
          title: session.question,
          summary: session.answer.slice(0, 200) + '...',
          published_at: session.created_at,
          relevance: 'medium',
        })

        // Add abbreviated answer as context
        context += `\n[이전 Q&A]\nQ: ${session.question}\nA: ${session.answer.slice(0, 500)}\n`
      }
    }
  } catch (e) {
    console.warn('AskMe search failed:', e)
  }

  return { sources, context }
}
