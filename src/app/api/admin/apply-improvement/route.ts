// API endpoint to apply suggested improvements via GitHub PR
// This creates a branch, makes changes, and opens a PR for review

import { NextResponse } from 'next/server'
import { logAdminAction } from '@/lib/question-logger'

interface ApplyImprovementRequest {
  improvementId: string
  type: 'add' | 'update' | 'remove'
  targetFile: string
  description: string
  reason: string
  content?: string
}

// Verify admin authorization
function verifyAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET) {
    return process.env.NODE_ENV === 'development'
  }
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

export async function POST(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json() as ApplyImprovementRequest

    // Check for required GitHub token
    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json(
        { error: 'GitHub token not configured. Add GITHUB_TOKEN to environment variables.' },
        { status: 503 }
      )
    }

    // Get repository info from environment or default
    const repoOwner = process.env.GITHUB_REPO_OWNER || 'sj-build'
    const repoName = process.env.GITHUB_REPO_NAME || 'uae-dashboard'
    const baseBranch = process.env.GITHUB_BASE_BRANCH || 'main'

    // Generate branch name
    const branchName = `auto-improve/${body.improvementId}`
    const timestamp = new Date().toISOString().split('T')[0]

    // Step 1: Get the latest commit SHA of the base branch
    const refResponse = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/git/ref/heads/${baseBranch}`,
      {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    )

    if (!refResponse.ok) {
      const error = await refResponse.text()
      throw new Error(`Failed to get base branch ref: ${error}`)
    }

    const refData = await refResponse.json() as { object: { sha: string } }
    const baseSha = refData.object.sha

    // Step 2: Create a new branch
    const createBranchResponse = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/git/refs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: baseSha,
        }),
      }
    )

    if (!createBranchResponse.ok) {
      const error = await createBranchResponse.text()
      // Branch might already exist, try to continue
      if (!error.includes('Reference already exists')) {
        throw new Error(`Failed to create branch: ${error}`)
      }
    }

    // Step 3: Get current file content (if updating)
    let currentContent = ''
    let fileSha = ''

    if (body.type === 'update' || body.type === 'remove') {
      const fileResponse = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${body.targetFile}?ref=${branchName}`,
        {
          headers: {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      )

      if (fileResponse.ok) {
        const fileData = await fileResponse.json() as { content: string; sha: string }
        currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8')
        fileSha = fileData.sha
      }
    }

    // Step 4: Prepare the new content
    let newContent = body.content || ''

    if (body.type === 'update' && currentContent && body.content) {
      // For updates, we append or modify based on the improvement
      // This is a simplified approach - in production you'd want smarter merging
      newContent = body.content
    } else if (body.type === 'remove') {
      // For removals, we'd need to identify what to remove
      // This is a placeholder - actual implementation would depend on context
      newContent = currentContent
    }

    // Step 5: Create or update the file
    const updateFileResponse = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${body.targetFile}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `[Auto] ${body.description}\n\nReason: ${body.reason}\nImprovement ID: ${body.improvementId}`,
          content: Buffer.from(newContent).toString('base64'),
          branch: branchName,
          ...(fileSha && { sha: fileSha }),
        }),
      }
    )

    if (!updateFileResponse.ok) {
      const error = await updateFileResponse.text()
      throw new Error(`Failed to update file: ${error}`)
    }

    // Step 6: Create a Pull Request
    const prResponse = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/pulls`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `[Auto-Improvement] ${body.description}`,
          body: `## Auto-Generated Improvement

**Type:** ${body.type}
**Target File:** \`${body.targetFile}\`
**Improvement ID:** ${body.improvementId}

### Description
${body.description}

### Reason
${body.reason}

---
*This PR was automatically generated by the UAE 101 weekly analysis system on ${timestamp}.*
*Please review the changes before merging.*`,
          head: branchName,
          base: baseBranch,
        }),
      }
    )

    if (!prResponse.ok) {
      const error = await prResponse.text()
      throw new Error(`Failed to create PR: ${error}`)
    }

    const prData = await prResponse.json() as { number: number; html_url: string }

    // Log the action
    await logAdminAction({
      type: 'auto',
      action: 'Created auto-improvement PR',
      details: `PR #${prData.number}: ${body.description}`,
      metadata: {
        prNumber: prData.number,
        prUrl: prData.html_url,
        improvementId: body.improvementId,
        type: body.type,
        targetFile: body.targetFile,
      },
    })

    return NextResponse.json({
      success: true,
      pr: {
        number: prData.number,
        url: prData.html_url,
      },
    })
  } catch (error) {
    console.error('Apply improvement error:', error)

    await logAdminAction({
      type: 'auto',
      action: 'Auto-improvement failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      { error: 'Failed to apply improvement', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
