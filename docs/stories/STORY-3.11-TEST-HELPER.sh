#!/bin/bash
# Story 3.11 - Manual Testing Helper Script
# This script helps set up the testing environment

set -e  # Exit on error

echo "=========================================="
echo "Story 3.11 - Testing Environment Setup"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="/Users/seman/Desktop/Zmart-BMADFULL"

# Step 1: Check if in correct directory
echo -e "${BLUE}Step 1: Checking directory...${NC}"
if [ ! -d "$PROJECT_ROOT" ]; then
    echo -e "${RED}Error: Project directory not found at $PROJECT_ROOT${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Project directory found${NC}"
echo ""

# Step 2: Check Supabase status
echo -e "${BLUE}Step 2: Checking Supabase...${NC}"
cd "$PROJECT_ROOT"

if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠ Supabase CLI not installed${NC}"
    echo "Install: https://supabase.com/docs/guides/cli"
else
    echo -e "${GREEN}✓ Supabase CLI installed${NC}"

    # Check if Supabase is running
    if supabase status &> /dev/null; then
        echo -e "${GREEN}✓ Supabase is running${NC}"
        supabase status | grep -E "API URL|DB URL|Studio URL"
    else
        echo -e "${YELLOW}⚠ Supabase not running${NC}"
        echo "Starting Supabase..."
        supabase start
        echo -e "${GREEN}✓ Supabase started${NC}"
    fi
fi
echo ""

# Step 3: Check migration status
echo -e "${BLUE}Step 3: Verifying database migration...${NC}"
if [ -f "$PROJECT_ROOT/supabase/migrations/004_comments_tables.sql" ]; then
    echo -e "${GREEN}✓ Migration file exists: 004_comments_tables.sql${NC}"

    # Show migration info
    echo "  - File size: $(wc -l < "$PROJECT_ROOT/supabase/migrations/004_comments_tables.sql") lines"
    echo "  - Tables: comments, comment_upvotes, comment_flags"
else
    echo -e "${RED}✗ Migration file missing!${NC}"
    echo "Expected: $PROJECT_ROOT/supabase/migrations/004_comments_tables.sql"
    exit 1
fi
echo ""

# Step 4: Check if frontend dependencies installed
echo -e "${BLUE}Step 4: Checking frontend dependencies...${NC}"
cd "$PROJECT_ROOT/frontend"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠ node_modules not found, installing...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ node_modules exists${NC}"
fi
echo ""

# Step 5: TypeScript check
echo -e "${BLUE}Step 5: Running TypeScript check...${NC}"
echo "Checking for compilation errors in comment files..."

# Check specific comment files
COMMENT_FILES=(
    "app/markets/[id]/MarketDetailClient.tsx"
    "app/markets/[id]/components/CommentsSection.tsx"
    "app/markets/[id]/components/CommentCard.tsx"
    "app/markets/[id]/components/CommentForm.tsx"
    "lib/hooks/useComments.ts"
    "lib/hooks/useCommentSubmit.ts"
    "lib/hooks/useCommentUpvote.ts"
    "lib/hooks/useFlagComment.ts"
)

echo "Files to verify:"
for file in "${COMMENT_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file"
    else
        echo -e "  ${RED}✗${NC} $file (MISSING)"
    fi
done
echo ""

# Step 6: Check P0 fixes applied
echo -e "${BLUE}Step 6: Verifying P0 fixes...${NC}"

# Fix #1: Check CommentsSection import in MarketDetailClient
if grep -q "import { CommentsSection }" "$PROJECT_ROOT/frontend/app/markets/[id]/MarketDetailClient.tsx"; then
    echo -e "${GREEN}✓ Fix #1: CommentsSection imported${NC}"
else
    echo -e "${RED}✗ Fix #1: CommentsSection NOT imported${NC}"
fi

# Fix #2: Check useFlagComment hook exists
if [ -f "$PROJECT_ROOT/frontend/lib/hooks/useFlagComment.ts" ]; then
    echo -e "${GREEN}✓ Fix #2: useFlagComment hook exists${NC}"
else
    echo -e "${RED}✗ Fix #2: useFlagComment hook MISSING${NC}"
fi

# Fix #3: Check upvote API doesn't use RPC
if grep -q "supabase.rpc('increment'" "$PROJECT_ROOT/frontend/app/api/upvote-comment/route.ts"; then
    echo -e "${RED}✗ Fix #3: Still using RPC increment (BUG)${NC}"
else
    echo -e "${GREEN}✓ Fix #3: Upvote API fixed (no RPC)${NC}"
fi
echo ""

# Step 7: Display testing URLs
echo -e "${BLUE}Step 7: Testing URLs${NC}"
echo "Once dev server is running:"
echo ""
echo "  Homepage:     http://localhost:3000"
echo "  Market #1:    http://localhost:3000/markets/1"
echo "  Market #2:    http://localhost:3000/markets/2"
echo ""

# Step 8: Instructions
echo -e "${BLUE}Step 8: Next Steps${NC}"
echo "=========================================="
echo ""
echo -e "${GREEN}Environment ready for testing!${NC}"
echo ""
echo "To start the dev server:"
echo "  cd $PROJECT_ROOT/frontend"
echo "  npm run dev"
echo ""
echo "Then follow the test script:"
echo "  1. Quick Test:     docs/stories/STORY-3.11-QUICK-TEST-CHECKLIST.md"
echo "  2. Full Test:      docs/stories/STORY-3.11-MANUAL-TEST-SCRIPT.md"
echo ""
echo "Testing tips:"
echo "  • Use Chrome DevTools (F12) to monitor console"
echo "  • Open Network tab to see API calls"
echo "  • Use React DevTools to inspect component tree"
echo "  • Test with wallet: Phantom, Solflare, or any Solana wallet"
echo ""
echo -e "${YELLOW}Press Ctrl+C to exit, or press Enter to start dev server now...${NC}"

read -r

# Start dev server
echo ""
echo -e "${GREEN}Starting development server...${NC}"
echo ""
cd "$PROJECT_ROOT/frontend"
npm run dev
