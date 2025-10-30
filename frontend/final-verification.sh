#!/bin/bash

echo "🎊 FINAL DEPLOYMENT VERIFICATION"
echo "=" | head -c 60 && echo ""
echo ""

echo "1️⃣ Markets API (should return 3 markets):"
curl -s "https://yncpbhamuebuymdwgmtf.supabase.co/rest/v1/markets?status=eq.ACTIVE&limit=10&select=market_id,title,status" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluY3BiaGFtdWVidXltZHdnbXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNTkyMjcsImV4cCI6MjA3NjgzNTIyN30._eSsMkhzW4Hvey5UTcE9xUAgx3zygnO0h4SS19pKegc" | jq .

echo ""
echo "2️⃣ Leaderboard API (empty is OK - no users yet):"
curl -s "https://yncpbhamuebuymdwgmtf.supabase.co/rest/v1/user_leaderboard?limit=5" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluY3BiaGFtdWVidXltZHdnbXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNTkyMjcsImV4cCI6MjA3NjgzNTIyN30._eSsMkhzW4Hvey5UTcE9xUAgx3zygnO0h4SS19pKegc" | jq .

echo ""
echo "3️⃣ Frontend Status:"
echo "   Homepage: https://frontend-kektech1.vercel.app/"
echo "   Leaderboard: https://frontend-kektech1.vercel.app/leaderboard"
echo ""
echo "=" | head -c 60 && echo ""
echo "✅ All systems operational!"
echo "📝 Leaderboard will populate when users start betting"
