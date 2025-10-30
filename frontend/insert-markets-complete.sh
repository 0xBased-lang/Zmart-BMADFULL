#!/bin/bash

# Insert markets with ALL required fields based on NOT NULL errors we've seen:
# - title (required)
# - creator_wallet (required)
# - description (required)
# - market_id
# - status

SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluY3BiaGFtdWVidXltZHdnbXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTI1OTIyNywiZXhwIjoyMDc2ODM1MjI3fQ.hKj2cyFwjYLXICqmeVKjoQh3bfBLj6BTA-da72nh3Xs"
URL="https://yncpbhamuebuymdwgmtf.supabase.co"

echo "🎯 Inserting markets with all required fields..."
echo ""

# Market 1
echo "📊 Market 1: BTC $100k..."
curl -X POST "$URL/rest/v1/markets" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "market_id": 1,
    "title": "Will BTC reach $100k by end of 2025?",
    "description": "Bitcoin price prediction for 2025",
    "creator_wallet": "TestWallet1",
    "status": "ACTIVE",
    "end_date": "2025-12-31"
  }' 2>&1 | head -5
echo ""

# Market 2
echo "📊 Market 2: ETH $5k..."
curl -X POST "$URL/rest/v1/markets" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "market_id": 2,
    "title": "Will ETH reach $5k by Q2 2025?",
    "description": "Ethereum price prediction for Q2 2025",
    "creator_wallet": "TestWallet2",
    "status": "ACTIVE",
    "end_date": "2025-06-30"
  }' 2>&1 | head -5
echo ""

# Market 3
echo "📊 Market 3: SOL $200..."
curl -X POST "$URL/rest/v1/markets" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "market_id": 3,
    "title": "Will SOL reach $200 by Q1 2025?",
    "description": "Solana price prediction for Q1 2025",
    "creator_wallet": "TestWallet1",
    "status": "ACTIVE",
    "end_date": "2025-03-31"
  }' 2>&1 | head -5
echo ""

echo "✅ Verifying..."
curl -s "$URL/rest/v1/markets?select=count" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Prefer: count=exact"
echo ""
echo "🎉 Done!"
