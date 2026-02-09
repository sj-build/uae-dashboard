'use client'

import Link from 'next/link'

interface StatCard {
  readonly label: string
  readonly value: string
  readonly sub: string
  readonly accent: string
}

const STATS: readonly StatCard[] = [
  { label: 'Total Sections', value: '26', sub: 'Across 7 pages', accent: 'text-accent-blue' },
  { label: 'News Keywords', value: '70', sub: 'Across 4 layers', accent: 'text-accent-green' },
  { label: 'Ask Me AI', value: 'Active', sub: 'Claude Sonnet 4', accent: 'text-accent-purple' },
  { label: 'Languages', value: '2', sub: 'Korean, English', accent: 'text-gold' },
] as const

function StatCardComponent({ stat }: { readonly stat: StatCard }) {
  return (
    <div className="bg-bg2 border border-brd rounded-xl p-5 hover:border-brd2 transition-all duration-200">
      <p className="text-t3 text-xs font-medium mb-2">{stat.label}</p>
      <p className={`text-2xl font-bold ${stat.accent}`}>{stat.value}</p>
      <p className="text-t4 text-[11px] mt-1">{stat.sub}</p>
    </div>
  )
}

function triggerCrawl() {
  alert('Crawl triggered. This will be connected to the backend in Phase 3.')
}

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-xl font-bold text-t1 tracking-wide">
          Admin Dashboard
        </h1>
        <p className="text-t3 text-sm mt-1">
          Overview of system status and quick actions
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((stat) => (
          <StatCardComponent key={stat.label} stat={stat} />
        ))}
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-t2 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/sections"
            className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 hover:border-gold/35 transition-all duration-200"
          >
            Edit Sections
          </Link>
          <Link
            href="/admin/news"
            className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-accent-green/10 text-accent-green border border-accent-green/20 hover:bg-accent-green/20 hover:border-accent-green/35 transition-all duration-200"
          >
            Manage News
          </Link>
          <Link
            href="/admin/keywords"
            className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-accent-blue/10 text-accent-blue border border-accent-blue/20 hover:bg-accent-blue/20 hover:border-accent-blue/35 transition-all duration-200"
          >
            Edit Keywords
          </Link>
          <Link
            href="/admin/askme"
            className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-accent-purple/10 text-accent-purple border border-accent-purple/20 hover:bg-accent-purple/20 hover:border-accent-purple/35 transition-all duration-200"
          >
            Ask Me AI Settings
          </Link>
          <Link
            href="/admin/eval"
            className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-accent-orange/10 text-accent-orange border border-accent-orange/20 hover:bg-accent-orange/20 hover:border-accent-orange/35 transition-all duration-200"
          >
            Eval Agent
          </Link>
          <button
            onClick={triggerCrawl}
            className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 hover:bg-accent-cyan/20 hover:border-accent-cyan/35 transition-all duration-200"
          >
            Trigger News Crawl
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-bg2 border border-brd rounded-xl p-5">
          <h2 className="text-sm font-semibold text-t2 mb-3">Recent Activity</h2>
          <div className="space-y-2.5">
            {[
              { time: 'Just now', action: 'Admin system updated', detail: 'Section Editor, AI Settings added' },
              { time: '2 hours ago', action: 'News crawl completed', detail: '14 new articles found' },
              { time: '6 hours ago', action: 'Bilingual content', detail: 'English data files created' },
            ].map((activity) => (
              <div key={activity.time} className="flex items-center gap-3 text-xs py-2 border-b border-brd/50 last:border-0">
                <span className="text-t4 w-24 shrink-0">{activity.time}</span>
                <span className="text-t1 font-medium">{activity.action}</span>
                <span className="text-t3 ml-auto">{activity.detail}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bg2 border border-brd rounded-xl p-5">
          <h2 className="text-sm font-semibold text-t2 mb-3">System Status</h2>
          <div className="space-y-2.5">
            {[
              { label: 'Claude API', status: 'Connected', color: 'text-accent-green' },
              { label: 'News Crawling', status: 'Active (ISR)', color: 'text-accent-blue' },
              { label: 'Bilingual Mode', status: 'Korean + English', color: 'text-gold' },
              { label: 'Build Status', status: 'Production Ready', color: 'text-accent-purple' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs py-2 border-b border-brd/50 last:border-0">
                <span className="text-t2">{item.label}</span>
                <span className={`font-medium ${item.color}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
