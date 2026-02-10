'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { X, Sparkles, Send, RotateCcw, AlertCircle, History, Trash2, MessageSquare, ChevronLeft, ExternalLink, FileText, Newspaper } from 'lucide-react'
import { useLocale } from '@/hooks/useLocale'
import { useSearch, type SavedConversation } from '@/hooks/useSearch'
import { CONVERSATION_LIMITS } from '@/types/search'

const quickTags = [
  'UAE 경제 구조',
  'Abu Dhabi vs Dubai',
  'Sheikh Tahnoun',
  'Mubadala',
  'ADIA',
  'G42',
  'MGX',
  'UAE 크립토 규제',
  'K-Beauty UAE 기회',
  '에너지 전환',
  '에미라티화',
  '골든비자',
  'Wasta 문화',
  '라마단 비즈니스',
  'SWF 투자 현황',
] as const

interface SearchModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly initialQuery?: string
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '방금 전'
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  if (diffDays < 7) return `${diffDays}일 전`
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export function SearchModal({ isOpen, onClose, initialQuery }: SearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { t, locale } = useLocale()
  const {
    isLoading,
    messages,
    streamingContent,
    turnCount,
    limitReached,
    isNearLimit,
    sources,
    search,
    clearConversation,
    savedConversations,
    currentConversationId,
    loadConversation,
    deleteConversation,
  } = useSearch()
  const [isFocused, setIsFocused] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const hasExecutedInitialQuery = useRef(false)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  const loadingStartTime = useRef<number | null>(null)

  const loadingMessages = locale === 'en' ? [
    { text: 'AI is analyzing dashboard data...', subtext: 'Just a moment 🔍' },
    { text: 'This is quite a complex question...', subtext: 'Time for a sip of coffee ☕' },
    { text: 'Almost there!', subtext: 'UAE expert is typing furiously... ⌨️' },
    { text: 'Organizing the data...', subtext: 'Just a bit more for the perfect answer! 💪' },
    { text: 'Finishing up!', subtext: 'A great answer is coming ✨' },
  ] : [
    { text: 'AI가 대시보드 데이터를 분석하고 있습니다...', subtext: '잠시만요 🔍' },
    { text: '생각보다 복잡한 질문이네요...', subtext: '커피 한 모금 하실 시간 ☕' },
    { text: '거의 다 됐어요!', subtext: 'UAE 전문가가 열심히 타이핑 중... ⌨️' },
    { text: '데이터를 정리하고 있습니다...', subtext: '완벽한 답변을 위해 조금만 더! 💪' },
    { text: '마무리 중입니다!', subtext: '좋은 답변이 올 거예요 ✨' },
  ]

  // Update loading message every 5 seconds (only while waiting, not during streaming)
  useEffect(() => {
    if (isLoading && !streamingContent) {
      if (!loadingStartTime.current) {
        loadingStartTime.current = Date.now()
        setLoadingMessageIndex(0)
      }

      const interval = setInterval(() => {
        const elapsed = Date.now() - (loadingStartTime.current || Date.now())
        const newIndex = Math.min(Math.floor(elapsed / 5000), loadingMessages.length - 1)
        setLoadingMessageIndex(newIndex)
      }, 1000)

      return () => clearInterval(interval)
    } else {
      loadingStartTime.current = null
      setLoadingMessageIndex(0)
    }
  }, [isLoading, streamingContent, loadingMessages.length])

  // Auto-scroll to bottom when new messages arrive or streaming content updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, streamingContent])

  // Handle initial query from quick questions
  useEffect(() => {
    if (isOpen && initialQuery && !hasExecutedInitialQuery.current && messages.length === 0) {
      hasExecutedInitialQuery.current = true
      // Defer search to next tick to avoid cascading renders
      const timeoutId = setTimeout(() => {
        search(initialQuery)
      }, 0)
      return () => clearTimeout(timeoutId)
    }
    if (!isOpen) {
      hasExecutedInitialQuery.current = false
    }
  }, [isOpen, initialQuery, messages.length, search])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setShowHistory(false)
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Listen for prefill events from ContextHeader
  useEffect(() => {
    function handlePrefill(e: CustomEvent<{ query: string }>) {
      if (inputRef.current) {
        inputRef.current.value = e.detail.query
        inputRef.current.focus()
      }
    }
    window.addEventListener('askme-prefill', handlePrefill as EventListener)
    return () => window.removeEventListener('askme-prefill', handlePrefill as EventListener)
  }, [])

  const handleSearch = useCallback(() => {
    const query = inputRef.current?.value.trim()
    if (query && !limitReached) {
      search(query)
      if (inputRef.current) inputRef.current.value = ''
    }
  }, [search, limitReached])

  const handleQuickSearch = useCallback((query: string) => {
    if (!limitReached) {
      search(query)
    }
  }, [search, limitReached])

  const handleNewConversation = useCallback(() => {
    clearConversation()
    if (inputRef.current) inputRef.current.value = ''
    inputRef.current?.focus()
    setShowHistory(false)
  }, [clearConversation])

  const handleLoadConversation = useCallback((conv: SavedConversation) => {
    loadConversation(conv.id)
    setShowHistory(false)
  }, [loadConversation])

  const handleDeleteConversation = useCallback((e: React.MouseEvent, convId: string) => {
    e.stopPropagation()
    deleteConversation(convId)
  }, [deleteConversation])

  if (!isOpen) return null

  const hasMessages = messages.length > 0
  const hasSavedConversations = savedConversations.length > 0
  return (
    <div
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-2xl animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gold/[0.02] via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-[900px] mx-auto mt-[50px] px-5 h-[calc(100vh-100px)] flex">
        {/* History Sidebar */}
        {showHistory && (
          <div className="w-[280px] mr-4 flex flex-col bg-bg2/95 rounded-2xl border border-brd/60 overflow-hidden animate-slide-in-left">
            <div className="flex items-center justify-between p-4 border-b border-brd/50">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-gold" />
                <span className="text-sm font-medium text-t1">대화 기록</span>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 rounded-lg text-t4 hover:text-t1 hover:bg-bg3 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {savedConversations.length === 0 ? (
                <div className="text-center py-8 text-t4 text-[12px]">
                  저장된 대화가 없습니다
                </div>
              ) : (
                savedConversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => handleLoadConversation(conv)}
                    className={`w-full text-left p-3 rounded-xl transition-all group ${
                      currentConversationId === conv.id
                        ? 'bg-gold/10 border border-gold/30'
                        : 'hover:bg-bg3 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] text-t1 font-medium truncate">
                          {conv.title}
                        </div>
                        <div className="text-[10px] text-t4 mt-0.5">
                          {formatRelativeTime(conv.updatedAt)} · {conv.messages.filter(m => m.role === 'user').length}회 대화
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteConversation(e, conv.id)}
                        aria-label="대화 삭제"
                        className="p-1 rounded-lg text-t4 opacity-0 group-hover:opacity-100 hover:text-accent-red hover:bg-accent-red/10 transition-opacity focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-accent-red/50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="p-3 border-t border-brd/50">
              <button
                onClick={handleNewConversation}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gold/10 text-gold text-[12px] font-medium hover:bg-gold/20 transition-colors focus-visible:ring-2 focus-visible:ring-gold/50"
              >
                <MessageSquare className="w-4 h-4" />
                새 대화 시작
              </button>
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {hasSavedConversations && !showHistory && (
                <button
                  onClick={() => setShowHistory(true)}
                  className="p-2 rounded-xl border border-brd/80 bg-bg3/60 text-t3 hover:bg-bg3 hover:text-t1 hover:border-brd transition-all duration-200"
                  title="대화 기록"
                >
                  <History className="w-5 h-5" />
                </button>
              )}
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-gold" />
              </div>
              <div>
                <div className="text-lg font-display font-bold text-t1">{t.search.title}</div>
                <div className="text-[11px] text-t4">Powered by Claude</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasMessages && (
                <button
                  onClick={handleNewConversation}
                  className="flex items-center gap-1.5 py-2 px-3 rounded-xl border border-brd/80 bg-bg3/60 text-t3 text-[11px] font-medium hover:bg-bg3 hover:text-t1 hover:border-brd transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-gold/50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  새 대화
                </button>
              )}
              <button
                onClick={onClose}
                aria-label="닫기"
                className="py-2 px-2 rounded-xl border border-brd/80 bg-bg3/60 text-t3 hover:bg-bg3 hover:text-t1 hover:border-brd transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-gold/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Turn Count Indicator */}
          {hasMessages && (
            <div className="flex items-center gap-2 mb-3">
              <div className="text-[10px] text-t4">
                대화 {turnCount}/{CONVERSATION_LIMITS.MAX_TURNS}
              </div>
              <div className="flex-1 h-1 bg-bg3 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    limitReached ? 'bg-accent-red' : isNearLimit ? 'bg-amber-500' : 'bg-gold/50'
                  }`}
                  style={{ width: `${(turnCount / CONVERSATION_LIMITS.MAX_TURNS) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Warning when near limit */}
          {isNearLimit && !limitReached && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-[11px] text-amber-400">
                대화 제한에 가까워지고 있습니다. {CONVERSATION_LIMITS.MAX_TURNS - turnCount}회 남았습니다.
              </span>
            </div>
          )}

          {/* Limit reached message */}
          {limitReached && (
            <div className="flex items-center justify-between gap-2 mb-3 px-3 py-2 rounded-lg bg-accent-red/10 border border-accent-red/30">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-accent-red flex-shrink-0" />
                <span className="text-[11px] text-accent-red">
                  대화 제한에 도달했습니다. 새 대화를 시작해주세요.
                </span>
              </div>
              <button
                onClick={handleNewConversation}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent-red/20 text-accent-red text-[11px] font-medium hover:bg-accent-red/30 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                새 대화 시작
              </button>
            </div>
          )}

          {/* Quick Tags - only show when no messages */}
          {!hasMessages && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-[11px] text-t4 py-1.5 font-medium">{t.search.quickSearch}</span>
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleQuickSearch(tag)}
                  className="px-3.5 py-1.5 rounded-lg border border-brd/80 bg-bg3/50 text-t3 text-[11px] font-medium transition-[border-color,color,background-color,transform] duration-200 hover:border-gold/30 hover:text-gold hover:bg-gold/[0.06] hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-gold/50"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto rounded-2xl border border-brd/60 bg-gradient-to-b from-bg2/95 to-bg2/80">
            {/* Welcome screen - no messages and not loading */}
            {!hasMessages && !isLoading && (
              <div className="text-center py-20 px-5">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gold/[0.08] flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-gold/60 floating" />
                </div>
                <div className="text-xl font-display font-bold text-t1 mb-3">{t.search.title}</div>
                <div className="text-[13px] text-t3 max-w-[500px] mx-auto leading-relaxed">
                  {t.search.description}
                </div>
                {hasSavedConversations && (
                  <button
                    onClick={() => setShowHistory(true)}
                    className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-brd/80 bg-bg3/50 text-t3 text-[12px] font-medium hover:bg-bg3 hover:text-t1 transition-colors"
                  >
                    <History className="w-4 h-4" />
                    이전 대화 보기 ({savedConversations.length})
                  </button>
                )}
              </div>
            )}

            {/* Messages area - always visible when there are messages or loading */}
            {(hasMessages || isLoading) && (
              <div className="p-5 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'user' ? (
                      <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-br-md bg-gold/20 text-t1 text-[13px]">
                        {message.content}
                      </div>
                    ) : (
                      <div className="max-w-[90%] flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0 mt-1">
                          <Sparkles className="w-4 h-4 text-gold" />
                        </div>
                        <div
                          className="flex-1 px-4 py-3 rounded-2xl rounded-bl-md bg-bg3/80 border border-brd/40 search-content text-[13px] leading-[1.9] text-t2"
                          dangerouslySetInnerHTML={{ __html: message.content }}
                        />
                      </div>
                    )}
                  </div>
                ))}

                {/* Streaming content - show as it comes in */}
                {isLoading && streamingContent && (
                  <div className="flex justify-start">
                    <div className="max-w-[90%] flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <Sparkles className="w-4 h-4 text-gold animate-pulse" />
                      </div>
                      <div
                        className="flex-1 px-4 py-3 rounded-2xl rounded-bl-md bg-bg3/80 border border-brd/40 search-content text-[13px] leading-[1.9] text-t2"
                        dangerouslySetInnerHTML={{ __html: streamingContent }}
                      />
                    </div>
                  </div>
                )}

                {/* Loading indicator with rotating messages */}
                {isLoading && !streamingContent && (
                  <div className="flex justify-start">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-gold animate-pulse" />
                      </div>
                      <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-bg3/80 border border-brd/40">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                        <div className="text-[12px] text-t3 transition-all duration-300">
                          {loadingMessages[loadingMessageIndex].text}
                        </div>
                        <div className="text-[11px] text-t4 mt-1 transition-all duration-300">
                          {loadingMessages[loadingMessageIndex].subtext}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sources section - show when we have sources and not loading */}
                {!isLoading && sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-brd/30">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-gold/70" />
                      <span className="text-[12px] font-medium text-t3">
                        {locale === 'en' ? 'Sources Referenced' : '참고 자료'}
                      </span>
                      <span className="text-[10px] text-t4 bg-bg3 px-2 py-0.5 rounded-full">
                        {sources.length}
                      </span>
                    </div>
                    <div className="grid gap-2">
                      {sources.map((source, idx) => (
                        <div
                          key={`${source.type}-${source.id}-${idx}`}
                          className="flex items-start gap-3 p-3 rounded-xl bg-bg/60 border border-brd/30 hover:border-gold/20 transition-colors"
                        >
                          <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                            source.type === 'news'
                              ? 'bg-blue-500/10 text-blue-400'
                              : 'bg-purple-500/10 text-purple-400'
                          }`}>
                            {source.type === 'news' ? (
                              <Newspaper className="w-3.5 h-3.5" />
                            ) : (
                              <MessageSquare className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="text-[12px] text-t1 font-medium line-clamp-2">
                                {source.title}
                              </div>
                              {source.relevance && (
                                <span className={`flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-full ${
                                  source.relevance === 'high'
                                    ? 'bg-accent-green/10 text-accent-green'
                                    : source.relevance === 'medium'
                                    ? 'bg-gold/10 text-gold'
                                    : 'bg-t4/10 text-t4'
                                }`}>
                                  {source.relevance === 'high' ? '높음' : source.relevance === 'medium' ? '중간' : '낮음'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-t4">
                              <span className="capitalize">
                                {source.type === 'news' ? '뉴스' : source.type === 'askme' ? '이전 Q&A' : '문서'}
                              </span>
                              {source.published_at && (
                                <>
                                  <span>·</span>
                                  <span>{new Date(source.published_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                                </>
                              )}
                              {source.url && (
                                <>
                                  <span>·</span>
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-0.5 text-gold hover:text-gold3 transition-colors"
                                  >
                                    <span>원문</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}

          </div>

          {/* Input Area */}
          <div className="mt-4">
            <div className={`
              relative rounded-2xl transition-all duration-500
              ${isFocused ? 'shadow-[0_0_40px_rgba(200,164,78,0.12)]' : ''}
            `}>
              {/* Animated border */}
              <div className={`
                absolute -inset-[1px] rounded-2xl transition-opacity duration-400
                bg-gradient-to-r from-gold/20 via-gold/40 to-gold/20
                ${isFocused ? 'opacity-100' : 'opacity-30'}
              `} />

              <div className="relative flex items-center bg-bg2 rounded-2xl">
                <input
                  ref={inputRef}
                  type="text"
                  name="chat-query"
                  autoComplete="off"
                  placeholder={limitReached ? '대화 제한에 도달했습니다' : hasMessages ? '후속 질문을 입력하세요...' : t.search.placeholder}
                  disabled={limitReached}
                  className="flex-1 py-4 px-5 bg-transparent text-t1 text-[15px] font-sans outline-none rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-gold/50"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSearch() }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
                <button
                  onClick={handleSearch}
                  disabled={limitReached || isLoading}
                  aria-label="전송"
                  className="mr-2 p-3 rounded-xl bg-gradient-to-r from-gold to-gold3 text-bg disabled:opacity-50 disabled:cursor-not-allowed transition-shadow hover:shadow-lg hover:shadow-gold/20 focus-visible:ring-2 focus-visible:ring-gold/50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
