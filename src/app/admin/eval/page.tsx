'use client'

import { useState, useEffect, useCallback } from 'react'

interface EvalRun {
  id: string
  run_type: 'daily_rules' | 'weekly_factcheck' | 'on_demand'
  status: 'running' | 'done' | 'failed'
  started_at: string
  finished_at: string | null
  summary: {
    total_claims?: number
    by_verdict?: Record<string, number>
    by_severity?: Record<string, number>
  }
}

interface EvalIssue {
  id: string
  run_id: string | null
  object_type: string
  object_id: string | null
  object_locator: string | null
  claim: string
  claim_type: string | null
  status: 'open' | 'triaged' | 'fixed' | 'dismissed'
  verdict: 'supported' | 'needs_update' | 'contradicted' | 'unverifiable'
  severity: 'high' | 'med' | 'low'
  confidence: number
  current_text: string | null
  suggested_fix: string | null
  suggested_patch: {
    field?: string
    old_value?: string
    new_value?: string
    as_of?: string
  } | null
  references: Array<{ url: string; snippet?: string; source?: string }>
  approved_at: string | null
  approved_by: string | null
  created_at: string
}

type IssueFilter = 'all' | 'open' | 'fixed' | 'dismissed'

const RUN_TYPE_LABELS: Record<string, string> = {
  daily_rules: 'Daily Rules',
  weekly_factcheck: 'Weekly Factcheck',
  on_demand: 'On Demand',
}

const STATUS_COLORS: Record<string, string> = {
  running: 'text-accent-blue',
  done: 'text-accent-green',
  failed: 'text-accent-red',
  open: 'text-accent-orange',
  triaged: 'text-accent-blue',
  fixed: 'text-accent-green',
  dismissed: 'text-t4',
}

const VERDICT_COLORS: Record<string, string> = {
  supported: 'text-accent-green',
  needs_update: 'text-accent-orange',
  contradicted: 'text-accent-red',
  unverifiable: 'text-t4',
}

const VERDICT_BG: Record<string, string> = {
  supported: 'bg-accent-green/10 text-accent-green border-accent-green/20',
  needs_update: 'bg-accent-orange/10 text-accent-orange border-accent-orange/20',
  contradicted: 'bg-accent-red/10 text-accent-red border-accent-red/20',
  unverifiable: 'bg-t4/10 text-t3 border-t4/20',
}

const SEVERITY_COLORS: Record<string, string> = {
  high: 'bg-accent-red/20 text-accent-red',
  med: 'bg-accent-orange/20 text-accent-orange',
  low: 'bg-t4/20 text-t3',
}

const OBJECT_TYPE_LABELS: Record<string, string> = {
  document: 'documents table UPDATE',
  insight: 'insights table UPDATE + documents sync',
  page: 'Create insight + documents sync',
  news: 'documents UPDATE or create insight',
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function IssueCard({
  issue,
  onApprove,
  onDismiss,
}: {
  issue: EvalIssue
  onApprove: (id: string) => Promise<void>
  onDismiss: (id: string) => Promise<void>
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [processing, setProcessing] = useState(false)

  const isActionable = issue.status === 'open' || issue.status === 'triaged'
  const hasFix = Boolean(issue.suggested_fix)

  const handleApprove = async () => {
    setProcessing(true)
    try {
      await onApprove(issue.id)
    } finally {
      setProcessing(false)
      setConfirmOpen(false)
    }
  }

  const handleDismiss = async () => {
    setProcessing(true)
    try {
      await onDismiss(issue.id)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-bg2 border border-brd rounded-xl overflow-hidden hover:border-brd2 transition-all">
      <div className="p-4">
        {/* Header: severity + verdict + locator */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${SEVERITY_COLORS[issue.severity]}`}>
            {issue.severity.toUpperCase()}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${VERDICT_BG[issue.verdict]}`}>
            {issue.verdict}
          </span>
          {issue.object_locator && (
            <span className="text-[11px] text-t3 font-mono">{issue.object_locator}</span>
          )}
          {!isActionable && (
            <span className={`ml-auto text-[10px] font-medium ${STATUS_COLORS[issue.status]}`}>
              {issue.status.toUpperCase()}
              {issue.approved_at && ` - ${formatDate(issue.approved_at)}`}
            </span>
          )}
        </div>

        {/* Current vs Fix comparison */}
        <div className="space-y-2">
          {issue.current_text && (
            <div className="flex gap-2 text-xs">
              <span className="shrink-0 text-t4 w-10 pt-0.5">AS-IS</span>
              <p className="text-t2 bg-accent-red/5 px-2.5 py-1.5 rounded border border-accent-red/10 flex-1">
                {issue.current_text}
              </p>
            </div>
          )}
          {issue.suggested_fix && (
            <div className="flex gap-2 text-xs">
              <span className="shrink-0 text-t4 w-10 pt-0.5">TO-BE</span>
              <p className="text-t1 bg-accent-green/5 px-2.5 py-1.5 rounded border border-accent-green/10 flex-1 font-medium">
                {issue.suggested_fix}
              </p>
            </div>
          )}
        </div>

        {/* References */}
        {issue.references.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {issue.references.map((ref, i) => (
              <a
                key={i}
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-accent-blue/70 hover:text-accent-blue bg-accent-blue/5 px-2 py-0.5 rounded"
              >
                {ref.source ?? (() => { try { return new URL(ref.url).hostname } catch { return ref.url } })()}
              </a>
            ))}
            <span className="text-[10px] text-t4 py-0.5">
              confidence: {Math.round(issue.confidence * 100)}%
            </span>
          </div>
        )}

        {/* Action buttons */}
        {isActionable && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-brd/50">
            {hasFix && (
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={processing}
                className="px-3 py-1.5 text-[11px] font-semibold bg-accent-green/10 text-accent-green rounded-lg border border-accent-green/20 hover:bg-accent-green/20 transition-all disabled:opacity-50"
              >
                {processing ? 'Applying...' : 'Approve & Apply'}
              </button>
            )}
            <button
              onClick={handleDismiss}
              disabled={processing}
              className="px-3 py-1.5 text-[11px] font-medium bg-t4/10 text-t3 rounded-lg border border-brd hover:bg-t4/20 transition-all disabled:opacity-50"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Confirmation panel */}
      {confirmOpen && (
        <div className="border-t border-gold/20 bg-gold/5 p-4">
          <p className="text-xs font-semibold text-gold mb-3">Confirm Fix Application</p>

          {/* Patch details */}
          {issue.suggested_patch && (
            <div className="mb-3 text-xs space-y-1">
              <div className="flex gap-2">
                <span className="text-t4 w-16 shrink-0">Field:</span>
                <span className="text-t2 font-mono">{issue.suggested_patch.field}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-t4 w-16 shrink-0">Old:</span>
                <span className="text-accent-red line-through">{issue.suggested_patch.old_value}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-t4 w-16 shrink-0">New:</span>
                <span className="text-accent-green font-medium">{issue.suggested_patch.new_value}</span>
              </div>
              {issue.suggested_patch.as_of && (
                <div className="flex gap-2">
                  <span className="text-t4 w-16 shrink-0">As of:</span>
                  <span className="text-t2">{issue.suggested_patch.as_of}</span>
                </div>
              )}
            </div>
          )}

          {/* Apply method explanation */}
          <div className="mb-3 text-[11px] text-t3 bg-bg2 px-3 py-2 rounded">
            Apply method: <span className="text-t1 font-medium">{OBJECT_TYPE_LABELS[issue.object_type] ?? issue.object_type}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={processing}
              className="px-4 py-2 text-xs font-bold bg-accent-green text-white rounded-lg hover:bg-accent-green/90 transition-all disabled:opacity-50"
            >
              {processing ? 'Applying...' : 'Confirm Apply'}
            </button>
            <button
              onClick={() => setConfirmOpen(false)}
              disabled={processing}
              className="px-4 py-2 text-xs font-medium bg-bg3 text-t2 rounded-lg border border-brd hover:border-brd2 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function EvalAdminPage() {
  const [runs, setRuns] = useState<EvalRun[]>([])
  const [issues, setIssues] = useState<EvalIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [triggeringRun, setTriggeringRun] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'runs' | 'issues'>('issues')
  const [issueFilter, setIssueFilter] = useState<IssueFilter>('open')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch runs from existing admin eval API
      const runsRes = await fetch('/api/admin/eval')
      if (!runsRes.ok) throw new Error('Failed to fetch eval data')
      const runsData = await runsRes.json()
      setRuns(runsData.runs || [])

      // Fetch issues via new GET handler
      const issuesRes = await fetch('/api/admin/eval/issues?status=all&limit=100')
      if (issuesRes.ok) {
        const issuesData = await issuesRes.json()
        setIssues(issuesData.data || [])
      } else {
        // Fallback to old API
        setIssues(runsData.issues || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const triggerRun = async (runType: 'daily_rules' | 'weekly_factcheck' | 'on_demand') => {
    setTriggeringRun(true)
    try {
      const response = await fetch('/api/admin/eval/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_type: runType }),
      })
      if (!response.ok) throw new Error('Failed to trigger run')
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger run')
    } finally {
      setTriggeringRun(false)
    }
  }

  const handleApprove = async (issueId: string) => {
    try {
      const response = await fetch('/api/admin/eval/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: issueId, action: 'approve' }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to approve')

      // Update local state
      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId
            ? { ...issue, status: 'fixed' as const, approved_at: new Date().toISOString(), approved_by: 'admin' }
            : issue
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve issue')
    }
  }

  const handleDismiss = async (issueId: string) => {
    try {
      const response = await fetch('/api/admin/eval/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: issueId, action: 'dismiss' }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to dismiss')

      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId
            ? { ...issue, status: 'dismissed' as const, approved_at: new Date().toISOString() }
            : issue
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss issue')
    }
  }

  const filteredIssues = issues.filter((issue) => {
    if (issueFilter === 'all') return true
    if (issueFilter === 'open') return issue.status === 'open' || issue.status === 'triaged'
    return issue.status === issueFilter
  })

  const openIssues = issues.filter((i) => i.status === 'open' || i.status === 'triaged')
  const highSeverityCount = openIssues.filter((i) => i.severity === 'high').length

  const filterCounts: Record<IssueFilter, number> = {
    all: issues.length,
    open: openIssues.length,
    fixed: issues.filter((i) => i.status === 'fixed').length,
    dismissed: issues.filter((i) => i.status === 'dismissed').length,
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-xl font-bold text-t1 tracking-wide">
          Eval Agent
        </h1>
        <p className="text-t3 text-sm mt-1">
          Content verification, fact-checking, and approval workflow
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-bg2 border border-brd rounded-xl p-5">
          <p className="text-t3 text-xs font-medium mb-2">Open Issues</p>
          <p className={`text-2xl font-bold ${openIssues.length > 0 ? 'text-accent-orange' : 'text-accent-green'}`}>
            {openIssues.length}
          </p>
          <p className="text-t4 text-[11px] mt-1">
            {highSeverityCount > 0 ? `${highSeverityCount} high severity` : 'No high severity'}
          </p>
        </div>
        <div className="bg-bg2 border border-brd rounded-xl p-5">
          <p className="text-t3 text-xs font-medium mb-2">Total Runs</p>
          <p className="text-2xl font-bold text-accent-blue">{runs.length}</p>
          <p className="text-t4 text-[11px] mt-1">
            {runs.filter((r) => r.status === 'done').length} completed
          </p>
        </div>
        <div className="bg-bg2 border border-brd rounded-xl p-5">
          <p className="text-t3 text-xs font-medium mb-2">Last Run</p>
          <p className="text-2xl font-bold text-gold">
            {runs.length > 0 ? formatDate(runs[0].started_at) : 'Never'}
          </p>
          <p className="text-t4 text-[11px] mt-1">
            {runs.length > 0 ? RUN_TYPE_LABELS[runs[0].run_type] : '-'}
          </p>
        </div>
        <div className="bg-bg2 border border-brd rounded-xl p-5">
          <p className="text-t3 text-xs font-medium mb-2">Fixed Issues</p>
          <p className="text-2xl font-bold text-accent-green">
            {filterCounts.fixed}
          </p>
          <p className="text-t4 text-[11px] mt-1">
            {filterCounts.dismissed} dismissed
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-t2 mb-3">Trigger Evaluation</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => triggerRun('daily_rules')}
            disabled={triggeringRun}
            className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-accent-blue/10 text-accent-blue border border-accent-blue/20 hover:bg-accent-blue/20 hover:border-accent-blue/35 transition-all duration-200 disabled:opacity-50"
          >
            {triggeringRun ? 'Running...' : 'Run Daily Rules'}
          </button>
          <button
            onClick={() => triggerRun('weekly_factcheck')}
            disabled={triggeringRun}
            className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-accent-purple/10 text-accent-purple border border-accent-purple/20 hover:bg-accent-purple/20 hover:border-accent-purple/35 transition-all duration-200 disabled:opacity-50"
          >
            {triggeringRun ? 'Running...' : 'Run Weekly Factcheck'}
          </button>
          <button
            onClick={() => triggerRun('on_demand')}
            disabled={triggeringRun}
            className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 hover:border-gold/35 transition-all duration-200 disabled:opacity-50"
          >
            {triggeringRun ? 'Running...' : 'Run Full Evaluation'}
          </button>
          <button
            onClick={fetchData}
            className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-bg3 text-t2 border border-brd hover:border-brd2 transition-all duration-200"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-accent-red/10 border border-accent-red/20 rounded-lg text-accent-red text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-3 underline text-xs opacity-70">
            dismiss
          </button>
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex gap-4 mb-4 border-b border-brd">
        <button
          onClick={() => setSelectedTab('issues')}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${
            selectedTab === 'issues'
              ? 'text-gold border-b-2 border-gold'
              : 'text-t3 hover:text-t1'
          }`}
        >
          Issues ({issues.length})
        </button>
        <button
          onClick={() => setSelectedTab('runs')}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${
            selectedTab === 'runs'
              ? 'text-gold border-b-2 border-gold'
              : 'text-t3 hover:text-t1'
          }`}
        >
          Runs ({runs.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-t3 text-sm py-8 text-center">Loading...</div>
      ) : selectedTab === 'issues' ? (
        <>
          {/* Issue filter tabs */}
          <div className="flex gap-2 mb-4">
            {(['open', 'all', 'fixed', 'dismissed'] as IssueFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setIssueFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  issueFilter === filter
                    ? 'bg-gold/10 text-gold border border-gold/20'
                    : 'bg-bg3 text-t3 border border-brd hover:border-brd2'
                }`}
              >
                {filter === 'open' ? 'Open' : filter.charAt(0).toUpperCase() + filter.slice(1)} ({filterCounts[filter]})
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredIssues.length === 0 ? (
              <div className="text-t3 text-sm py-8 text-center">
                No {issueFilter === 'all' ? '' : issueFilter} issues found
              </div>
            ) : (
              filteredIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onApprove={handleApprove}
                  onDismiss={handleDismiss}
                />
              ))
            )}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {runs.length === 0 ? (
            <div className="text-t3 text-sm py-8 text-center">No runs yet</div>
          ) : (
            runs.map((run) => (
              <div
                key={run.id}
                className="bg-bg2 border border-brd rounded-xl p-4 hover:border-brd2 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-t1 font-medium">
                      {RUN_TYPE_LABELS[run.run_type]}
                    </p>
                    <p className="text-xs text-t3 mt-1">
                      Started: {formatDate(run.started_at)}
                      {run.finished_at && ` • Finished: ${formatDate(run.finished_at)}`}
                    </p>
                  </div>
                  <span className={`text-sm font-medium ${STATUS_COLORS[run.status]}`}>
                    {run.status}
                  </span>
                </div>
                {run.summary.total_claims && (
                  <div className="mt-3 pt-3 border-t border-brd/50 text-xs text-t3">
                    Claims checked: {run.summary.total_claims}
                    {run.summary.by_verdict && (
                      <span className="ml-3">
                        {Object.entries(run.summary.by_verdict)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(', ')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
