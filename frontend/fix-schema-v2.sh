#!/bin/bash

# Targeted Schema Migration Fix Script v2
# Only fixes specific query patterns to avoid syntax errors

set -e

echo "🔧 Starting targeted schema migration..."
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

changes=0

echo "Step 1: Finding files with bet query patterns..."

# Create a temporary file list
temp_file=$(mktemp)

# Find files that likely contain bet queries
grep -rl "markets(" app lib --include="*.ts" --include="*.tsx" 2>/dev/null > "$temp_file" || true

echo "Step 2: Manual fixes for specific patterns..."

# List of specific patterns to fix
declare -a patterns=(
  "s/markets(id,market_id,question,/markets(id,market_id,title,/g"
  "s/markets!inner(title,status,resolution,/markets!inner(title,status,/g"
  "s/,resolution,resolved_at,yes_amount,no_amount//g"
  "s/,resolved_at,yes_amount,no_amount,total_amount//g"
  "s/,outcome,yes_pool,no_pool//g"
 "s/market_title: bet\.markets\.question/market_title: bet.markets.title/g"
  "s/bet\.markets\.question/bet.markets.title/g"
)

while IFS= read -r file; do
  if [ -f "$file" ]; then
    # Create backup
    cp "$file" "$file.bak"

    modified=false

    # Apply each pattern
    for pattern in "${patterns[@]}"; do
      if sed -i '' "$pattern" "$file" 2>/dev/null; then
        modified=true
      fi
    done

    if [ "$modified" = true ]; then
      # Check if file still has valid syntax
      if grep -q "markets(" "$file"; then
        echo "${GREEN}✓ Updated: $file${NC}"
        rm "$file.bak"
        ((changes++))
      else
        # Restore if something went wrong
        mv "$file.bak" "$file"
        echo "${YELLOW}⚠ Skipped (no changes): $file${NC}"
      fi
    else
      rm "$file.bak"
    fi
  fi
done < "$temp_file"

rm "$temp_file"

echo ""
echo "Step 3: Fixing specific known problematic files..."

# Fix query in useUserBets.ts
if [ -f "lib/hooks/useUserBets.ts" ]; then
  echo "Fixing useUserBets.ts..."
  sed -i '' 's/markets(id,market_id,question,status,outcome,/markets(id,market_id,title,status,/g' lib/hooks/useUserBets.ts
  sed -i '' 's/,yes_pool,no_pool,total_volume,end_date,resolved_at/,yes_pool,no_pool,total_volume,end_date/g' lib/hooks/useUserBets.ts
  ((changes++))
fi

# Fix ClaimWinnings component
if [ -f "app/components/ClaimWinnings.tsx" ]; then
  echo "Fixing ClaimWinnings.tsx..."
  # Only fix the specific line with market_title assignment
  perl -i -pe 's/market_title:\s*bet\.markets\.question/market_title: bet.markets.title/g' app/components/ClaimWinnings.tsx
  ((changes++))
fi

# Fix BettingHistory component
if [ -f "app/components/analytics/BettingHistory.tsx" ]; then
  echo "Fixing BettingHistory.tsx..."
  perl -i -pe 's/market_title:\s*bet\.markets\.question/market_title: bet.markets.title/g' app/components/analytics/BettingHistory.tsx
  ((changes++))
fi

# Fix user-analytics.ts
if [ -f "lib/analytics/user-analytics.ts" ]; then
  echo "Fixing user-analytics.ts..."
  perl -i -pe 's/market_title:\s*bet\.markets\.question/market_title: bet.markets.title/g' lib/analytics/user-analytics.ts
  ((changes++))
fi

echo ""
echo "Step 4: Testing TypeScript compilation..."

if npm run build > /tmp/build-v2.log 2>&1; then
  echo "${GREEN}✓ Build successful!${NC}"
  echo ""
  echo "Summary: Fixed $changes files"
  echo ""
  echo "Next steps:"
  echo "  1. git diff (review changes)"
  echo "  2. git add . && git commit -m 'fix: Update to production schema'"
  echo "  3. git push"
else
  echo "Build failed. Showing errors:"
  tail -100 /tmp/build-v2.log
  echo ""
  echo "Check /tmp/build-v2.log for full output"
  exit 1
fi
