'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { X, Sparkles, Send, RotateCcw, AlertCircle, History, Trash2, MessageSquare, ChevronLeft } from 'lucide-react'
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
  const { t } = useLocale()
  const {
    isLoading,
    messages,
    turnCount,
    limitReached,
    isNearLimit,
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

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
  const hasAssistantResponse = messages.some(m => m.role === 'assistant')
  const hasSavedConversations = savedConversations.length > 0
  const showInitialLoading = isLoading && !hasAssistantResponse

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
                        className="p-1 rounded-lg text-t4 opacity-0 group-hover:opacity-100 hover:text-accent-red hover:bg-accent-red/10 transition-all"
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
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gold/10 text-gold text-[12px] font-medium hover:bg-gold/20 transition-colors"
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
                  className="flex items-center gap-1.5 py-2 px-3 rounded-xl border border-brd/80 bg-bg3/60 text-t3 text-[11px] font-medium hover:bg-bg3 hover:text-t1 hover:border-brd transition-all duration-200"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  새 대화
                </button>
              )}
              <button
                onClick={onClose}
                className="py-2 px-2 rounded-xl border border-brd/80 bg-bg3/60 text-t3 hover:bg-bg3 hover:text-t1 hover:border-brd transition-all duration-200"
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
                  className="px-3.5 py-1.5 rounded-lg border border-brd/80 bg-bg3/50 text-t3 text-[11px] font-medium transition-all duration-200 hover:border-gold/30 hover:text-gold hover:bg-gold/[0.06] hover:-translate-y-0.5"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto rounded-2xl border border-brd/60 bg-gradient-to-b from-bg2/95 to-bg2/80">
            {/* Initial loading state - shown when waiting for first response */}
            {showInitialLoading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative w-20 h-20 mb-6">
                  <div className="absolute inset-0 border-2 border-gold/10 rounded-full" />
                  <div className="absolute inset-0 border-2 border-transparent border-t-gold rounded-full animate-spin" />
                  <div className="absolute inset-3 border-2 border-transparent border-t-gold3/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                  <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-gold/60 floating" />
                </div>
                <div className="text-lg font-semibold text-gold mb-2">{t.search.loading}</div>
                <div className="text-sm text-t3">AI가 대시보드 데이터를 분석하고 있습니다...</div>
                <div className="text-xs text-t4 mt-3 px-4 py-1.5 rounded-full bg-bg3/50">응답까지 5~15초 소요될 수 있습니다</div>
                <div className="text-xs text-t4 mt-2 animate-pulse">조금 오래 걸린다면 잠시만 더 기다려주세요!</div>
              </div>
            )}

            {/* Welcome screen - no messages and not loading */}
            {!hasMessages && !showInitialLoading && (
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

            {hasMessages && !showInitialLoading && (
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
                          className="flex-1 px-4 py-3 rounded-2xl rounded-bl-md bg-bg3/80 border border-brd/40
                            search-content text-[13px] leading-[1.9] text-t2
                            [&_p]:mb-3 [&_p]:last:mb-0
                            [&_h1]:font-display [&_h1]:text-xl [&_h1]:text-gold [&_h1]:mb-4 [&_h1]:mt-4 [&_h1]:first:mt-0 [&_h1]:pb-2 [&_h1]:border-b [&_h1]:border-gold/30
                            [&_h2]:font-display [&_h2]:text-lg [&_h2]:text-gold [&_h2]:mb-3 [&_h2]:mt-4 [&_h2]:first:mt-0 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-brd/50
                            [&_h3]:text-[14px] [&_h3]:font-bold [&_h3]:text-gold3 [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:first:mt-0
                            [&_h4]:text-[13px] [&_h4]:font-semibold [&_h4]:text-t1 [&_h4]:mt-3 [&_h4]:mb-1.5
                            [&_b]:text-gold [&_strong]:text-gold [&_em]:text-t3 [&_em]:not-italic
                            [&_ul]:pl-5 [&_ul]:my-3 [&_ul]:space-y-2 [&_ul]:list-disc
                            [&_ol]:pl-5 [&_ol]:my-3 [&_ol]:space-y-2 [&_ol]:list-decimal
                            [&_li]:text-t2 [&_li]:leading-relaxed [&_li_b]:text-t1 [&_li_strong]:text-t1
                            [&_li>ul]:mt-2 [&_li>ol]:mt-2
                            [&_code]:bg-bg [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:font-mono [&_code]:text-xs [&_code]:text-accent-cyan [&_code]:border [&_code]:border-brd/50
                            [&_pre]:bg-bg [&_pre]:p-3 [&_pre]:rounded-xl [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-brd/50
                            [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:text-xs [&_table]:rounded-xl [&_table]:overflow-hidden [&_table]:border [&_table]:border-brd/50
                            [&_th]:p-2.5 [&_th]:text-left [&_th]:bg-bg [&_th]:text-t1 [&_th]:font-semibold [&_th]:border-b [&_th]:border-brd/50
                            [&_td]:p-2.5 [&_td]:border-b [&_td]:border-brd/30 [&_td]:text-t2
                            [&_tr:last-child_td]:border-b-0
                            [&_tr:hover_td]:bg-bg/30
                            [&_blockquote]:border-l-3 [&_blockquote]:border-l-gold [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-4 [&_blockquote]:bg-gold/[0.05] [&_blockquote]:rounded-r-xl [&_blockquote]:text-t3
                            [&_hr]:my-4 [&_hr]:border-brd/50
                            [&_a]:text-gold [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-gold3"
                          dangerouslySetInnerHTML={{ __html: message.content }}
                        />
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-gold animate-pulse" />
                      </div>
                      <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-bg3/80 border border-brd/40">
                        <div className="flex items-center gap-2 text-[12px] text-t3">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span>분석 중...</span>
                        </div>
                      </div>
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
                  placeholder={limitReached ? '대화 제한에 도달했습니다' : hasMessages ? '후속 질문을 입력하세요...' : t.search.placeholder}
                  disabled={limitReached}
                  className="flex-1 py-4 px-5 bg-transparent text-t1 text-[15px] font-sans outline-none rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSearch() }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
                <button
                  onClick={handleSearch}
                  disabled={limitReached || isLoading}
                  className="mr-2 p-3 rounded-xl bg-gradient-to-r from-gold to-gold3 text-bg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-gold/20"
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
