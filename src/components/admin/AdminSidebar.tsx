'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AdminSidebarProps {
  readonly onLogout: () => void
}

interface NavItem {
  readonly href: string
  readonly label: string
  readonly icon: string
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: '◈' },
  { href: '/admin/sections', label: 'Sections', icon: '▦' },
  { href: '/admin/news', label: 'News', icon: '◇' },
  { href: '/admin/keywords', label: 'Keywords', icon: '◆' },
  { href: '/admin/askme', label: 'Ask Me AI', icon: '◉' },
  { href: '/admin/content', label: 'Content', icon: '▣' },
  { href: '/admin/logs', label: 'Logs', icon: '▤' },
] as const

function isActiveLink(pathname: string, href: string): boolean {
  if (href === '/admin') {
    return pathname === '/admin'
  }
  return pathname.startsWith(href)
}

export function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-56 min-h-screen bg-bg2 border-r border-brd flex flex-col">
      <div className="p-5 border-b border-brd">
        <Link href="/admin" className="block">
          <span className="font-display text-base font-bold text-gold tracking-wide">
            All About UAE ADMIN
          </span>
          <span className="block text-t3 text-[10px] mt-0.5 tracking-tight">
            Management Console
          </span>
        </Link>
      </div>

      <nav className="flex-1 py-3">
        {NAV_ITEMS.map((item) => {
          const active = isActiveLink(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-2.5 px-5 py-2.5 text-sm transition-all duration-200
                ${active
                  ? 'text-gold bg-gold/8 border-r-2 border-gold'
                  : 'text-t2 hover:text-t1 hover:bg-bg3'
                }
              `}
            >
              <span className="text-xs">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-brd">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-xs text-t3 hover:text-t2 transition-colors duration-200 mb-2"
        >
          <span>←</span>
          <span>Back to Dashboard</span>
        </Link>
        <button
          onClick={onLogout}
          className="w-full px-3 py-2 text-xs font-medium text-accent-red/80 hover:text-accent-red hover:bg-accent-red/8 rounded-md transition-all duration-200 text-left"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}
