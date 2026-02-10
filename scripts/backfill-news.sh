#!/bin/bash
# Backfill 2 years of news into vector DB
# Usage: ./scripts/backfill-news.sh [BASE_URL] [ADMIN_PASSWORD]
#
# Examples:
#   ./scripts/backfill-news.sh http://localhost:3000 mypassword
#   ./scripts/backfill-news.sh https://askuae.vercel.app mypassword

BASE_URL="${1:-http://localhost:3000}"
ADMIN_PASSWORD="${2:-$ADMIN_PASSWORD}"

if [ -z "$ADMIN_PASSWORD" ]; then
  echo "Error: ADMIN_PASSWORD required (arg 2 or env var)"
  exit 1
fi

echo "=== News Backfill: $BASE_URL ==="
echo ""

# Step 1: Get list of months to process
echo "Fetching month list..."
MONTHS_JSON=$(curl -s -X POST "$BASE_URL/api/admin/backfill-news" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_PASSWORD" \
  -d '{"listMonths": true}')

echo "$MONTHS_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Total months: {d.get(\"total\",0)}')" 2>/dev/null

MONTHS=$(echo "$MONTHS_JSON" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for m in d.get('months', []):
    print(m)
" 2>/dev/null)

if [ -z "$MONTHS" ]; then
  echo "Error: Could not fetch months list"
  echo "$MONTHS_JSON"
  exit 1
fi

# Step 2: Process each month
TOTAL_CRAWLED=0
TOTAL_SYNCED=0
TOTAL_DOCS=0
TOTAL_EMBEDS=0

for MONTH in $MONTHS; do
  echo ""
  echo "--- Processing $MONTH ---"

  RESULT=$(curl -s -X POST "$BASE_URL/api/admin/backfill-news" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_PASSWORD" \
    -d "{\"month\": \"$MONTH\"}" \
    --max-time 60)

  # Parse result
  SUCCESS=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success',''))" 2>/dev/null)
  CRAWLED=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('crawled',0))" 2>/dev/null)
  SYNCED=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('synced',0))" 2>/dev/null)
  DOCS=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('documents',0))" 2>/dev/null)
  EMBEDS=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('embeddings',0))" 2>/dev/null)

  if [ "$SUCCESS" = "True" ]; then
    echo "  Crawled: $CRAWLED | Synced: $SYNCED | Docs: $DOCS | Embeddings: $EMBEDS"
    TOTAL_CRAWLED=$((TOTAL_CRAWLED + CRAWLED))
    TOTAL_SYNCED=$((TOTAL_SYNCED + SYNCED))
    TOTAL_DOCS=$((TOTAL_DOCS + DOCS))
    TOTAL_EMBEDS=$((TOTAL_EMBEDS + EMBEDS))
  else
    echo "  FAILED: $RESULT"
  fi

  # Rate limit: wait between months
  sleep 2
done

echo ""
echo "=== BACKFILL COMPLETE ==="
echo "Total crawled: $TOTAL_CRAWLED"
echo "Total synced to news_articles: $TOTAL_SYNCED"
echo "Total documents: $TOTAL_DOCS"
echo "Total embeddings: $TOTAL_EMBEDS"
