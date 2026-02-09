'use client'

import { GraduationCap, BookOpen } from 'lucide-react'
import { useBeginnerMode } from '@/contexts/BeginnerModeContext'
import { useLocale } from '@/hooks/useLocale'

interface BeginnerModeToggleProps {
  readonly compact?: boolean
}

export function BeginnerModeToggle({ compact = false }: BeginnerModeToggleProps) {
  const { isBeginnerMode, toggleBeginnerMode } = useBeginnerMode()
  const { locale } = useLocale()

  if (compact) {
    return (
      <button
        onClick={toggleBeginnerMode}
        className={`p-2 rounded-lg transition-all duration-200 ${
          isBeginnerMode
            ? 'bg-accent-green/15 text-accent-green border border-accent-green/30'
            : 'bg-bg3 text-t4 border border-brd hover:text-t2 hover:border-brd2'
        }`}
        title={locale === 'en'
          ? (isBeginnerMode ? 'Beginner Mode ON' : 'Beginner Mode OFF')
          : (isBeginnerMode ? '초보자 모드 켜짐' : '초보자 모드 꺼짐')
        }
      >
        {isBeginnerMode ? (
          <GraduationCap className="w-4 h-4" />
        ) : (
          <BookOpen className="w-4 h-4" />
        )}
      </button>
    )
  }

  return (
    <button
      onClick={toggleBeginnerMode}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 ${
        isBeginnerMode
          ? 'bg-accent-green/15 text-accent-green border border-accent-green/30'
          : 'bg-bg3 text-t3 border border-brd hover:text-t1 hover:border-brd2'
      }`}
    >
      {isBeginnerMode ? (
        <GraduationCap className="w-4 h-4" />
      ) : (
        <BookOpen className="w-4 h-4" />
      )}
      <span>
        {locale === 'en'
          ? (isBeginnerMode ? 'Beginner Mode' : 'Expert Mode')
          : (isBeginnerMode ? '초보자 모드' : '전문가 모드')
        }
      </span>
    </button>
  )
}
