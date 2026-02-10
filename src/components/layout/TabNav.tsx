'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale } from '@/hooks/useLocale'

const tabs = [
  { href: '/home', key: 'home' as const, icon: '🏠' },
  { href: '/comparison', key: 'comparison' as const, icon: '🔄' },
  { href: '/places', key: 'places' as const, icon: '📍' },
  { href: '/politics', key: 'politics' as const, icon: '🏛️' },
  { href: '/economy', key: 'economy' as const, icon: '📈' },
  { href: '/society', key: 'society' as const, icon: '🎭' },
  { href: '/industry', key: 'industry' as const, icon: '🏭' },
  { href: '/legal', key: 'legal' as const, icon: '⚖️' },
  { href: '/news', key: 'news' as const, icon: '📰' },
] as const

export function TabNav() {
  const pathname = usePathname()
  const { t } = useLocale()

  return (
    <div className="px-6 bg-bg/70 backdrop-blur-2xl border-b border-brd/30">
      <div className="max-w-[1700px] mx-auto">
        <nav className="flex gap-1 overflow-x-auto py-2 -mx-1">
          {tabs.map(({ href, key, icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`
                  relative px-4 py-2 rounded-lg text-[11px] font-semibold whitespace-nowrap
                  transition-colors duration-200 flex items-center gap-2
                  ${isActive
                    ? 'text-gold bg-gold/[0.08] border border-gold/20 shadow-[0_2px_12px_rgba(200,164,78,0.08)]'
                    : 'text-t4 hover:text-t2 hover:bg-bg3/50 border border-transparent'
                  }
                `}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold" />
                )}

                <span className="text-sm">
                  {icon}
                </span>

                <span className={isActive ? 'text-gold' : ''}>
                  {t.nav[key]}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
