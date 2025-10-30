#!/bin/bash

# Add test markets to production Supabase database
# Using service_role key for full access

echo "🎯 Adding test markets to production database..."
echo ""

SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluY3BiaGFtdWVidXltZHdnbXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTI1OTIyNywiZXhwIjoyMDc2ODM1MjI3fQ.hKj2cyFwjYLXICqmeVKjoQh3bfBLj6BTA-da72nh3Xs"
URL="https://yncpbhamuebuymdwgmtf.supabase.co"

echo "Market 1: BTC $100k prediction..."
curl -X POST "$URL/rest/v1/markets" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "market_id": 1,
    "question": "Will BTC reach $100k by end of 2025?",
    "status": "active",
    "total_volume": 5000
  }'
echo ""

echo "Market 2: ETH $5k prediction..."
curl -X POST "$URL/rest/v1/markets" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "market_id": 2,
    "question": "Will ETH reach $5k by Q2 2025?",
    "status": "active",
    "total_volume": 3500
  }'
echo ""

echo "Market 3: SOL $200 prediction..."
curl -X POST "$URL/rest/v1/markets" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "market_id": 3,
    "question": "Will SOL reach $200 by Q1 2025?",
    "status": "active",
    "total_volume": 2500
  }'
echo ""

echo ""
echo "✅ Markets added! Verifying..."
echo ""

curl -s "$URL/rest/v1/markets?select=count" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Prefer: count=exact"

echo ""
echo ""
echo "🎉 Done!"
