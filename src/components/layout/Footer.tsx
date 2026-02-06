'use client'

import { useLocale } from '@/hooks/useLocale'

export function Footer() {
  const { locale } = useLocale()

  return (
    <footer className="mt-auto border-t border-brd/40">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-[2px] h-3.5 rounded-full bg-gradient-to-b from-gold/60 to-gold2/30" />
            <span className="text-[10px] font-display font-bold text-gold/50 tracking-wider">All About UAE</span>
          </div>
          <div className="text-[10px] text-t4/70 tracking-wide">
            {locale === 'ko'
              ? 'UAE 종합 인텔리전스 대시보드'
              : 'Comprehensive UAE Intelligence Dashboard'}
          </div>
          <div className="text-[10px] text-t4/50 font-mono">
            {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </footer>
  )
}
