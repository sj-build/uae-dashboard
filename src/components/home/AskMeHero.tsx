'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { Send, Sparkles, Lightbulb } from 'lucide-react'
import { useLocale } from '@/hooks/useLocale'

const QUICK_QUESTIONS_KO = [
  'ADIA vs Mubadala 차이',
  'Sheikh Tahnoun 권력 구조',
  'UAE 크립토 규제',
  'K-Beauty 진출 전략',
  '골든비자 조건',
] as const

const QUICK_QUESTIONS_EN = [
  'ADIA vs Mubadala difference',
  'Sheikh Tahnoun power structure',
  'UAE crypto regulation',
  'K-Beauty market entry',
  'Golden Visa requirements',
] as const

// Fun UAE tips - short, punchy, memorable
const UAE_TIPS_KO = [
  { tip: '"마르하바!" 한마디면 현지인 심쿵 💘', emoji: '👋' },
  { tip: '악수는 오른손으로! 왼손은 NO 🙅', emoji: '🤝' },
  { tip: '라마단엔 낮에 몰래 먹어도 걸림 👀', emoji: '🌙' },
  { tip: '금요일 = UAE의 일요일 ⛱️', emoji: '📅' },
  { tip: '국부펀드 $2조 = 한국 GDP의 1.5배 😳', emoji: '💰' },
  { tip: '"인샬라" = "아마도" 일정 재확인 필수!', emoji: '🗓️' },
  { tip: 'UAE 인구 88%가 외국인, 내가 곧 현지인', emoji: '🌍' },
  { tip: '아부다비 vs 두바이 = 조용한 부자 vs 플렉스', emoji: '🏙️' },
  { tip: '법인세 9%, 프리존은 0%! 🤑', emoji: '📊' },
  { tip: '아랍커피 거절 = 실례. 한 잔은 OK!', emoji: '☕' },
] as const

const UAE_TIPS_EN = [
  { tip: 'Say "Marhaba!" and watch them smile 💘', emoji: '👋' },
  { tip: 'Shake with right hand only! Left = no 🙅', emoji: '🤝' },
  { tip: 'Ramadan: no sneaky snacking in public 👀', emoji: '🌙' },
  { tip: 'Friday = UAE\'s Sunday ⛱️', emoji: '📅' },
  { tip: 'SWF assets $2T = 1.5x Korea\'s GDP 😳', emoji: '💰' },
  { tip: '"Inshallah" ≈ "maybe" — confirm schedules!', emoji: '🗓️' },
  { tip: '88% expats = you\'re basically a local', emoji: '🌍' },
  { tip: 'Abu Dhabi vs Dubai = quiet rich vs flashy', emoji: '🏙️' },
  { tip: 'Corp tax 9%, free zones 0%! 🤑', emoji: '📊' },
  { tip: 'Refuse Arabic coffee = rude. One cup OK!', emoji: '☕' },
] as const

interface AskMeHeroProps {
  readonly onOpenSearch: () => void
  readonly onQuickQuestion: (question: string) => void
}

export function AskMeHero({ onOpenSearch, onQuickQuestion }: AskMeHeroProps) {
  const { locale } = useLocale()
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const quickQuestions = locale === 'en' ? QUICK_QUESTIONS_EN : QUICK_QUESTIONS_KO
  const tips = locale === 'en' ? UAE_TIPS_EN : UAE_TIPS_KO

  // Rotate tip 3x daily (every ~8 hours)
  const todaysTip = useMemo(() => {
    const now = new Date()
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
    const slot = Math.floor(now.getHours() / 8) // 0, 1, or 2
    return tips[(dayOfYear * 3 + slot) % tips.length]
  }, [tips])

  const handleFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleInputClick = useCallback(() => {
    onOpenSearch()
  }, [onOpenSearch])

  const handleQuickQuestion = useCallback((question: string) => {
    onQuickQuestion(question)
  }, [onQuickQuestion])

  return (
    <div className="mb-10 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center mb-8 relative">
        {/* Decorative background glow */}
        <div className="absolute inset-0 -top-20 bg-gradient-to-b from-gold/[0.03] via-gold/[0.02] to-transparent blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="inline-flex items-center gap-2.5 mb-4 px-4 py-2 rounded-full bg-gold/[0.08] border border-gold/15">
            <Sparkles className="w-4 h-4 text-gold floating" />
            <span className="text-[11px] font-bold text-gold uppercase tracking-[0.2em]">{locale === 'en' ? 'AI Assistant' : 'AI 어시스턴트'}</span>
          </div>

          <h1 className="text-[28px] md:text-[34px] font-display font-bold text-t1 mb-3 tracking-tight">
            {locale === 'en' ? (
              <>What would you like to know about <span className="text-gradient-gold">UAE</span>?</>
            ) : (
              <><span className="text-gradient-gold">UAE</span>에 대해 무엇이 궁금하신가요?</>
            )}
          </h1>

          <p className="text-sm text-t3 max-w-lg mx-auto leading-relaxed">
            {locale === 'en'
              ? 'Ask anything — politics, economy, society, industry, investment opportunities'
              : '정치, 경제, 사회, 산업, 투자 기회 등 무엇이든 물어보세요'}
          </p>
        </div>
      </div>

      {/* Search Input - Triggers Modal */}
      <div className="max-w-2xl mx-auto mb-5">
        <div className={`
          relative rounded-2xl transition-all duration-500 cursor-pointer
          ${isFocused ? 'shadow-[0_0_50px_rgba(200,164,78,0.12)]' : ''}
        `}
        onClick={handleInputClick}
        >
          {/* Animated border gradient */}
          <div className={`
            absolute -inset-[1px] rounded-2xl transition-opacity duration-500
            bg-gradient-to-r from-gold/30 via-gold/50 to-gold/30
            ${isFocused ? 'opacity-100' : 'opacity-40'}
          `} />

          <div className="relative bg-bg2 rounded-2xl">
            <input
              ref={inputRef}
              type="text"
              name="search-query"
              autoComplete="off"
              readOnly
              onFocus={handleFocus}
              onBlur={() => setIsFocused(false)}
              onClick={handleInputClick}
              placeholder={locale === 'en' ? 'e.g., How does UAE sovereign wealth fund work?' : '예: UAE 국부펀드는 어떻게 운영되나요?'}
              className="w-full py-5 px-6 pr-28 bg-transparent text-t1 text-[15px] placeholder:text-t4/70 outline-none focus-visible:ring-2 focus-visible:ring-gold/50 rounded-2xl cursor-pointer"
            />

            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                onClick={handleInputClick}
                className="btn-premium px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold to-gold3 text-bg font-bold text-sm flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">{locale === 'en' ? 'Ask' : '질문'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="flex flex-wrap justify-center gap-2.5 max-w-2xl mx-auto stagger-fade mb-6">
        {quickQuestions.map((q) => (
          <button
            key={q}
            onClick={() => handleQuickQuestion(q)}
            className="px-4 py-2 rounded-xl border border-brd/80 bg-bg3/40 text-t3 text-xs font-medium hover:border-gold/30 hover:text-gold hover:bg-gold/[0.06] hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition-all duration-300"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Today's UAE Tip */}
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-400/20">
          <span className="text-sm font-medium bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap">
            {locale === 'en' ? '💡 Today' : '💡 오늘의 발견'}
          </span>
          <span className="text-xs text-t2 text-center">
            {todaysTip.tip}
          </span>
        </div>
      </div>
    </div>
  )
}
