'use client'

import { useLocale } from '@/hooks/useLocale'
import type { Locale } from '@/i18n/types'
import { BeginnerModeToggle } from '@/components/ui/BeginnerModeToggle'

interface HeaderProps {
  readonly onSearchClick: () => void
}

export function Header({ onSearchClick }: HeaderProps) {
  const { locale, t, setLocale } = useLocale()

  return (
    <div className="sticky top-0 z-50">
      {/* UAE flag accent line with animated gradient */}
      <div className="h-[2px] flex relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/20 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" style={{ backgroundSize: '200% 100%' }} />
        <div className="flex-1 bg-gradient-to-r from-transparent via-[#00732f]/40 to-[#00732f]/50" />
        <div className="w-20 bg-gradient-to-r from-[#00732f]/50 via-white/25 to-white/25" />
        <div className="flex-1 bg-gradient-to-r from-white/25 via-gold/40 to-transparent" />
      </div>

      <header className="glass-strong px-6">
        <div className="max-w-[1700px] mx-auto flex items-center h-[56px] gap-4">
          {/* Logo & Title */}
          <div className="whitespace-nowrap flex items-center gap-3 group">
            <div className="w-[3px] h-7 rounded-full bg-gradient-to-b from-gold via-gold to-gold2/50 group-hover:shadow-[0_0_12px_rgba(200,164,78,0.3)] transition-shadow duration-500" />
            <div className="flex items-baseline gap-3">
              <span className="font-display text-[20px] font-semibold text-gradient-gold tracking-tight">
                {t.header.title}
              </span>
              <span className="text-t4 font-sans text-[12px] font-medium tracking-tight hidden sm:inline opacity-60">
                {t.header.subtitle}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={() => setLocale(locale === 'ko' ? 'en' as Locale : 'ko' as Locale)}
              aria-label={locale === 'ko' ? 'Switch to English' : '한국어로 전환'}
              className="relative px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest text-t3 hover:text-gold bg-bg3/50 hover:bg-gold/10 border border-transparent hover:border-gold/20 transition-colors duration-300 uppercase overflow-hidden group focus-visible:ring-2 focus-visible:ring-gold/50"
            >
              <span className="relative z-10">{locale === 'ko' ? 'EN' : 'KO'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </button>

            {/* Beginner Mode Toggle */}
            <BeginnerModeToggle compact />

            <div className="w-px h-5 bg-brd/60" />

            {/* Search Button */}
            <button
              onClick={onSearchClick}
              className="btn-premium group px-4 py-2 rounded-lg text-[11px] font-semibold bg-gold/10 text-gold border border-gold/20 hover:bg-gold/15 hover:border-gold/35 whitespace-nowrap"
            >
              <span className="inline-flex items-center gap-2">
                <svg className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <span>{t.nav.search}</span>
              </span>
            </button>
          </div>
        </div>
      </header>
    </div>
  )
}
