import { NextResponse } from 'next/server'
import { getAnthropicClient } from '@/lib/anthropic'

// Allow enough time for RAG search + Anthropic API call
export const maxDuration = 55
import { SEARCH_SYSTEM_PROMPT, createEnhancedPrompt } from '@/lib/search-prompt'
import { SearchRequestSchema, CONVERSATION_LIMITS } from '@/types/search'
import { logQuestion } from '@/lib/question-logger'
import {
  needsWebSearch,
  needsEcommerceSearch,
  extractBrandName,
} from '@/lib/web-search'
import { searchUAE, formatGoogleResults } from '@/lib/google-search'
import { fetchAmazonUAEProducts, formatAmazonResults } from '@/lib/keepa-amazon'
import { searchRelevantSourcesV2, searchRelevantSourcesVector, upsertDocumentFromAskMe, processDocumentEmbeddings } from '@/lib/db'
import { generateEmbedding, isEmbeddingConfigured } from '@/lib/embeddings'
import type { SourceRef } from '@/lib/types'

// Save Q&A to UAE Memory with sources + documents layer + embeddings
async function saveToUAEMemory(
  question: string,
  answer: string,
  locale: string,
  sources: SourceRef[] = []
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return
  }

  try {
    const { saveAskMeSession } = await import('@/lib/supabase')

    // 1. Save to askme_sessions (existing behavior)
    await saveAskMeSession({
      question,
      answer: answer.slice(0, 10000),
      sources_used: sources,
      model: 'claude-sonnet-4',
      locale: locale as 'ko' | 'en',
    })

    // 2. Also upsert to documents for knowledge accumulation
    const documentId = await upsertDocumentFromAskMe({
      question,
      answer: answer.slice(0, 10000),
      sources_used: sources,
    })

    // 3. Generate embeddings for the Q&A if configured
    if (documentId && isEmbeddingConfigured()) {
      const content = `Q: ${question}\n\nA: ${answer.slice(0, 5000)}`
      await processDocumentEmbeddings(documentId, content, question).catch((e) => {
        console.warn('[UAE Memory] Embedding generation failed:', e)
      })
    }
  } catch (error) {
    console.error('[UAE Memory] Failed:', error)
  }
}

// Build e-commerce context with direct links + live Amazon data
async function buildEcommerceContext(query: string, brandName?: string): Promise<string> {
  const brand = brandName || query

  // Try to fetch live Amazon UAE data
  let amazonLiveData = ''
  try {
    const amazonProducts = await fetchAmazonUAEProducts(brand, 5)
    if (amazonProducts.length > 0) {
      amazonLiveData = formatAmazonResults(amazonProducts)
    }
  } catch (error) {
    console.warn('Failed to fetch Amazon data:', error)
  }

  const staticLinks = `
## UAE 이커머스 채널 검색 링크

브랜드/제품 "${brand}"에 대한 UAE 주요 이커머스 채널:

### Amazon UAE
- 검색 링크: https://www.amazon.ae/s?k=${encodeURIComponent(brand)}
- UAE 최대 이커머스 플랫폼, 프라임 배송 지원

### Noon
- 검색 링크: https://www.noon.com/uae-en/search/?q=${encodeURIComponent(brand)}
- 두바이 기반 중동 최대 로컬 이커머스

### Namshi
- 검색 링크: https://www.namshi.com/uae-en/search/${encodeURIComponent(brand)}/
- 패션/뷰티 전문 이커머스

### Carrefour UAE
- 검색 링크: https://www.carrefouruae.com/mafuae/en/search?keyword=${encodeURIComponent(brand)}
- 대형마트 온라인몰
`

  return amazonLiveData + staticLinks
}

export async function POST(request: Request): Promise<Response> {
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
    const conversationHistory = parseResult.data.messages || []
    const useStreaming = parseResult.data.stream ?? true // Default to streaming

    // Calculate turn count (user messages = turns)
    const turnCount = conversationHistory.filter(m => m.role === 'user').length

    // Check conversation limits
    if (turnCount >= CONVERSATION_LIMITS.MAX_TURNS) {
      return NextResponse.json({
        success: false,
        error: '대화 제한에 도달했습니다. 새로운 대화를 시작해주세요.',
        limitReached: true,
        turnCount,
      })
    }

    // Check context length
    const contextLength = conversationHistory.reduce((acc, m) => acc + m.content.length, 0)
    if (contextLength > CONVERSATION_LIMITS.MAX_CONTEXT_CHARS) {
      return NextResponse.json({
        success: false,
        error: '대화가 너무 길어졌습니다. 새로운 대화를 시작해주세요.',
        limitReached: true,
        turnCount,
      })
    }

    const client = getAnthropicClient()

    // Always search on first query; follow-ups use conversation context
    const isFirstQuery = conversationHistory.length === 0
    const shouldEcommerceSearch = isFirstQuery && needsEcommerceSearch(query)
    const brandName = extractBrandName(query)

    // Build enhanced context (parallel fetching)
    let webSearchResults = ''
    let ecommerceResults = ''
    let ragContext = ''
    let ragSources: SourceRef[] = []

    if (isFirstQuery) {
      const searchPromises: Promise<void>[] = []

      // RAG: Try vector search first, fallback to keyword search
      searchPromises.push(
        (async () => {
          try {
            if (isEmbeddingConfigured()) {
              const { embedding } = await generateEmbedding(query)
              const vectorResult = await searchRelevantSourcesVector(embedding, {
                limit: 8,
                threshold: 0.65,
              })

              if (vectorResult.sources.length > 0) {
                ragSources = vectorResult.sources
                ragContext = vectorResult.context
                return
              }
            }
          } catch (e) {
            console.warn('Vector RAG search failed, falling back to keyword:', e)
          }

          const { sources, context } = await searchRelevantSourcesV2(query, 8)
          ragSources = sources
          ragContext = context
        })().catch((e) => {
          console.warn('RAG search failed:', e)
        })
      )

      // ALWAYS run web search — DB may not have enough coverage
      searchPromises.push(
        searchUAE(query, 5).then((results) => {
          webSearchResults = formatGoogleResults(results)
        }).catch(() => {
          // Silently fail
        })
      )

      if (shouldEcommerceSearch) {
        searchPromises.push(
          buildEcommerceContext(query, brandName || undefined).then((results) => {
            ecommerceResults = results
          }).catch(() => {
            // Silently fail
          })
        )
      }

      await Promise.all(searchPromises)
    }

    // Use enhanced prompt if we have additional context
    const combinedContext = [ragContext, webSearchResults, ecommerceResults].filter(Boolean).join('\n\n')
    const systemPrompt = combinedContext
      ? createEnhancedPrompt(combinedContext || undefined, undefined)
      : SEARCH_SYSTEM_PROMPT

    // Build messages array for Claude
    // For follow-up questions, we need to convert HTML responses to plain text
    const claudeMessages = conversationHistory.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.role === 'assistant'
        ? stripHtml(m.content)  // Convert HTML to plain text for context
        : m.content,
    }))

    // Add current query
    claudeMessages.push({
      role: 'user' as const,
      content: query,
    })

    const newTurnCount = turnCount + 1
    const limitReached = newTurnCount >= CONVERSATION_LIMITS.MAX_TURNS

    // Streaming response
    if (useStreaming) {
      const stream = await client.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: systemPrompt,
        messages: claudeMessages,
      })

      const encoder = new TextEncoder()
      let fullResponse = '' // Collect full response for UAE Memory

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            // Send metadata first (including sources)
            const metadata = JSON.stringify({
              type: 'metadata',
              turnCount: newTurnCount,
              limitReached,
              sources: ragSources,
            })
            controller.enqueue(encoder.encode(`data: ${metadata}\n\n`))

            // Stream the content
            let stopReason = 'end_turn'
            for await (const event of stream) {
              if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                fullResponse += event.delta.text
                const chunk = JSON.stringify({
                  type: 'content',
                  text: event.delta.text,
                })
                controller.enqueue(encoder.encode(`data: ${chunk}\n\n`))
              } else if (event.type === 'message_delta' && 'stop_reason' in event.delta) {
                stopReason = (event.delta as { stop_reason: string }).stop_reason
              }
            }

            // Auto-continue if response was cut off (max_tokens hit)
            if (stopReason === 'max_tokens') {
              const elapsed = Date.now() - startTime
              // Only continue if we have enough time budget (< 40s elapsed)
              if (elapsed < 40000) {
                const continuationMessages = [
                  ...claudeMessages,
                  { role: 'assistant' as const, content: fullResponse },
                  { role: 'user' as const, content: '이어서 계속 작성해주세요. 중단된 부분부터 이어서 써주세요.' },
                ]

                const continuationStream = await client.messages.stream({
                  model: 'claude-sonnet-4-20250514',
                  max_tokens: 4096,
                  system: systemPrompt,
                  messages: continuationMessages,
                })

                for await (const event of continuationStream) {
                  if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                    fullResponse += event.delta.text
                    const chunk = JSON.stringify({
                      type: 'content',
                      text: event.delta.text,
                    })
                    controller.enqueue(encoder.encode(`data: ${chunk}\n\n`))
                  }
                }
              }
            }

            // Send done signal FIRST to ensure client receives complete response
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
            controller.close()

            // Save to UAE Memory + log after stream is closed (non-blocking)
            const responseTimeMs = Date.now() - startTime
            await Promise.all([
              saveToUAEMemory(query, fullResponse, 'ko', ragSources).catch(() => {}),
              logQuestion({
                query,
                success: true,
                responseTimeMs,
                userAgent: request.headers.get('user-agent') || undefined,
              }).catch(() => {}),
            ])
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Stream error'
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`))
            controller.close()
          }
        },
      })

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // Non-streaming response (fallback)
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: systemPrompt,
      messages: claudeMessages,
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

    // Save to UAE Memory with sources
    await saveToUAEMemory(query, html, 'ko', ragSources)

    return NextResponse.json({
      success: true,
      html,
      turnCount: newTurnCount,
      limitReached,
      sources: ragSources,
    })
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

// Helper to strip HTML tags for context
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000)  // Limit context per message
}
