#!/bin/bash

echo "📋 Available tables in database:"
echo ""

SUPABASE_URL="https://yncpbhamuebuymdwgmtf.supabase.co"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluY3BiaGFtdWVidXltZHdnbXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNTkyMjcsImV4cCI6MjA3NjgzNTIyN30._eSsMkhzW4Hvey5UTcE9xUAgx3zygnO0h4SS19pKegc"

curl -s "${SUPABASE_URL}/rest/v1/" -H "apikey: ${API_KEY}" | jq -r '.paths | keys[]' | grep -v "^/$" | sed 's/^\///' | sort

echo ""
echo "🔍 Checking for comments table..."
curl -s "${SUPABASE_URL}/rest/v1/" -H "apikey: ${API_KEY}" | jq -r '.paths | keys[]' | grep comment || echo "❌ No comments table found!"
