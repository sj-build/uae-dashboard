'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface BeginnerModeContextValue {
  readonly isBeginnerMode: boolean
  readonly toggleBeginnerMode: () => void
  readonly setBeginnerMode: (value: boolean) => void
}

const BeginnerModeContext = createContext<BeginnerModeContextValue | null>(null)

const STORAGE_KEY = 'uae-dashboard-beginner-mode'

interface BeginnerModeProviderProps {
  readonly children: ReactNode
}

export function BeginnerModeProvider({ children }: BeginnerModeProviderProps) {
  const [isBeginnerMode, setIsBeginnerMode] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      setIsBeginnerMode(stored === 'true')
    }
    setIsHydrated(true)
  }, [])

  // Save to localStorage when changed
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, String(isBeginnerMode))
    }
  }, [isBeginnerMode, isHydrated])

  const toggleBeginnerMode = useCallback(() => {
    setIsBeginnerMode(prev => !prev)
  }, [])

  const setBeginnerModeValue = useCallback((value: boolean) => {
    setIsBeginnerMode(value)
  }, [])

  return (
    <BeginnerModeContext.Provider
      value={{
        isBeginnerMode,
        toggleBeginnerMode,
        setBeginnerMode: setBeginnerModeValue,
      }}
    >
      {children}
    </BeginnerModeContext.Provider>
  )
}

export function useBeginnerMode(): BeginnerModeContextValue {
  const context = useContext(BeginnerModeContext)
  if (!context) {
    throw new Error('useBeginnerMode must be used within a BeginnerModeProvider')
  }
  return context
}
