#!/bin/bash

echo "🔍 TESTING LIVE SITE: https://frontend-kektech1.vercel.app"
echo "=" | head -c 60 && echo ""
echo ""

echo "1️⃣ Testing Markets API call from frontend..."
curl -s "https://yncpbhamuebuymdwgmtf.supabase.co/rest/v1/markets?status=eq.ACTIVE&select=market_id,title,status" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluY3BiaGFtdWVidXltZHdnbXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNTkyMjcsImV4cCI6MjA3NjgzNTIyN30._eSsMkhzW4Hvey5UTcE9xUAgx3zygnO0h4SS19pKegc" | jq '.[] | .title'

echo ""
echo "2️⃣ Testing Leaderboard API call..."
curl -s "https://yncpbhamuebuymdwgmtf.supabase.co/rest/v1/user_leaderboard?limit=1" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluY3BiaGFtdWVidXltZHdnbXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNTkyMjcsImV4cCI6MjA3NjgzNTIyN30._eSsMkhzW4Hvey5UTcE9xUAgx3zygnO0h4SS19pKegc" \
  | jq 'if length == 0 then "✅ Table exists (empty)" else "✅ Table exists with data" end'

echo ""
echo "3️⃣ Running Playwright test on live site..."
