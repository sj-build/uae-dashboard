'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import type { AdminLog, WeeklyAnalysisReport, ContentGap, SuggestedImprovement } from '@/types/question-log'

interface QuestionStats {
  totalQuestions: number
  successRate: number
  avgResponseTime: number
  byLocale: { ko: number; en: number }
}

interface ReportSummary {
  id: string
  weekStartDate: string
  weekEndDate: string
  totalQuestions: number
  successRate: number
  contentGapsCount: number
  improvementsCount: number
  status: string
}

type FilterType = 'all' | 'auto' | 'manual' | 'analysis'

function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function typeBadge(type: 'auto' | 'manual' | 'analysis'): string {
  switch (type) {
    case 'auto':
      return 'bg-accent-blue/10 text-accent-blue border-accent-blue/20'
    case 'manual':
      return 'bg-accent-orange/10 text-accent-orange border-accent-orange/20'
    case 'analysis':
      return 'bg-accent-purple/10 text-accent-purple border-accent-purple/20'
    default:
      return 'bg-bg3 text-t3 border-brd'
  }
}

function priorityBadge(priority: string): string {
  switch (priority) {
    case 'high':
      return 'bg-accent-red/10 text-accent-red'
    case 'medium':
      return 'bg-accent-orange/10 text-accent-orange'
    case 'low':
      return 'bg-accent-green/10 text-accent-green'
    default:
      return 'bg-bg3 text-t3'
  }
}

function StatCard({ label, value, subtext }: { label: string; value: string | number; subtext?: string }) {
  return (
    <div className="bg-bg2 border border-brd rounded-xl p-4">
      <div className="text-xs text-t3 mb-1">{label}</div>
      <div className="text-2xl font-bold text-t1">{value}</div>
      {subtext && <div className="text-[10px] text-t4 mt-1">{subtext}</div>}
    </div>
  )
}

function ReportDetailModal({
  report,
  onClose,
  onApplyImprovement,
}: {
  report: WeeklyAnalysisReport
  onClose: () => void
  onApplyImprovement: (improvement: SuggestedImprovement) => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg1 border border-brd rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-bg1 border-b border-brd p-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-t1">
              Weekly Report: {report.weekStartDate} ~ {report.weekEndDate}
            </h2>
            <p className="text-xs text-t3 mt-1">
              Generated {new Date(report.generatedAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-t3 hover:text-t1 hover:bg-bg3 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-bg2 border border-brd rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-t1">{report.totalQuestions}</div>
              <div className="text-[10px] text-t3">Total Questions</div>
            </div>
            <div className="bg-bg2 border border-brd rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-accent-green">{report.successRate.toFixed(1)}%</div>
              <div className="text-[10px] text-t3">Success Rate</div>
            </div>
            <div className="bg-bg2 border border-brd rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-accent-purple">{report.contentGaps.length}</div>
              <div className="text-[10px] text-t3">Content Gaps</div>
            </div>
          </div>

          {/* Top Topics */}
          {report.topTopics.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-t2 mb-3">Top Topics</h3>
              <div className="space-y-2">
                {report.topTopics.map((topic, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-bg2 border border-brd rounded-lg">
                    <span className="text-sm text-t1">{topic.topic}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-t3">{topic.count} questions</span>
                      <span className="text-xs text-accent-green">{topic.successRate.toFixed(0)}% success</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Gaps */}
          {report.contentGaps.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-t2 mb-3">Content Gaps</h3>
              <div className="space-y-2">
                {report.contentGaps.map((gap: ContentGap, idx: number) => (
                  <div key={idx} className="p-3 bg-bg2 border border-brd rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-t1">{gap.topic}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${priorityBadge(gap.priority)}`}>
                        {gap.priority}
                      </span>
                    </div>
                    <p className="text-xs text-t3 mb-2">{gap.reason}</p>
                    <div className="flex flex-wrap gap-1">
                      {gap.questionExamples.map((q: string, qIdx: number) => (
                        <span key={qIdx} className="px-2 py-0.5 text-[10px] bg-bg3 text-t4 rounded">
                          "{q}"
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Improvements */}
          {report.suggestedImprovements.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-t2 mb-3">Suggested Improvements</h3>
              <div className="space-y-2">
                {report.suggestedImprovements.map((imp: SuggestedImprovement) => (
                  <div key={imp.id} className="p-3 bg-bg2 border border-brd rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                            imp.type === 'add' ? 'bg-accent-green/10 text-accent-green' :
                            imp.type === 'update' ? 'bg-accent-blue/10 text-accent-blue' :
                            'bg-accent-red/10 text-accent-red'
                          }`}>
                            {imp.type}
                          </span>
                          <span className="text-xs text-t4 font-mono">{imp.targetFile}</span>
                        </div>
                        <p className="text-sm text-t1">{imp.description}</p>
                        <p className="text-xs text-t3 mt-1">{imp.reason}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                          imp.status === 'applied' ? 'bg-accent-green/10 text-accent-green' :
                          imp.status === 'approved' ? 'bg-accent-blue/10 text-accent-blue' :
                          imp.status === 'rejected' ? 'bg-accent-red/10 text-accent-red' :
                          'bg-accent-orange/10 text-accent-orange'
                        }`}>
                          {imp.status}
                        </span>
                        {imp.status === 'pending' && (
                          <button
                            onClick={() => onApplyImprovement(imp)}
                            className="px-3 py-1 text-[10px] font-semibold bg-gold/10 text-gold border border-gold/20 rounded hover:bg-gold/20 transition-colors"
                          >
                            Create PR
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminLogsPage() {
  const [filter, setFilter] = useState<FilterType>('all')
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [stats, setStats] = useState<QuestionStats | null>(null)
  const [reports, setReports] = useState<ReportSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [triggeringAnalysis, setTriggeringAnalysis] = useState(false)
  const [selectedReport, setSelectedReport] = useState<WeeklyAnalysisReport | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/logs?type=${filter}`)
      const data = await res.json()
      if (data.success) {
        setLogs(data.logs || [])
        setStats(data.stats || null)
        setReports(data.reports || [])
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const filteredLogs = useMemo(() => {
    if (filter === 'all') {
      return logs
    }
    return logs.filter((log) => log.type === filter)
  }, [logs, filter])

  const handleTriggerAnalysis = async () => {
    setTriggeringAnalysis(true)
    try {
      const res = await fetch('/api/cron/weekly-analysis', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'dev'}`,
        },
      })
      const data = await res.json()
      if (data.success) {
        alert(`Analysis completed! ${data.report?.totalQuestions || 0} questions analyzed.`)
        fetchLogs()
      } else {
        alert(`Analysis failed: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      alert(`Failed to trigger analysis: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setTriggeringAnalysis(false)
    }
  }

  const handleViewReport = async (reportId: string) => {
    setLoadingReport(true)
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`)
      const data = await res.json()
      if (data.success && data.report) {
        setSelectedReport(data.report)
      } else {
        alert('Failed to load report details')
      }
    } catch (error) {
      alert(`Failed to load report: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoadingReport(false)
    }
  }

  const handleApplyImprovement = async (improvement: SuggestedImprovement) => {
    if (!confirm(`Create a PR for: "${improvement.description}"?\n\nThis will create a new branch and open a pull request on GitHub.`)) {
      return
    }

    try {
      const res = await fetch('/api/admin/apply-improvement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'dev'}`,
        },
        body: JSON.stringify({
          improvementId: improvement.id,
          type: improvement.type,
          targetFile: improvement.targetFile,
          description: improvement.description,
          reason: improvement.reason,
        }),
      })

      const data = await res.json()
      if (data.success && data.pr) {
        alert(`PR created successfully!\n\nPR #${data.pr.number}\n${data.pr.url}`)
        window.open(data.pr.url, '_blank')
        fetchLogs()
      } else {
        alert(`Failed to create PR: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      alert(`Failed to create PR: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-bold text-t1 tracking-wide">
            Update Logs & Analytics
          </h1>
          <p className="text-t3 text-sm mt-1">
            Track system activity and question analytics
          </p>
        </div>

        <button
          onClick={handleTriggerAnalysis}
          disabled={triggeringAnalysis}
          className="px-4 py-2 text-xs font-semibold bg-accent-purple/10 text-accent-purple border border-accent-purple/20 rounded-lg hover:bg-accent-purple/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {triggeringAnalysis ? 'Analyzing...' : 'Run Weekly Analysis'}
        </button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Questions (7 days)"
            value={stats.totalQuestions}
            subtext={`KO: ${stats.byLocale.ko} / EN: ${stats.byLocale.en}`}
          />
          <StatCard
            label="Success Rate"
            value={`${stats.successRate}%`}
            subtext="Successfully answered"
          />
          <StatCard
            label="Avg Response Time"
            value={`${stats.avgResponseTime}ms`}
            subtext="API response time"
          />
          <StatCard
            label="Weekly Reports"
            value={reports.length}
            subtext="Analysis reports generated"
          />
        </div>
      )}

      {/* Recent Reports */}
      {reports.length > 0 && (
        <div className="bg-bg2 border border-brd rounded-xl p-4 mb-6">
          <h2 className="text-sm font-semibold text-t2 mb-3">Recent Analysis Reports</h2>
          <div className="space-y-2">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 bg-bg3 rounded-lg hover:bg-bg3/80 transition-colors cursor-pointer"
                onClick={() => handleViewReport(report.id)}
              >
                <div>
                  <span className="text-xs text-t1 font-medium">
                    {report.weekStartDate} ~ {report.weekEndDate}
                  </span>
                  <span className="text-[10px] text-t4 ml-2">
                    {report.totalQuestions} questions · {report.contentGapsCount} gaps · {report.improvementsCount} suggestions
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                    report.status === 'approved' ? 'bg-accent-green/10 text-accent-green' :
                    report.status === 'rejected' ? 'bg-accent-red/10 text-accent-red' :
                    report.status === 'applied' ? 'bg-accent-blue/10 text-accent-blue' :
                    'bg-accent-orange/10 text-accent-orange'
                  }`}>
                    {report.status}
                  </span>
                  <span className="text-xs text-t4">View →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <label htmlFor="log-filter" className="text-xs text-t3">
          Filter:
        </label>
        <select
          id="log-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterType)}
          className="px-3 py-1.5 bg-bg3 border border-brd rounded-lg text-xs text-t1 focus:outline-none focus:border-gold/30 transition-colors duration-200 appearance-none cursor-pointer"
        >
          <option value="all">All Types</option>
          <option value="auto">Auto Only</option>
          <option value="manual">Manual Only</option>
          <option value="analysis">Analysis Only</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-bg2 border border-brd rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-brd">
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-t3 uppercase tracking-wider w-32">
                Date
              </th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-t3 uppercase tracking-wider w-24">
                Type
              </th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-t3 uppercase tracking-wider">
                Action
              </th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-t3 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                    <span className="text-sm text-t3">Loading logs...</span>
                  </div>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-t3">
                  No logs found. Logs will appear as questions are asked and analyses are run.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-brd/50 hover:bg-bg3/30 transition-colors duration-150"
                >
                  <td className="px-5 py-3">
                    <span className="text-xs text-t3 whitespace-nowrap">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-medium border rounded ${typeBadge(log.type)}`}>
                      {log.type}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-t1">{log.action}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-t3">{log.details}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-right">
        <span className="text-[11px] text-t4">
          Showing {filteredLogs.length} of {logs.length} entries
        </span>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onApplyImprovement={handleApplyImprovement}
        />
      )}

      {/* Loading overlay */}
      {loadingReport && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-bg1 border border-brd rounded-xl p-6 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            <span className="text-sm text-t1">Loading report...</span>
          </div>
        </div>
      )}
    </div>
  )
}
