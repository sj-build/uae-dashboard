import { NextResponse } from 'next/server'
import { upsertDocumentFromReport } from '@/lib/db'

export const maxDuration = 55

interface ReportInput {
  readonly title: string
  readonly url: string
  readonly publisher: string
  readonly date: string
  readonly summary: string
  readonly category: string
  readonly tags?: readonly string[]
}

/**
 * POST /api/memory/ingest-reports
 *
 * Ingest industry reports into documents table for RAG.
 * Fetches each URL, extracts text content, stores with embeddings pending.
 *
 * Body: { reports: ReportInput[] }
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET ?? process.env.ADMIN_PASSWORD

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const reports: ReportInput[] = body.reports

    if (!reports || !Array.isArray(reports) || reports.length === 0) {
      return NextResponse.json({ success: false, error: 'No reports provided' }, { status: 400 })
    }

    let ingested = 0
    let skipped = 0
    let failed = 0
    const errors: string[] = []

    for (const report of reports) {
      try {
        // Fetch page content
        let pageContent = ''
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 10000)

          const res = await fetch(report.url, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; AskUAE-Bot/1.0)',
              'Accept': 'text/html,application/xhtml+xml,text/plain',
            },
          })
          clearTimeout(timeout)

          if (res.ok) {
            const contentType = res.headers.get('content-type') ?? ''

            if (contentType.includes('application/pdf')) {
              // For PDFs, use the summary as content (can't parse PDF in serverless)
              pageContent = `[PDF Report] ${report.title}\n\nPublisher: ${report.publisher}\nDate: ${report.date}\n\n${report.summary}`
            } else {
              const html = await res.text()
              // Extract text from HTML - strip tags, scripts, styles
              pageContent = extractTextFromHtml(html)
            }
          }
        } catch {
          // Fetch failed - use summary as content
        }

        // Build content: always include structured summary even if fetch failed
        const structuredContent = buildReportContent(report, pageContent)

        if (structuredContent.length < 50) {
          skipped++
          continue
        }

        await upsertDocumentFromReport({
          title: report.title,
          url: report.url,
          content: structuredContent,
          summary: report.summary,
          publisher: report.publisher,
          published_at: report.date,
          category: report.category,
          tags: [...(report.tags ?? []), 'report', report.category],
        })

        ingested++
      } catch (err) {
        failed++
        const msg = err instanceof Error ? err.message : JSON.stringify(err)
        errors.push(`${report.title}: ${msg}`)
      }
    }

    return NextResponse.json({
      success: true,
      ingested,
      skipped,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Ingest reports error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function extractTextFromHtml(html: string): string {
  // Remove scripts, styles, and HTML tags
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000) // Limit to ~8000 chars
}

function buildReportContent(report: ReportInput, pageContent: string): string {
  const parts = [
    `# ${report.title}`,
    '',
    `**Publisher:** ${report.publisher}`,
    `**Date:** ${report.date}`,
    `**Category:** ${report.category}`,
    `**Source:** ${report.url}`,
    '',
    '## Summary',
    report.summary,
  ]

  if (pageContent && pageContent.length > 100) {
    parts.push('', '## Full Content', pageContent.slice(0, 6000))
  }

  return parts.join('\n')
}
