#!/bin/bash

ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluY3BiaGFtdWVidXltZHdnbXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNTkyMjcsImV4cCI6MjA3NjgzNTIyN30._eSsMkhzW4Hvey5UTcE9xUAgx3zygnO0h4SS19pKegc"
URL="https://yncpbhamuebuymdwgmtf.supabase.co"

echo "🔍 Testing Production API..."
echo ""

curl -s "$URL/rest/v1/markets?select=market_id,title,status" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" | jq .

echo ""
echo "✅ API Test Complete"
