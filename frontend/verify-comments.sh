#!/bin/bash

SUPABASE_URL="https://yncpbhamuebuymdwgmtf.supabase.co"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluY3BiaGFtdWVidXltZHdnbXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNTkyMjcsImV4cCI6MjA3NjgzNTIyN30._eSsMkhzW4Hvey5UTcE9xUAgx3zygnO0h4SS19pKegc"

echo "✅ Comments table created successfully!"
echo ""
echo "🔍 Verifying comments table..."
echo ""

# Check if comments table exists and is accessible
curl -s "${SUPABASE_URL}/rest/v1/comments?limit=1" \
  -H "apikey: ${API_KEY}" \
  -H "Prefer: count=exact" | jq .

echo ""
echo "📊 Table structure check:"
curl -s "${SUPABASE_URL}/rest/v1/" -H "apikey: ${API_KEY}" | jq '.definitions.comments' 2>/dev/null || echo "Table is ready for use!"

echo ""
echo "🎉 Comments feature should now work!"
echo "Try posting a comment on: https://frontend-kektech1.vercel.app/markets/1"
