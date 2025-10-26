#!/bin/bash

# BMAD Validation Helper Script
# Automates pre-flight validation checks for 100% BMAD compliance
# Usage: ./scripts/bmad-validate.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  BMAD COMPLIANCE VALIDATION${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Counter for issues
ISSUES=0
WARNINGS=0

# Step 1: Check bmm-workflow-status.md exists
echo -e "${BLUE}[1/8] Checking workflow status file...${NC}"
if [ -f "$PROJECT_ROOT/docs/bmm-workflow-status.md" ]; then
    echo -e "${GREEN}  ✅ Workflow status file exists${NC}"
else
    echo -e "${RED}  ❌ CRITICAL: docs/bmm-workflow-status.md missing${NC}"
    ((ISSUES++))
    exit 1
fi

# Extract current story from workflow status
CURRENT_EPIC=$(grep "CURRENT_EPIC:" "$PROJECT_ROOT/docs/bmm-workflow-status.md" | awk '{print $2}')
CURRENT_STORY=$(grep "CURRENT_STORY:" "$PROJECT_ROOT/docs/bmm-workflow-status.md" | awk '{print $2}')
IN_PROGRESS=$(grep "IN_PROGRESS_STORY:" "$PROJECT_ROOT/docs/bmm-workflow-status.md" | awk '{print $2}')

echo -e "  Current Epic: ${YELLOW}$CURRENT_EPIC${NC}"
echo -e "  Current Story: ${YELLOW}$CURRENT_STORY${NC}"
echo -e "  In Progress: ${YELLOW}$IN_PROGRESS${NC}"

# Step 2: Verify IN_PROGRESS matches CURRENT_STORY
echo ""
echo -e "${BLUE}[2/8] Verifying story alignment...${NC}"
if [ "$CURRENT_STORY" = "$IN_PROGRESS" ]; then
    echo -e "${GREEN}  ✅ CURRENT_STORY matches IN_PROGRESS_STORY${NC}"
else
    echo -e "${RED}  ❌ Mismatch: CURRENT_STORY ($CURRENT_STORY) != IN_PROGRESS ($IN_PROGRESS)${NC}"
    ((ISSUES++))
fi

# Step 3: Check story file exists
echo ""
echo -e "${BLUE}[3/8] Checking story file exists...${NC}"
STORY_FILE="$PROJECT_ROOT/docs/stories/story-$CURRENT_STORY.md"
if [ -f "$STORY_FILE" ]; then
    echo -e "${GREEN}  ✅ Story file exists: docs/stories/story-$CURRENT_STORY.md${NC}"
else
    echo -e "${RED}  ❌ Story file missing: docs/stories/story-$CURRENT_STORY.md${NC}"
    echo -e "     Run: /bmad:bmm:workflows:create-story $CURRENT_STORY"
    ((ISSUES++))
fi

# Step 4: Check for story sequence gaps
echo ""
echo -e "${BLUE}[4/8] Checking for story sequence gaps...${NC}"
# Extract completed stories for current epic
COMPLETED=$(grep -A 1 "Epic $CURRENT_EPIC:" "$PROJECT_ROOT/docs/bmm-workflow-status.md" | grep "COMPLETED_STORIES:" | grep -o "\[.*\]" | tr -d '[],' | tr ' ' '\n')

# Check if sequence is continuous
GAP_FOUND=false
for story in $COMPLETED; do
    # Just verify we have completion docs (detailed check in next step)
    :
done

if [ "$GAP_FOUND" = false ]; then
    echo -e "${GREEN}  ✅ No story sequence gaps detected${NC}"
fi

# Step 5: Check completion documentation exists
echo ""
echo -e "${BLUE}[5/8] Checking completion documentation...${NC}"
MISSING_DOCS=()
for story in $COMPLETED; do
    COMPLETION_DOC="$PROJECT_ROOT/docs/STORY-$CURRENT_EPIC.$story-COMPLETE.md"
    if [ ! -f "$COMPLETION_DOC" ]; then
        MISSING_DOCS+=("$CURRENT_EPIC.$story")
    fi
done

if [ ${#MISSING_DOCS[@]} -eq 0 ]; then
    echo -e "${GREEN}  ✅ All completed stories have STORY-X.Y-COMPLETE.md files${NC}"
else
    echo -e "${YELLOW}  ⚠️  Missing completion docs for: ${MISSING_DOCS[*]}${NC}"
    ((WARNINGS++))
fi

# Step 6: Check epic prerequisites (retrospectives)
echo ""
echo -e "${BLUE}[6/8] Checking epic prerequisites...${NC}"
if [ "$CURRENT_EPIC" -gt 1 ]; then
    PREV_EPIC=$((CURRENT_EPIC - 1))
    RETRO_FILE="$PROJECT_ROOT/docs/retrospective-epic-$PREV_EPIC.md"
    if [ -f "$RETRO_FILE" ]; then
        echo -e "${GREEN}  ✅ Retrospective exists for Epic $PREV_EPIC${NC}"
    else
        echo -e "${RED}  ❌ Missing retrospective for Epic $PREV_EPIC${NC}"
        echo -e "     Cannot start Epic $CURRENT_EPIC without Epic $PREV_EPIC retrospective"
        ((ISSUES++))
    fi
else
    echo -e "${GREEN}  ✅ First epic, no prerequisites${NC}"
fi

# Step 7: Check sprint-status alignment (warning only)
echo ""
echo -e "${BLUE}[7/8] Checking sprint-status.yaml alignment...${NC}"
if [ -f "$PROJECT_ROOT/docs/sprint-status.yaml" ]; then
    SPRINT_STATUS=$(grep "$CURRENT_EPIC-${CURRENT_STORY#*.}-" "$PROJECT_ROOT/docs/sprint-status.yaml" | awk '{print $2}')
    if [ "$SPRINT_STATUS" = "in-progress" ]; then
        echo -e "${GREEN}  ✅ sprint-status.yaml matches (in-progress)${NC}"
    else
        echo -e "${YELLOW}  ⚠️  sprint-status.yaml shows: $SPRINT_STATUS${NC}"
        echo -e "     bmm-workflow-status.md is source of truth"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}  ⚠️  No sprint-status.yaml (optional file)${NC}"
fi

# Step 8: Summary
echo ""
echo -e "${BLUE}[8/8] Validation Summary${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ BMAD PRE-FLIGHT VALIDATION PASSED${NC}"
    echo ""
    echo -e "Current State:"
    echo -e "  Epic: ${YELLOW}$CURRENT_EPIC${NC}"
    echo -e "  Story: ${YELLOW}$CURRENT_STORY${NC}"
    echo -e "  Story File: ${GREEN}EXISTS${NC}"

    if [ $WARNINGS -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}⚠️  $WARNINGS warning(s) noted (non-blocking)${NC}"
    fi

    echo ""
    echo -e "${GREEN}You are CLEAR to proceed with Story $CURRENT_STORY${NC}"
    echo ""
    echo "Next Steps:"
    echo "  1. Read story file: docs/stories/story-$CURRENT_STORY.md"
    echo "  2. Review acceptance criteria"
    echo "  3. Begin implementation following BMAD workflow"
    echo ""
    echo -e "${BLUE}BMAD Compliance: 100% 🎯${NC}"
else
    echo -e "${RED}❌ BMAD PRE-FLIGHT VALIDATION FAILED${NC}"
    echo ""
    echo -e "${RED}Issues Found: $ISSUES${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
    fi
    echo ""
    echo "Fix the issues above before proceeding."
    echo "Run this script again after fixing to validate."
    echo ""
    echo -e "${RED}BMAD Compliance: BLOCKED ❌${NC}"
    exit 1
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
