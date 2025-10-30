#!/bin/bash

# Comprehensive Schema Migration Fix Script
# Updates all references from old schema to new schema

set -e

echo "🔧 Starting comprehensive schema migration fix..."
echo ""

# Define color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Counter for changes
changes=0

echo "📝 Step 1: Fixing Supabase query definitions..."

# Find all files with Supabase queries
files=$(find app lib -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | grep -v node_modules || true)

for file in $files; do
  if [ -f "$file" ]; then
    # Backup original
    cp "$file" "$file.bak"

    modified=false

    # Fix 1: Replace question with title in select statements
    if grep -q "markets(.*question" "$file" 2>/dev/null; then
      echo "${YELLOW}  Fixing query in: $file${NC}"
      sed -i '' 's/markets(\([^)]*\)question/markets(\1title/g' "$file"
      modified=true
      ((changes++))
    fi

    # Fix 2: Remove resolution, outcome, resolved_at from selects
    if grep -q "resolution\|outcome\|resolved_at" "$file" 2>/dev/null; then
      echo "${YELLOW}  Removing deprecated fields in: $file${NC}"
      sed -i '' 's/,resolution//g' "$file"
      sed -i '' 's/,outcome//g' "$file"
      sed -i '' 's/,resolved_at//g' "$file"
      sed -i '' 's/resolution,//g' "$file"
      sed -i '' 's/outcome,//g' "$file"
      sed -i '' 's/resolved_at,//g' "$file"
      modified=true
      ((changes++))
    fi

    # Fix 3: Replace question references with title in TypeScript code
    if grep -q "\.question" "$file" 2>/dev/null; then
      echo "${YELLOW}  Fixing property access in: $file${NC}"
      # Replace bet.markets.question with bet.markets.title
      sed -i '' 's/\.markets\.question/.markets.title/g' "$file"
      # Replace market.question with market.title (with null coalescing)
      sed -i '' 's/market\.question/market.title/g' "$file"
      modified=true
      ((changes++))
    fi

    # If no changes, remove backup
    if [ "$modified" = false ]; then
      rm "$file.bak"
    else
      echo "${GREEN}  ✓ Updated: $file${NC}"
    fi
  fi
done

echo ""
echo "📝 Step 2: Fixing specific known files..."

# Fix ClaimWinnings.tsx
if [ -f "app/components/ClaimWinnings.tsx" ]; then
  echo "  Fixing ClaimWinnings.tsx..."
  sed -i '' 's/market_title: bet\.markets\.question/market_title: bet.markets.title/g' app/components/ClaimWinnings.tsx
  ((changes++))
fi

# Fix BettingHistory.tsx
if [ -f "app/components/BettingHistory.tsx" ]; then
  echo "  Fixing BettingHistory.tsx..."
  sed -i '' 's/market_title: bet\.markets\.question/market_title: bet.markets.title/g' app/components/BettingHistory.tsx
  ((changes++))
fi

# Fix user-analytics.ts
if [ -f "lib/user-analytics.ts" ]; then
  echo "  Fixing lib/user-analytics.ts..."
  sed -i '' 's/market_title: bet\.markets\.question/market_title: bet.markets.title/g' lib/user-analytics.ts
  ((changes++))
fi

# Fix RecentBets.tsx
if [ -f "app/user/[wallet]/components/RecentBets.tsx" ]; then
  echo "  Fixing RecentBets.tsx..."
  sed -i '' 's/\.question/.title/g' app/user/[wallet]/components/RecentBets.tsx
  ((changes++))
fi

# Fix ActiveBets.tsx
if [ -f "app/dashboard/components/ActiveBets.tsx" ]; then
  echo "  Fixing ActiveBets.tsx..."
  sed -i '' 's/\.question/.title/g' app/dashboard/components/ActiveBets.tsx
  ((changes++))
fi

echo ""
echo "📝 Step 3: Verifying TypeScript compiles..."

if npm run build > /tmp/build.log 2>&1; then
  echo "${GREEN}✓ TypeScript compilation successful!${NC}"
else
  echo "${RED}✗ TypeScript compilation failed. Check /tmp/build.log${NC}"
  tail -50 /tmp/build.log
  exit 1
fi

echo ""
echo "📝 Step 4: Creating summary of changes..."

cat > /tmp/schema-fix-summary.txt <<EOF
Schema Migration Fix Summary
============================

Total files modified: $changes

Changes made:
1. Updated all 'markets.question' references to 'markets.title'
2. Removed deprecated fields: resolution, outcome, resolved_at
3. Fixed Supabase query definitions
4. Updated TypeScript property access

Files modified:
$(find app lib -name "*.bak" 2>/dev/null | sed 's/.bak$//')

Backup files created with .bak extension.
To remove backups: find . -name "*.bak" -delete

Next steps:
1. Review changes: git diff
2. Test locally: npm run dev
3. Commit: git add . && git commit -m "fix: Update schema to production compatibility"
4. Deploy: git push
EOF

cat /tmp/schema-fix-summary.txt

echo ""
echo "${GREEN}✅ Schema migration fix completed!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review changes: git diff"
echo "  2. Test locally: npm run dev"
echo "  3. Commit and push to deploy"
echo ""
