#!/bin/bash

# Rapid Bet Test - Run 10 sequential bets

echo "🚀 Rapid Bet Test - 10 Sequential Bets"
echo "========================================"
echo ""

MARKET_ID="1761401939440"
AMOUNT="0.01"

SUCCESS=0
FAILED=0

for i in {1..10}; do
  if [ $((i % 2)) -eq 0 ]; then
    SIDE="no"
  else
    SIDE="yes"
  fi

  echo "📍 Bet $i/10: $SIDE $AMOUNT SOL..."

  START=$(date +%s%3N)

  if ANCHOR_PROVIDER_URL=https://api.devnet.solana.com ANCHOR_WALLET=~/.config/solana/id.json npx ts-node scripts/place-test-bet.ts $MARKET_ID $SIDE $AMOUNT 2>&1 | grep -q "SUCCESS"; then
    END=$(date +%s%3N)
    DURATION=$((END - START))
    echo "   ✅ Success! (${DURATION}ms)"
    SUCCESS=$((SUCCESS + 1))
  else
    echo "   ❌ Failed!"
    FAILED=$((FAILED + 1))
  fi

  echo ""
done

echo "========================================"
echo "📊 RESULTS:"
echo "   ✅ Successful: $SUCCESS/10"
echo "   ❌ Failed: $FAILED/10"
echo "========================================"
