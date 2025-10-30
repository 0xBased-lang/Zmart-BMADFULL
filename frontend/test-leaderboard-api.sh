#!/bin/bash

SUPABASE_URL="https://yncpbhamuebuymdwgmtf.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluY3BiaGFtdWVidXltZHdnbXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNTkyMjcsImV4cCI6MjA3NjgzNTIyN30._eSsMkhzW4Hvey5UTcE9xUAgx3zygnO0h4SS19pKegc"

echo "🔍 Testing user_leaderboard table..."
echo ""

curl -s "${SUPABASE_URL}/rest/v1/user_leaderboard?limit=5" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" | jq .

echo ""
echo "🔍 Checking if table is empty..."

curl -s "${SUPABASE_URL}/rest/v1/user_leaderboard?limit=0" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Prefer: count=exact" -I 2>&1 | grep -i "content-range"
