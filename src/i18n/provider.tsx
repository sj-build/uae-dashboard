'use client'

import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import type { Locale, Translations } from './types'
import { ko } from './ko'
import { en } from './en'

const STORAGE_KEY = 'uae-dashboard-locale'
const translations: Record<Locale, Translations> = { ko, en }

function readStoredLocale(): Locale | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'ko' || saved === 'en') return saved
  } catch {
    // localStorage unavailable (private browsing, storage disabled, etc.)
  }
  return null
}

interface LocaleContextValue {
  readonly locale: Locale
  readonly t: Translations
  readonly setLocale: (locale: Locale) => void
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: 'ko',
  t: ko,
  setLocale: () => {},
})

export function LocaleProvider({ children }: { readonly children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ko')
  const [isHydrated, setIsHydrated] = useState(false)

  // Read stored locale after hydration
  useEffect(() => {
    const saved = readStoredLocale()
    if (saved) {
      setLocaleState(saved)
    }
    setIsHydrated(true)
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    try {
      localStorage.setItem(STORAGE_KEY, newLocale)
    } catch {
      // localStorage unavailable
    }
  }, [])

  // Suppress hydration mismatch: render with default 'ko' until hydrated
  const activeLocale = isHydrated ? locale : 'ko'

  return (
    <LocaleContext.Provider value={{ locale: activeLocale, t: translations[activeLocale], setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}
