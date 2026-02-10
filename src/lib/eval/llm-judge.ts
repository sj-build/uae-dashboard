/**
 * LLM Judge for Claim Verification
 *
 * Uses Claude to verify claims against source content
 */

import { getAnthropicClient } from '@/lib/anthropic'
import type { ExtractedClaim, VerificationResult, Verdict, SuggestedPatch, SourceRegistry } from './types'
import { determineSeverity } from './rules-checker'

const VERIFICATION_PROMPT = `You are an expert fact-checker verifying claims about UAE.

Your task:
1. Analyze the claim against provided source information
2. Determine if the claim is accurate, needs updating, is contradicted, or cannot be verified
3. Provide confidence level (0-1) based on source quality and evidence strength

Verdicts:
- **supported**: Claim is accurate according to authoritative sources
- **needs_update**: Claim was accurate but data has changed (e.g., old statistics)
- **contradicted**: Claim directly conflicts with authoritative sources
- **unverifiable**: Cannot find sufficient evidence to verify or refute

Response format (JSON only):
{
  "verdict": "supported|needs_update|contradicted|unverifiable",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation",
  "references": [
    {"url": "source_url", "snippet": "relevant quote", "source": "source name"}
  ],
  "suggested_fix": "The COMPLETE corrected sentence with specific numbers, dates, and policy names. NOT vague like 'update needed'. Example: 'UAE corporate tax rate is 9% (effective June 2023)'",
  "suggested_patch": {
    "field": "the data field being corrected, e.g. 'corporateTaxRate'",
    "old_value": "the current incorrect value, e.g. '5%'",
    "new_value": "the correct updated value, e.g. '9%'",
    "as_of": "effective date in YYYY or YYYY-MM format, e.g. '2023-06'"
  }
}

CRITICAL rules for suggested_fix and suggested_patch:
- When verdict is "needs_update" or "contradicted", you MUST provide BOTH suggested_fix AND suggested_patch
- suggested_fix must be a COMPLETE replacement sentence ready to use as-is, with specific numbers/dates/names
- suggested_patch.old_value must match the current incorrect data
- suggested_patch.new_value must contain the authoritative corrected data
- suggested_patch.as_of must indicate when this data became effective
- Do NOT write vague fixes like "needs to be updated" or "check latest data"
- When verdict is "supported" or "unverifiable", set both to null

Important:
- Trust official UAE government sources (u.ae, ministries) most highly
- Trust international organizations (IMF, World Bank) for economic data
- Consider publication dates - prefer recent sources
- For regulatory matters, trust ADGM, DIFC, VARA, CBUAE
- If sources conflict, note this and use the most authoritative one`

interface VerificationContext {
  claim: ExtractedClaim
  sourceContent: string
  relevantSources: SourceRegistry[]
  additionalContext?: string
}

/**
 * Verify a single claim using LLM
 */
export async function verifyClaim(context: VerificationContext): Promise<VerificationResult> {
  const client = getAnthropicClient()

  const sourceInfo = context.relevantSources
    .map((s) => `- ${s.name} (${s.category}, trust: ${s.trust_level}/5): ${s.base_url}`)
    .join('\n')

  const userMessage = `Claim to verify:
"${context.claim.claim}"

Claim type: ${context.claim.claim_type}
Location: ${context.claim.object_locator}
Original text: ${context.claim.current_text}

Relevant authoritative sources:
${sourceInfo}

${context.sourceContent ? `Source content/research findings:\n${context.sourceContent}` : 'No additional source content available.'}

${context.additionalContext ? `Additional context:\n${context.additionalContext}` : ''}

Provide your verification result as JSON.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: VERIFICATION_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const responseText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => 'text' in block ? block.text : '')
      .join('')

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return {
        verdict: 'unverifiable',
        severity: 'low',
        confidence: 0.3,
        references: [],
        suggested_fix: null,
        suggested_patch: null,
      }
    }

    const result = JSON.parse(jsonMatch[0]) as {
      verdict: Verdict
      confidence: number
      references: Array<{ url: string; snippet?: string; source?: string }>
      suggested_fix: string | null
      suggested_patch: SuggestedPatch | null
    }

    // Validate and normalize
    const validVerdicts: Verdict[] = ['supported', 'needs_update', 'contradicted', 'unverifiable']
    const verdict = validVerdicts.includes(result.verdict) ? result.verdict : 'unverifiable'
    const confidence = Math.max(0, Math.min(1, result.confidence || 0.5))

    // Validate suggested_patch structure
    const patch = result.suggested_patch
    const validPatch = patch && patch.field && patch.old_value && patch.new_value && patch.as_of
      ? patch
      : null

    return {
      verdict,
      severity: determineSeverity(context.claim, verdict),
      confidence,
      references: result.references || [],
      suggested_fix: result.suggested_fix || null,
      suggested_patch: validPatch,
    }
  } catch (error) {
    console.error('Claim verification failed:', error)
    return {
      verdict: 'unverifiable',
      severity: 'low',
      confidence: 0.1,
      references: [],
      suggested_fix: null,
      suggested_patch: null,
    }
  }
}

/**
 * Batch verify multiple claims
 */
export async function verifyClaimsBatch(
  claims: ExtractedClaim[],
  relevantSources: SourceRegistry[],
  options: {
    concurrency?: number
    sourceContentFetcher?: (claim: ExtractedClaim) => Promise<string>
  } = {}
): Promise<Map<string, VerificationResult>> {
  const { concurrency = 3, sourceContentFetcher } = options
  const results = new Map<string, VerificationResult>()

  // Process in batches
  for (let i = 0; i < claims.length; i += concurrency) {
    const batch = claims.slice(i, i + concurrency)

    const promises = batch.map(async (claim) => {
      const sourceContent = sourceContentFetcher ? await sourceContentFetcher(claim) : ''

      const result = await verifyClaim({
        claim,
        sourceContent,
        relevantSources,
      })

      return { locator: claim.object_locator, result }
    })

    const batchResults = await Promise.all(promises)
    batchResults.forEach(({ locator, result }) => {
      results.set(locator, result)
    })

    // Rate limit delay between batches
    if (i + concurrency < claims.length) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  return results
}

/**
 * Quick verification for high-priority claims only
 */
export async function verifyHighPriorityClaims(
  claims: ExtractedClaim[],
  sources: SourceRegistry[]
): Promise<Map<string, VerificationResult>> {
  // Filter to high-priority claims
  const highPriority = claims.filter(
    (c) =>
      c.claim_type === 'numeric' ||
      c.claim_type === 'policy' ||
      c.object_locator.includes('tax') ||
      c.object_locator.includes('legal') ||
      c.object_locator.includes('visa')
  )

  return verifyClaimsBatch(highPriority.slice(0, 20), sources)
}
