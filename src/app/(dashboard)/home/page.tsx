'use client'

import { useState, useCallback } from 'react'
import { AskMeHero } from '@/components/home/AskMeHero'
import { QuickStart } from '@/components/home/QuickStart'
import { UAENowSection, OpportunityRiskSummary } from '@/components/home/UAENowDashboard'
import { NewsHeadlines } from '@/components/overview/NewsHeadlines'
import { SearchModal } from '@/components/layout/SearchModal'

export default function HomePage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [initialQuery, setInitialQuery] = useState<string | undefined>()

  const handleOpenSearch = useCallback(() => {
    setInitialQuery(undefined)
    setIsSearchOpen(true)
  }, [])

  const handleQuickQuestion = useCallback((question: string) => {
    setInitialQuery(question)
    setIsSearchOpen(true)
  }, [])

  const handleCloseSearch = useCallback(() => {
    setIsSearchOpen(false)
    setInitialQuery(undefined)
  }, [])

  return (
    <>
      <AskMeHero onOpenSearch={handleOpenSearch} onQuickQuestion={handleQuickQuestion} />

      <QuickStart />

      {/* Section Order: News (top) → UAE Now → Opportunities/Risks */}
      <NewsHeadlines />

      <UAENowSection />

      <OpportunityRiskSummary />

      <SearchModal isOpen={isSearchOpen} onClose={handleCloseSearch} initialQuery={initialQuery} />
    </>
  )
}
