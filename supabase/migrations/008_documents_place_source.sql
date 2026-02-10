-- Add 'place' to documents source constraint for neighborhood guide RAG

ALTER TABLE public.documents
DROP CONSTRAINT IF EXISTS documents_source_check;

ALTER TABLE public.documents
ADD CONSTRAINT documents_source_check
CHECK (source IN ('news', 'dashboard', 'askme', 'research', 'manual', 'insight', 'place'));
