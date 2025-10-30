#!/bin/bash

# Get exact production schema using service_role key
# This will tell us exactly what columns exist and which are required

SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluY3BiaGFtdWVidXltZHdnbXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTI1OTIyNywiZXhwIjoyMDc2ODM1MjI3fQ.hKj2cyFwjYLXICqmeVKjoQh3bfBLj6BTA-da72nh3Xs"
URL="https://yncpbhamuebuymdwgmtf.supabase.co"

echo "🔍 Getting production markets table schema..."
echo ""

# Query the information_schema to get column details
curl -X POST "$URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = '\''markets'\'' AND table_schema = '\''public'\'' ORDER BY ordinal_position"
  }' 2>&1 | jq . || echo "RPC not available, trying direct query..."

echo ""
echo "Trying alternative method..."
echo ""

# Alternative: Try to get a sample row to see all columns
curl -s "$URL/rest/v1/markets?limit=1" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  | jq 'if length > 0 then .[0] | keys else "No rows yet, checking schema another way" end'

echo ""
