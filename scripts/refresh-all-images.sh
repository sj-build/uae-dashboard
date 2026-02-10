#!/bin/bash
# Refresh all neighborhood images via Unsplash → Supabase Storage
# Processes 5 at a time (Vercel 55s timeout), then continues with remaining
#
# Usage: ./scripts/refresh-all-images.sh [BASE_URL] [ADMIN_PASSWORD]

BASE_URL="${1:-http://localhost:3000}"
ADMIN_PASSWORD="${2:-$ADMIN_PASSWORD}"

if [ -z "$ADMIN_PASSWORD" ]; then
  echo "Error: ADMIN_PASSWORD required (arg 2 or env var)"
  exit 1
fi

echo "=== Neighborhood Image Refresh: $BASE_URL ==="

SLUGS=(
  saadiyat-island al-maryah-island downtown-corniche yas-island al-reem-island masdar-city kizad
  difc downtown-dubai business-bay dubai-marina jlt internet-city-media-city deira-old-dubai dubai-south
)

TOTAL=${#SLUGS[@]}
DONE=0
FAILED=0

for SLUG in "${SLUGS[@]}"; do
  echo ""
  echo "--- [$((DONE+1))/$TOTAL] $SLUG ---"

  # Determine city
  case $SLUG in
    saadiyat-island|al-maryah-island|downtown-corniche|yas-island|al-reem-island|masdar-city|kizad)
      CITY="abudhabi" ;;
    *)
      CITY="dubai" ;;
  esac

  RESULT=$(curl -s -X POST "$BASE_URL/api/images/refresh" \
    -H "Content-Type: application/json" \
    -H "x-admin-secret: $ADMIN_PASSWORD" \
    -d "{\"city\": \"$CITY\", \"slug\": \"$SLUG\", \"setActive\": true, \"topN\": 3}" \
    --max-time 60)

  SUCCESS=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success',''))" 2>/dev/null)
  SELECTED=$(echo "$RESULT" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('selected',[])))" 2>/dev/null)
  CANDIDATES=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('candidates_found',0))" 2>/dev/null)

  if [ "$SUCCESS" = "True" ]; then
    echo "  Candidates: $CANDIDATES | Selected: $SELECTED"
    DONE=$((DONE + 1))
  else
    echo "  FAILED: $(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error','unknown'))" 2>/dev/null)"
    FAILED=$((FAILED + 1))
    DONE=$((DONE + 1))
  fi

  # Rate limit between requests
  sleep 1
done

echo ""
echo "=== COMPLETE ==="
echo "Total: $TOTAL | Succeeded: $((TOTAL - FAILED)) | Failed: $FAILED"
