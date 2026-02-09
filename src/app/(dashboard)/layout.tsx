'use client'

import { useState, useCallback, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { TabNav } from '@/components/layout/TabNav'
import { Footer } from '@/components/layout/Footer'
import { SearchModal } from '@/components/layout/SearchModal'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { BeginnerModeProvider } from '@/contexts/BeginnerModeContext'

export default function DashboardLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [initialSearchQuery, setInitialSearchQuery] = useState<string | undefined>()

  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => {
    setSearchOpen(false)
    setInitialSearchQuery(undefined)
  }, [])

  const openCommandPalette = useCallback(() => setCommandPaletteOpen(true), [])
  const closeCommandPalette = useCallback(() => setCommandPaletteOpen(false), [])

  const openAskMeWithQuery = useCallback((query?: string) => {
    setInitialSearchQuery(query)
    setSearchOpen(true)
  }, [])

  // ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // ⌘K or Ctrl+K opens command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (searchOpen) {
          // If search is open, close it and open command palette
          setSearchOpen(false)
        }
        setCommandPaletteOpen(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen])

  // Listen for askme-prefill events and open search modal
  useEffect(() => {
    function handlePrefill(e: CustomEvent<{ query: string }>) {
      openAskMeWithQuery(e.detail.query)
    }
    window.addEventListener('askme-prefill', handlePrefill as EventListener)
    return () => window.removeEventListener('askme-prefill', handlePrefill as EventListener)
  }, [openAskMeWithQuery])

  return (
    <BeginnerModeProvider>
      <div className="min-h-screen flex flex-col">
        <Header onSearchClick={openCommandPalette} />
        <TabNav />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1700px] mx-auto w-full animate-fade-in">
          {children}
        </main>
        <Footer />
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={closeCommandPalette}
          onOpenAskMe={openAskMeWithQuery}
        />
        <SearchModal
          isOpen={searchOpen}
          onClose={closeSearch}
          initialQuery={initialSearchQuery}
        />
      </div>
    </BeginnerModeProvider>
  )
}
