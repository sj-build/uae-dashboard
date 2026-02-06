import { NextResponse } from 'next/server'
import { getAnthropicClient } from '@/lib/anthropic'
import { SEARCH_SYSTEM_PROMPT } from '@/lib/search-prompt'
import { SearchRequestSchema } from '@/types/search'
import { logQuestion } from '@/lib/question-logger'
import type { SearchResponse } from '@/types/search'

export async function POST(request: Request): Promise<NextResponse<SearchResponse>> {
  const startTime = Date.now()
  let query = ''

  try {
    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Ask Me 기능을 사용하려면 ANTHROPIC_API_KEY를 .env.local에 설정해주세요.' },
        { status: 503 }
      )
    }

    const body: unknown = await request.json()

    const parseResult = SearchRequestSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 검색어입니다.' },
        { status: 400 }
      )
    }

    query = parseResult.data.query
    const client = getAnthropicClient()

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SEARCH_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: query,
        },
      ],
    })

    const html = message.content
      .reduce<string>((acc, block) => {
        if (block.type === 'text') {
          return acc + block.text
        }
        return acc
      }, '')

    // Log successful question (non-blocking)
    const responseTimeMs = Date.now() - startTime
    logQuestion({
      query,
      success: true,
      responseTimeMs,
      userAgent: request.headers.get('user-agent') || undefined,
    }).catch(() => {
      // Ignore logging errors
    })

    return NextResponse.json({ success: true, html })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: '잘못된 요청 형식입니다.' },
        { status: 400 }
      )
    }

    const errorMessage =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'

    const isAuthError =
      error instanceof Error &&
      ('status' in error && (error as { status: number }).status === 401)

    if (isAuthError) {
      return NextResponse.json(
        { success: false, error: 'API 인증에 실패했습니다. API 키를 확인해주세요.' },
        { status: 401 }
      )
    }

    const isRateLimitError =
      error instanceof Error &&
      ('status' in error && (error as { status: number }).status === 429)

    if (isRateLimitError) {
      return NextResponse.json(
        { success: false, error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      )
    }

    console.error('Search API error:', errorMessage)

    // Log failed question (non-blocking)
    if (query) {
      logQuestion({
        query,
        success: false,
        responseTimeMs: Date.now() - startTime,
        userAgent: request.headers.get('user-agent') || undefined,
      }).catch(() => {
        // Ignore logging errors
      })
    }

    return NextResponse.json(
      { success: false, error: '검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}
