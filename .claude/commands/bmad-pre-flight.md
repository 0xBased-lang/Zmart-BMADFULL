---
command: "/bmad-pre-flight"
category: "BMAD Compliance"
purpose: "Mandatory pre-work validation to enforce 100% BMAD methodology compliance"
wave-enabled: false
performance-profile: "validation"
priority: "CRITICAL"
---

# BMAD Pre-Flight Validation System

**Purpose:** Enforce 100% BMAD methodology compliance BEFORE starting any work session.

**Usage:** Run `/bmad-pre-flight` at the start of EVERY work session, BEFORE any implementation.

**Critical:** This command BLOCKS work if ANY validation fails. No exceptions.

---

## Execution Instructions

<critical>
YOU (Claude Code) MUST execute these validations IN EXACT ORDER and HALT immediately if ANY check fails.
</critical>

### Step 1: Load BMAD Workflow Status (MANDATORY)

<action>
Read the SINGLE SOURCE OF TRUTH:
- File: `/docs/bmm-workflow-status.md`
- NEVER use cached values
- NEVER assume previous state
- ALWAYS read fresh at start of session
</action>

<extract>
From `bmm-workflow-status.md`, extract:
- CURRENT_PHASE
- CURRENT_EPIC
- CURRENT_STORY
- IN_PROGRESS_STORY
- COMPLETED_STORIES for current epic
- TODO_STORIES for current epic
</extract>

<validate>
✅ File exists at `/docs/bmm-workflow-status.md`
✅ File contains all required fields
✅ CURRENT_STORY is set (not empty)
✅ IN_PROGRESS_STORY matches CURRENT_STORY

❌ IF ANY VALIDATION FAILS:
- Display error message
- Show file location
- HALT and request user fix
- DO NOT PROCEED
</validate>

---

### Step 2: Verify Current Story File Exists

<action>
Based on CURRENT_STORY from Step 1:
- Construct story file path: `/docs/stories/story-{EPIC}.{STORY}.md`
- Example: If CURRENT_STORY = 2.5, path = `/docs/stories/story-2.5.md`
- Check if file exists
</action>

<validate>
✅ Story file exists for CURRENT_STORY

❌ IF FILE MISSING:
- Display: "🚨 BMAD VIOLATION: Story file missing for Story {EPIC}.{STORY}"
- Action Required: "Run /bmad:bmm:workflows:create-story {EPIC}.{STORY} first"
- HALT - DO NOT PROCEED
</validate>

---

### Step 3: Verify No Stories Skipped

<action>
From `bmm-workflow-status.md`:
- Get COMPLETED_STORIES list for current epic
- Get CURRENT_STORY number
- Calculate: Expected completed stories = [1, 2, 3, ..., CURRENT_STORY - 1]
- Compare with actual COMPLETED_STORIES
</action>

<validate>
✅ No gaps in story sequence
✅ All stories before CURRENT_STORY are in COMPLETED_STORIES

❌ IF GAPS DETECTED:
- Display: "🚨 BMAD VIOLATION: Story sequence gap detected"
- List missing stories
- Action Required: "Complete missing stories in order"
- HALT - DO NOT PROCEED
</validate>

---

### Step 4: Verify Completion Documentation Exists

<action>
For each story in COMPLETED_STORIES:
- Check if `/docs/STORY-{EPIC}.{STORY}-COMPLETE.md` exists
- List any missing completion documents
</action>

<validate>
✅ All completed stories have STORY-X.Y-COMPLETE.md files

❌ IF COMPLETION DOCS MISSING:
- Display: "🚨 BMAD VIOLATION: Missing completion documentation"
- List stories missing completion docs
- Action Required: "Create completion documents for Stories: {list}"
- OPTION: Continue with warning? (Only if Epic already completed per retrospective)
- If not continuing: HALT - DO NOT PROCEED
</validate>

---

### Step 5: Verify Epic Completion Before New Epic

<action>
If CURRENT_EPIC > 1:
- Check if retrospective exists: `/docs/retrospective-epic-{PREVIOUS_EPIC}.md`
- Verify all stories in previous epic are complete
</action>

<validate>
✅ Retrospective exists for all previous epics
✅ Previous epic shows 100% completion

❌ IF RETROSPECTIVE MISSING:
- Display: "🚨 BMAD VIOLATION: Cannot start Epic {N} without Epic {N-1} retrospective"
- Action Required: "Create retrospective for Epic {N-1} first"
- HALT - DO NOT PROCEED
</validate>

---

### Step 6: Validate Sprint Status Alignment

<action>
If `/docs/sprint-status.yaml` exists:
- Read sprint-status.yaml
- Compare with bmm-workflow-status.md
- Check for discrepancies
</action>

<validate>
✅ sprint-status.yaml matches bmm-workflow-status.md (if sprint-status exists)
⚠️ If discrepancy exists: Show warning but allow continue
   (bmm-workflow-status.md is ALWAYS the source of truth)
</validate>

---

### Step 7: User Intent Verification

<ask>
Based on validations, current state is:

**Current Project State:**
- Epic: {CURRENT_EPIC}
- Story: {CURRENT_STORY}
- Title: {STORY_TITLE from story file}
- Status: {from bmm-workflow-status.md}

**What do you want to work on?**

1. Continue with Story {CURRENT_STORY} (CORRECT per BMAD)
2. Work on different story (REQUIRES JUSTIFICATION)
3. Review workflow status and decide

Enter choice (1, 2, or 3):
</ask>

<validate>
IF CHOICE = 1:
  ✅ PASS - User wants to work on correct story
  → Proceed to Step 8

IF CHOICE = 2:
  ⚠️ Display: "Working on different story than CURRENT_STORY violates BMAD"
  <ask>
  Why do you need to work on a different story?
  Valid reasons:
  - Found critical bug in completed story
  - User explicitly requested different story
  - Other (explain)

  Your reason:
  </ask>

  → IF REASON VALID: Ask user to update bmm-workflow-status.md first
  → THEN allow proceed
  → ELSE: HALT

IF CHOICE = 3:
  → HALT and display workflow status
  → Suggest: "Run /bmad-pre-flight again when ready"
</validate>

---

### Step 8: Final Compliance Report

<output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ BMAD PRE-FLIGHT VALIDATION PASSED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Current State Verified:**
- ✅ Workflow status loaded from bmm-workflow-status.md
- ✅ Current Epic: {CURRENT_EPIC}
- ✅ Current Story: {CURRENT_STORY} - {STORY_TITLE}
- ✅ Story file exists: /docs/stories/story-{EPIC}.{STORY}.md
- ✅ No story sequence gaps detected
- ✅ Completion documentation verified (or warnings noted)
- ✅ Epic prerequisites validated
- ✅ User intent matches workflow state

**You are CLEAR to proceed with Story {CURRENT_STORY}**

**Recommended Next Steps:**
1. Read story file: /docs/stories/story-{EPIC}.{STORY}.md
2. Review acceptance criteria
3. Begin implementation following BMAD workflow
4. Update bmm-workflow-status.md after completion

**Remember:**
- ONE story at a time
- Update bmm-workflow-status.md after EVERY story
- Create STORY-X.Y-COMPLETE.md when done
- Follow the workflow, not shortcuts

**BMAD Compliance:** 100% 🎯

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
</output>

---

## Validation Failure Responses

### ❌ Failure Template

When ANY validation fails, display:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 BMAD PRE-FLIGHT VALIDATION FAILED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Failed Check:** {CHECK_NAME}
**Issue:** {SPECIFIC_ISSUE}
**Impact:** Cannot proceed with implementation

**Required Action:**
{SPECIFIC_FIX_STEPS}

**Once fixed, run /bmad-pre-flight again to validate**

**BMAD Compliance:** BLOCKED ❌

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Emergency Override (USE SPARINGLY)

<critical>
Emergency override should ONLY be used in exceptional circumstances:
- Critical production bug requiring immediate fix
- User explicitly understands and accepts BMAD violation
- Documented reason for deviation
</critical>

<ask>
⚠️ EMERGENCY OVERRIDE REQUEST

This will bypass BMAD validation checks.

**Consequences:**
- Methodology compliance violated
- Risk of project state inconsistency
- May require cleanup work later

**Do you want to proceed with override?**
(Type "I ACCEPT BMAD DEVIATION" to confirm, or "cancel" to abort)
</ask>

<validate>
IF USER CONFIRMS OVERRIDE:
  - Log deviation to `/docs/bmad-deviations.log` with timestamp and reason
  - Display warning banner
  - Allow work to proceed
  - Remind: "You must reconcile this deviation later"

IF USER CANCELS:
  - HALT and return to normal validation
</validate>

---

## Usage Patterns

### Daily Workflow

```bash
# Morning - Start of work session
/bmad-pre-flight

# After validation passes
# Work on current story...

# End of day - Mark story complete
/bmad:bmm:workflows:story-done

# Next day - Start fresh
/bmad-pre-flight
```

### Integration with Other Commands

**Recommended integration:**
- `/bmad:bmm:workflows:dev-story` should call `/bmad-pre-flight` first
- `/bmad:bmm:workflows:create-story` should verify no in-progress stories
- All implementation commands should require pre-flight pass

---

## Monitoring & Reporting

### Compliance Metrics

Track over time:
- Pre-flight pass rate
- Common failure reasons
- Override frequency
- Average time to fix issues

### Weekly Health Check

Run enhanced validation:
```bash
/bmad-pre-flight --full-audit
```

This checks:
- All story files exist
- All completion docs present
- Workflow status consistency
- No orphaned work
- Git commit alignment

---

## Benefits

✅ **Prevents Deviation:** Catches issues before they become problems
✅ **Enforces Discipline:** Makes BMAD compliance automatic
✅ **Clear Guidance:** Shows exactly what to fix
✅ **Saves Time:** Prevents rework from incorrect workflow
✅ **Documentation:** Creates audit trail of decisions
✅ **Peace of Mind:** Confidence that you're on track

---

**Remember:** This pre-flight check exists to HELP you maintain consistency and avoid costly mistakes. It's not bureaucracy - it's project insurance.

**Run it every time. No exceptions. Your future self will thank you.**

🚀 **BMAD Pre-Flight: Your Compliance Co-Pilot**
