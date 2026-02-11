'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { ChatMessage } from '@/types/search'
import { CONVERSATION_LIMITS } from '@/types/search'
import type { SourceReference } from '@/lib/supabase'

const STORAGE_KEY = 'uae-dashboard-conversations'
const MAX_SAVED_CONVERSATIONS = 10

export interface SavedConversation {
  readonly id: string
  readonly title: string
  readonly messages: readonly ChatMessage[]
  readonly createdAt: string
  readonly updatedAt: string
}

function generateId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function loadConversations(): SavedConversation[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveConversations(conversations: SavedConversation[]): void {
  if (typeof window === 'undefined') return
  try {
    // Keep only the most recent conversations
    const toSave = conversations.slice(0, MAX_SAVED_CONVERSATIONS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

interface StreamEvent {
  type: 'metadata' | 'content' | 'done' | 'error'
  text?: string
  turnCount?: number
  limitReached?: boolean
  sources?: SourceReference[]
  error?: string
}

export function useSearch() {
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streamingContent, setStreamingContent] = useState('')
  const [limitReached, setLimitReached] = useState(false)
  const [turnCount, setTurnCount] = useState(0)
  const [sources, setSources] = useState<SourceReference[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const conversationIdRef = useRef<string | null>(null)

  // Sync ref with state
  useEffect(() => {
    conversationIdRef.current = currentConversationId
  }, [currentConversationId])

  // Load saved conversations on mount
  useEffect(() => {
    setSavedConversations(loadConversations())
  }, [])

  // Save current conversation when messages change
  useEffect(() => {
    if (messages.length === 0) return

    const now = new Date().toISOString()
    const firstUserMessage = messages.find(m => m.role === 'user')
    const title = firstUserMessage?.content.slice(0, 50) || 'New Conversation'

    const existingId = conversationIdRef.current

    if (existingId) {
      // Update existing conversation
      setSavedConversations(prev => {
        const updated = prev.map(conv =>
          conv.id === existingId
            ? { ...conv, messages: [...messages], updatedAt: now }
            : conv
        )
        saveConversations(updated)
        return updated
      })
    } else {
      // Create new conversation
      const newId = generateId()
      conversationIdRef.current = newId
      setCurrentConversationId(newId)

      const newConv: SavedConversation = {
        id: newId,
        title,
        messages: [...messages],
        createdAt: now,
        updatedAt: now,
      }

      setSavedConversations(prev => {
        const updated = [newConv, ...prev]
        saveConversations(updated)
        return updated
      })
    }
  }, [messages])

  const search = useCallback(async (query: string) => {
    if (!query.trim()) return
    if (limitReached) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    // Add user message to state immediately
    const userMessage: ChatMessage = { role: 'user', content: query }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setStreamingContent('')

    try {
      // Build messages for API (current messages + new user message)
      const currentMessages = [...messages, userMessage]

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          messages: currentMessages,
          stream: true,
        }),
        signal: controller.signal,
      })

      // Check if streaming response
      const contentType = response.headers.get('content-type')

      if (contentType?.includes('text/event-stream')) {
        // Handle streaming response
        const reader = response.body?.getReader()
        if (!reader) throw new Error('No reader available')

        const decoder = new TextDecoder()
        let accumulatedContent = ''
        let doneReceived = false

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const event: StreamEvent = JSON.parse(line.slice(6))

                  if (event.type === 'metadata') {
                    if (event.turnCount !== undefined) {
                      setTurnCount(event.turnCount)
                    }
                    if (event.limitReached) {
                      setLimitReached(true)
                    }
                    if (event.sources && event.sources.length > 0) {
                      setSources(event.sources)
                    }
                  } else if (event.type === 'content' && event.text) {
                    accumulatedContent += event.text
                    setStreamingContent(accumulatedContent)
                  } else if (event.type === 'done') {
                    doneReceived = true
                    const assistantMessage: ChatMessage = { role: 'assistant', content: accumulatedContent }
                    setMessages(prev => [...prev, assistantMessage])
                    setStreamingContent('')
                  } else if (event.type === 'error') {
                    throw new Error(event.error || 'Stream error')
                  }
                } catch (parseError) {
                  // Skip invalid JSON lines (but re-throw explicit stream errors)
                  if (parseError instanceof Error && parseError.message !== 'Stream error' && !parseError.message.startsWith('Stream')) {
                    continue
                  }
                  throw parseError
                }
              }
            }
          }
        } catch (streamError) {
          // Stream broke — save partial content if we have any
          if (!doneReceived && accumulatedContent) {
            const assistantMessage: ChatMessage = { role: 'assistant', content: accumulatedContent }
            setMessages(prev => [...prev, assistantMessage])
            setStreamingContent('')
          } else if (!doneReceived && !accumulatedContent) {
            // No response at all — re-throw to remove user message in outer catch
            throw streamError
          }
          // If doneReceived is true, message was already saved — do nothing
        }
      } else {
        // Handle non-streaming response (fallback)
        const data = await response.json()

        if (data.success && data.html) {
          const assistantMessage: ChatMessage = { role: 'assistant', content: data.html }
          setMessages(prev => [...prev, assistantMessage])
          setTurnCount(data.turnCount ?? turnCount + 1)

          if (data.limitReached) {
            setLimitReached(true)
          }
          if (data.sources && data.sources.length > 0) {
            setSources(data.sources)
          }
        } else {
          // Remove the user message on error
          setMessages(prev => prev.slice(0, -1))
        }
      }
    } catch (error) {
      // Only remove user message if no assistant response was added
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1]
        // If last message is the user's question (no response yet), remove it
        if (lastMsg?.role === 'user') return prev.slice(0, -1)
        // Otherwise an assistant response exists — keep everything
        return prev
      })
      setStreamingContent('')

      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Search error:', error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [messages, limitReached, turnCount])

  const clearConversation = useCallback(() => {
    setMessages([])
    setStreamingContent('')
    setLimitReached(false)
    setTurnCount(0)
    setSources([])
    setCurrentConversationId(null)
    conversationIdRef.current = null
  }, [])

  const loadConversation = useCallback((conversationId: string) => {
    const conversation = savedConversations.find(c => c.id === conversationId)
    if (conversation) {
      conversationIdRef.current = conversationId
      setCurrentConversationId(conversationId)
      setMessages([...conversation.messages])
      const userMessageCount = conversation.messages.filter(m => m.role === 'user').length
      setTurnCount(userMessageCount)
      setLimitReached(userMessageCount >= CONVERSATION_LIMITS.MAX_TURNS)
    }
  }, [savedConversations])

  const deleteConversation = useCallback((conversationId: string) => {
    setSavedConversations(prev => {
      const updated = prev.filter(c => c.id !== conversationId)
      saveConversations(updated)
      return updated
    })
    if (currentConversationId === conversationId) {
      clearConversation()
    }
  }, [currentConversationId, clearConversation])

  const isNearLimit = turnCount >= CONVERSATION_LIMITS.WARNING_TURNS

  return {
    isLoading,
    messages,
    streamingContent,
    turnCount,
    limitReached,
    isNearLimit,
    sources,
    search,
    clearConversation,
    // Conversation history
    savedConversations,
    currentConversationId,
    loadConversation,
    deleteConversation,
  } as const
}
