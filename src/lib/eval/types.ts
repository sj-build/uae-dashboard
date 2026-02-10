/**
 * Eval Agent Types
 */

export type RunType = 'daily_rules' | 'weekly_factcheck' | 'on_demand'
export type ObjectType = 'page' | 'document' | 'insight' | 'news'
export type ClaimType = 'numeric' | 'definition' | 'policy' | 'timeline' | 'comparison'
export type IssueStatus = 'open' | 'triaged' | 'fixed' | 'dismissed'
export type Verdict = 'supported' | 'needs_update' | 'contradicted' | 'unverifiable'
export type Severity = 'high' | 'med' | 'low'

export interface SourceRegistry {
  id: string
  name: string
  category: 'official' | 'intl_org' | 'regulator' | 'reputable_media'
  base_url: string
  trust_level: number // 1-5
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EvalRun {
  id: string
  run_type: RunType
  scope: {
    pages?: string[]
    documents?: string[]
    since?: string
  }
  model: string | null
  started_at: string
  finished_at: string | null
  status: 'running' | 'done' | 'failed'
  summary: {
    total_claims?: number
    by_verdict?: Record<Verdict, number>
    by_severity?: Record<Severity, number>
  }
  logs: string | null
}

export interface EvalIssue {
  id: string
  run_id: string | null
  object_type: ObjectType
  object_id: string | null
  object_locator: string | null // e.g., 'comparison.table.rows.gdp'
  claim: string
  claim_type: ClaimType | null
  status: IssueStatus
  verdict: Verdict
  severity: Severity
  confidence: number // 0-1
  current_text: string | null
  suggested_fix: string | null
  suggested_patch: Record<string, unknown> | null
  references: Array<{ url: string; snippet?: string; source?: string }>
  approved_at: string | null
  approved_by: string | null
  created_at: string
  updated_at: string
}

export interface ContentSnapshot {
  id: string
  source: 'site' | 'rag'
  scope: 'pages' | 'documents' | 'insights'
  payload: unknown
  content_hash: string
  created_at: string
}

export interface ExtractedClaim {
  claim: string
  claim_type: ClaimType
  object_locator: string
  current_text: string
}

export interface SuggestedPatch {
  field: string
  old_value: string
  new_value: string
  as_of: string
}

export interface VerificationResult {
  verdict: Verdict
  severity: Severity
  confidence: number
  references: Array<{ url: string; snippet?: string; source?: string }>
  suggested_fix: string | null
  suggested_patch: SuggestedPatch | null
}

export interface ApplyFixResult {
  success: boolean
  applied_to: ObjectType
  target_id: string | null
  action: 'updated_document' | 'updated_insight' | 'created_insight' | 'created_document'
  details: string
}

export interface EvalRunOptions {
  run_type: RunType
  scope?: {
    pages?: string[]
    documents?: string[]
    since?: string
  }
  dry_run?: boolean
}

export interface EvalRunResult {
  run_id: string
  status: 'running' | 'done' | 'failed'
  issues_found: number
  summary: EvalRun['summary']
}
