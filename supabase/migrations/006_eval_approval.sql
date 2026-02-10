-- ============================================================================
-- Eval Approval: Add approval tracking to eval_issues
-- ============================================================================

ALTER TABLE eval_issues
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by TEXT;

CREATE INDEX IF NOT EXISTS eval_issues_approved_at_idx ON public.eval_issues(approved_at);
