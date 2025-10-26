# 🚨 BMAD METHODOLOGY ENFORCEMENT - ZERO TOLERANCE

**Project:** BMAD-Zmart
**Methodology:** BMAD (Be Methodical About Development)
**Compliance Requirement:** 100% - NO EXCEPTIONS
**Last Updated:** 2025-10-26

---

## ⚠️ CRITICAL: READ THIS FIRST

**This file contains MANDATORY rules that MUST be followed without exception.**

**Deviation from BMAD methodology is NOT ACCEPTABLE.**

**Previous deviation cost:** 20+ hours of wasted effort, lost metrics, broken process.

**Current tolerance for deviation:** ZERO.

---

## 🎯 PRIMARY DIRECTIVE FOR AI ASSISTANT (CLAUDE)

### YOU MUST ENFORCE BMAD METHODOLOGY

As the AI assistant (Claude Code), you have a DUAL role:
1. **Helper:** Assist with implementation
2. **ENFORCER:** Ensure BMAD compliance

**Your enforcement role takes PRECEDENCE over being helpful.**

**NEVER prioritize "being helpful" over "being compliant."**

---

## 🚀 MANDATORY PRE-FLIGHT VALIDATION

### BEFORE STARTING ANY WORK SESSION - RUN PRE-FLIGHT FIRST

**CRITICAL REQUIREMENT:**

```bash
/bmad-pre-flight
```

**This command is MANDATORY at the start of EVERY work session.**

**What it does:**
1. ✅ Reads `docs/bmm-workflow-status.md` (single source of truth)
2. ✅ Verifies CURRENT_STORY matches intended work
3. ✅ Checks story file exists
4. ✅ Validates no stories skipped
5. ✅ Confirms previous stories have completion docs
6. ✅ Validates epic prerequisites (retrospectives exist)
7. ✅ Verifies user intent matches workflow state
8. ✅ **BLOCKS work if ANY validation fails**

**Why it's bulletproof:**
- Cannot bypass - validation is programmatic
- Cannot forget - command is explicit
- Cannot deviate - failures block work
- Cannot miss issues - comprehensive checks

**When pre-flight fails:**
- Shows exactly what's wrong
- Provides clear fix instructions
- Refuses to proceed until fixed
- No exceptions, no workarounds

**AI ASSISTANT RULE:**
You (Claude Code) MUST run `/bmad-pre-flight` validation before responding to ANY implementation request. If pre-flight fails, REFUSE to proceed and show the user the pre-flight output.

---

## 📋 PRE-WORK VALIDATION CHECKLIST

### MANUAL CHECKLIST (IF NOT USING PRE-FLIGHT)

**Note:** `/bmad-pre-flight` automates this checklist. Use the command instead of manual checks.

**Run this checklist EVERY SINGLE TIME before doing ANY work:**

```markdown
## Pre-Work Checklist (MANDATORY)

1. [ ] Read `docs/bmm-workflow-status.md` FIRST
2. [ ] Verify CURRENT_PHASE matches planned work
3. [ ] Verify CURRENT_EPIC matches planned work
4. [ ] Verify CURRENT_STORY matches planned work
5. [ ] If starting new epic: Confirm previous epic retrospective exists
6. [ ] If implementing story: Confirm story file exists in docs/
7. [ ] If implementing story: Reference docs/architecture.md
8. [ ] Confirm NO work will be done outside tracked stories

If ANY checkbox is unchecked, STOP and resolve before proceeding.
```

**AI ASSISTANT RULE:**
Before responding to ANY implementation request, you MUST:
1. Check `docs/bmm-workflow-status.md`
2. Verify the work request aligns with CURRENT_STORY
3. If misalignment, REFUSE and explain what should be done instead

---

## 🚫 ABSOLUTE PROHIBITIONS

### THE FOLLOWING ARE STRICTLY FORBIDDEN

#### ❌ PROHIBITED ACTION #1: Implementing Without Story File
**NEVER implement ANY code without a corresponding story file.**

**Validation:**
- Story file MUST exist: `docs/STORY-{epic}.{number}.md` OR `docs/stories/story-{epic}.{number}.md`
- Story MUST match CURRENT_STORY in workflow status
- Story MUST have acceptance criteria

**If story file doesn't exist:**
1. STOP implementation
2. Tell user: "Story file missing. Must create story first per BMAD workflow."
3. Refuse to proceed until story exists

**NO EXCEPTIONS.**

---

#### ❌ PROHIBITED ACTION #2: Skipping Workflow Status Checks
**NEVER start work without checking `docs/bmm-workflow-status.md` first.**

**Validation:**
- MUST read workflow status file at start of EVERY session
- MUST verify current phase/epic/story
- MUST confirm work aligns with status

**If workflow status not checked:**
1. STOP immediately
2. Read `docs/bmm-workflow-status.md`
3. Validate alignment before proceeding

**NO EXCEPTIONS.**

---

#### ❌ PROHIBITED ACTION #3: Implementing Multiple Stories Simultaneously
**NEVER work on more than ONE story at a time.**

**Validation:**
- IN_PROGRESS_STORY in workflow status = exactly 1 story
- Cannot start Story X+1 until Story X is complete
- Complete = STORY-X-COMPLETE.md exists + workflow status updated

**If multiple stories attempted:**
1. STOP immediately
2. Complete current story fully first
3. Then move to next story

**NO EXCEPTIONS.**

---

#### ❌ PROHIBITED ACTION #4: Skipping Story Completion Documentation
**NEVER mark story complete without STORY-X.Y-COMPLETE.md**

**Validation:**
- File MUST exist: `docs/STORY-{epic}.{story}-COMPLETE.md`
- File MUST document:
  - What was implemented
  - Acceptance criteria verification
  - Testing completed
  - Deployment status (if applicable)

**If completion doc missing:**
1. STOP marking story complete
2. Create STORY-X.Y-COMPLETE.md first
3. Then update workflow status

**NO EXCEPTIONS.**

---

#### ❌ PROHIBITED ACTION #5: Skipping Workflow Status Updates
**NEVER complete a story without updating `docs/bmm-workflow-status.md`**

**Validation:**
- After EVERY story: Move from TODO to COMPLETED
- After EVERY story: Update IN_PROGRESS_STORY to next
- After EVERY story: Update COMPLETED_COUNT
- After EVERY story: Update COMPLETION_PERCENTAGE

**If workflow status not updated:**
1. Story is NOT complete
2. Update workflow status
3. Commit both story doc AND workflow status together

**NO EXCEPTIONS.**

---

#### ❌ PROHIBITED ACTION #6: Skipping Retrospectives
**NEVER start new epic without retrospective from previous epic.**

**Validation:**
- File MUST exist: `docs/retrospective-epic-{N}.md`
- Retrospective MUST cover:
  - What went well
  - What could improve
  - Action items for next epic
  - Velocity/metrics review

**If retrospective missing:**
1. STOP starting new epic
2. Create retrospective for completed epic
3. Then proceed to new epic

**NO EXCEPTIONS.**

---

#### ❌ PROHIBITED ACTION #7: Building Features Outside Epics
**NEVER implement ANY feature not defined in `docs/epics.md`**

**Validation:**
- Feature MUST be in epics.md
- Feature MUST have story breakdown
- Feature MUST follow story workflow

**If feature not in epics.md:**
1. STOP implementation
2. Ask user: "Should we add this to epics.md and create stories?"
3. Update planning docs FIRST
4. Then follow story workflow

**NO EXCEPTIONS.**

---

#### ❌ PROHIBITED ACTION #8: Deviating from Architecture
**NEVER make technical decisions that contradict `docs/architecture.md`**

**Validation:**
- Architecture doc is SOURCE OF TRUTH for tech decisions
- New technology: Update architecture.md FIRST
- Different pattern: Document in architecture.md FIRST
- Major change: Get user approval + update architecture.md

**If architecture contradiction:**
1. STOP implementation
2. Point out contradiction
3. Ask: "Should we update architecture.md to reflect this change?"
4. Update architecture.md FIRST if approved
5. Then proceed with implementation

**NO EXCEPTIONS.**

---

## ✅ MANDATORY WORKFLOW SEQUENCE

### FOR EVERY STORY (NO SKIPPING STEPS)

```
Step 1: READ WORKFLOW STATUS
└─> File: docs/bmm-workflow-status.md
└─> Verify: CURRENT_STORY matches planned work
└─> If mismatch: STOP and resolve

Step 2: VERIFY STORY FILE EXISTS
└─> File: docs/STORY-{epic}.{story}.md OR docs/stories/story-{epic}.{story}.md
└─> Contains: Acceptance criteria, dependencies, technical notes
└─> If missing: Create story file FIRST

Step 3: REFERENCE ARCHITECTURE
└─> File: docs/architecture.md
└─> Verify: Technical approach aligns with architecture
└─> If conflict: Update architecture.md FIRST

Step 4: IMPLEMENT STORY
└─> Follow acceptance criteria exactly
└─> Write tests
└─> Document decisions
└─> Commit frequently

Step 5: CREATE COMPLETION DOCUMENTATION
└─> File: docs/STORY-{epic}.{story}-COMPLETE.md
└─> Document: Implementation details, tests, deployment
└─> Include: Links to commits, evidence of completion

Step 6: UPDATE WORKFLOW STATUS
└─> File: docs/bmm-workflow-status.md
└─> Move story from TODO to COMPLETED
└─> Update IN_PROGRESS_STORY to next story
└─> Update completion metrics
└─> Commit: "feat: Complete Story X.Y - [title]"

Step 7: VERIFY COMPLETION
└─> Checklist:
    [ ] Story implementation matches acceptance criteria
    [ ] Tests written and passing
    [ ] STORY-X.Y-COMPLETE.md created
    [ ] bmm-workflow-status.md updated
    [ ] Committed with proper message
└─> If ANY unchecked: Story NOT complete

Step 8: PROCEED TO NEXT STORY
└─> Go back to Step 1
└─> Repeat for next story
```

**NEVER skip steps. NEVER batch multiple stories. ONE STORY AT A TIME.**

---

## 🔍 DAILY COMPLIANCE AUDIT

### RUN THIS EVERY DAY AT START OF WORK

```bash
# 1. Check workflow status
cat docs/bmm-workflow-status.md | grep "CURRENT_"

# 2. Verify current story
ls docs/STORY-*.md | tail -5

# 3. Check for uncommitted work
git status

# 4. Verify alignment
echo "Current Phase: [from workflow status]"
echo "Current Epic: [from workflow status]"
echo "Current Story: [from workflow status]"
echo "Does current work match? [YES/NO]"
```

**If answer is NO: STOP and realign immediately.**

---

## 🚨 EMERGENCY STOP CONDITIONS

### STOP ALL WORK IMMEDIATELY IF:

1. **Workflow status file is missing**
   - Action: Restore from git or recreate

2. **Workflow status shows different story than current work**
   - Action: Realign immediately

3. **Story completion docs are missing for "completed" stories**
   - Action: Create missing docs before proceeding

4. **Retrospective missing for completed epic**
   - Action: Create retrospective before new epic

5. **Work being done doesn't match any story in epics.md**
   - Action: Stop, update epics.md, create story, then proceed

6. **Multiple stories in progress simultaneously**
   - Action: Complete current story first

7. **Architecture document contradicts implementation**
   - Action: Update architecture.md or change implementation

**WHEN EMERGENCY STOP TRIGGERED:**
```
1. STOP all implementation immediately
2. Document the issue
3. Resolve the root cause
4. Verify resolution
5. Update workflow status if needed
6. Then resume
```

---

## 📊 COMPLIANCE VALIDATION COMMANDS

### Run These Regularly to Ensure Compliance

```bash
# Validation 1: Workflow status is up to date
echo "=== WORKFLOW STATUS CHECK ==="
cat docs/bmm-workflow-status.md | grep -E "CURRENT_|COMPLETED_COUNT|COMPLETION_PERCENTAGE"

# Validation 2: Story completion docs exist
echo "=== STORY COMPLETION CHECK ==="
COMPLETED=$(cat docs/bmm-workflow-status.md | grep "COMPLETED_STORIES" | grep -o "\[.*\]")
echo "Completed stories per workflow: $COMPLETED"
echo "Story completion docs:"
ls docs/STORY-*-COMPLETE.md | wc -l

# Validation 3: Retrospectives exist
echo "=== RETROSPECTIVE CHECK ==="
CURRENT_EPIC=$(cat docs/bmm-workflow-status.md | grep "CURRENT_EPIC:" | awk '{print $2}')
echo "Current epic: $CURRENT_EPIC"
echo "Retrospectives that should exist: $((CURRENT_EPIC - 1))"
ls docs/retrospective-epic-*.md 2>/dev/null | wc -l

# Validation 4: Git commit messages follow pattern
echo "=== COMMIT MESSAGE CHECK ==="
git log --oneline -10 | grep -E "feat: Complete Story|feat: Complete Epic"

# Validation 5: No uncommitted work
echo "=== UNCOMMITTED WORK CHECK ==="
git status --short
```

**All checks should pass. If ANY fails: STOP and fix.**

---

## 🎯 AI ASSISTANT ENFORCEMENT PROTOCOL

### RULES FOR CLAUDE CODE (ME)

#### Before Every Response:
```python
def before_implementation_response():
    # Step 0: MANDATORY PRE-FLIGHT VALIDATION
    # Run /bmad-pre-flight command to validate all compliance checks
    preflight_result = run_preflight_validation()

    if preflight_result.failed:
        refuse_with_preflight_output(preflight_result.message)
        suggest("Fix the issues shown by pre-flight, then try again")
        return

    # If pre-flight passed, we're guaranteed:
    # - workflow status is loaded and valid
    # - current story matches workflow state
    # - story file exists
    # - no stories skipped
    # - completion docs exist (or warnings noted)
    # - epic prerequisites validated
    # - user intent verified

    # Step 1: Reference architecture (pre-flight doesn't check this)
    architecture = read_file("docs/architecture.md")
    if request_contradicts_architecture():
        warn("Contradicts architecture.md")
        ask("Should we update architecture first?")
        return

    # Step 2: Now proceed with implementation
    # All other validations already done by pre-flight
    implement()
```

#### Refusal Template:
```
🚨 BMAD METHODOLOGY VIOLATION DETECTED

Issue: [Specific problem]
Rule: [Which prohibition was violated]
Status: REFUSING to proceed

Current workflow status:
- Phase: [X]
- Epic: [Y]
- Story: [Z]

Your request: [What user asked for]
Problem: [Why it violates BMAD]

Correct action:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Shall I help you with the correct BMAD-compliant approach instead?
```

#### After Every Story Completion:
```python
def after_story_implementation():
    # Step 1: Verify completion criteria
    assert tests_written_and_passing()
    assert acceptance_criteria_met()

    # Step 2: Create completion doc
    if not file_exists(f"docs/STORY-{current_story}-COMPLETE.md"):
        create_story_completion_doc()

    # Step 3: Update workflow status
    update_workflow_status(
        move_story_to_completed=True,
        update_in_progress_story=next_story,
        increment_completed_count=True,
        recalculate_percentage=True
    )

    # Step 4: Commit together
    git_commit(
        files=[completion_doc, workflow_status],
        message=f"feat: Complete Story {current_story} - {title}"
    )

    # Step 5: Prompt user for next story
    print(f"Story {current_story} complete!")
    print(f"Next story per BMAD: {next_story}")
    print("Shall we proceed with the next story?")
```

---

## 📋 DEVIATION PREVENTION CHECKLIST

### Use This Before EVERY Work Session

```markdown
## Pre-Session Checklist (MANDATORY - NO EXCEPTIONS)

### Workflow Validation
- [ ] Read docs/bmm-workflow-status.md FIRST THING
- [ ] Current phase, epic, story are clear
- [ ] Previous epic has retrospective (if starting new epic)
- [ ] No stories skipped or missing completion docs

### Story Validation
- [ ] Current story file exists in docs/
- [ ] Story has clear acceptance criteria
- [ ] Story is in epics.md
- [ ] Only ONE story in progress

### Architecture Validation
- [ ] Referenced docs/architecture.md
- [ ] Planned implementation aligns with architecture
- [ ] No contradictions or deviations planned

### Commitment
- [ ] I commit to 100% BMAD compliance
- [ ] I will NOT deviate from story workflow
- [ ] I will update workflow status after every story
- [ ] I will create completion docs for every story
- [ ] I will follow the process, not just "get it done"

### Emergency Stop Understanding
- [ ] I know when to trigger emergency stop
- [ ] I know how to resolve deviations
- [ ] I understand deviations are NOT ACCEPTABLE

## If ANY box is unchecked: DO NOT START WORK
```

---

## 🎓 BMAD METHODOLOGY PRINCIPLES (NEVER FORGET)

### Core Principles

1. **Story-First Development**
   - NO code without story
   - Story defines what to build
   - Story provides acceptance criteria

2. **One Story At A Time**
   - Never batch stories
   - Never work in parallel on multiple stories
   - Complete fully before moving on

3. **Workflow Status Is Truth**
   - bmm-workflow-status.md is SINGLE SOURCE OF TRUTH
   - Check it FIRST, update it LAST
   - Never deviate from what it says

4. **Documentation Is Non-Negotiable**
   - Every story gets completion doc
   - Every epic gets retrospective
   - Architecture doc stays current

5. **Process Over Speed**
   - Following process IS fast (no rework)
   - Cutting corners IS slow (creates debt)
   - Trust the process

6. **Retrospectives Drive Improvement**
   - Learn from each epic
   - Adjust process as needed
   - But never abandon process

---

## 🚨 ZERO TOLERANCE POLICY

### What "Zero Tolerance" Means

**There are NO acceptable reasons to deviate from BMAD methodology.**

❌ "We're in a hurry" - NOT ACCEPTABLE
❌ "This is just a small feature" - NOT ACCEPTABLE
❌ "I'll document it later" - NOT ACCEPTABLE
❌ "The story workflow is awkward for this" - NOT ACCEPTABLE
❌ "I know what I'm doing" - NOT ACCEPTABLE
❌ "We did Epic 1 already, we get it" - NOT ACCEPTABLE

**The ONLY acceptable approach: Follow BMAD exactly, every time.**

### Consequences of Deviation

**If deviation detected:**
1. **STOP ALL WORK** immediately
2. **DOCUMENT** the deviation
3. **FIX** the deviation (retroactive docs if needed)
4. **REALIGN** with BMAD process
5. **COMMIT** to not repeating

**If repeated deviation:**
1. Full project audit
2. Process review
3. Consideration of starting over AGAIN

**We will NOT tolerate repeated deviations.**

---

## 📞 WHEN IN DOUBT

### Questions to Ask Yourself

**Before starting work:**
- Q: "Have I checked workflow status?"
- Q: "Does a story file exist for this work?"
- Q: "Is this the current story per workflow status?"
- Q: "Am I about to violate any prohibition?"

**If answer to ANY is uncertain:** STOP and clarify first.

**During work:**
- Q: "Am I following the acceptance criteria?"
- Q: "Is this aligned with architecture.md?"
- Q: "Am I working on only ONE story?"
- Q: "Have I documented my decisions?"

**If answer to ANY is NO:** STOP and correct.

**After completing work:**
- Q: "Did I create STORY-X.Y-COMPLETE.md?"
- Q: "Did I update bmm-workflow-status.md?"
- Q: "Did I commit properly?"
- Q: "Is workflow status accurate?"

**If answer to ANY is NO:** Story is NOT complete.

---

## ✅ SUCCESS CRITERIA

### You Are Following BMAD Correctly If:

1. ✅ Every story has a story file in docs/
2. ✅ Every completed story has STORY-X.Y-COMPLETE.md
3. ✅ bmm-workflow-status.md is always current
4. ✅ Only ONE story is in progress at a time
5. ✅ Every completed epic has retrospective-epic-X.md
6. ✅ All work aligns with epics.md
7. ✅ All technical decisions align with architecture.md
8. ✅ Git history shows steady story-by-story commits
9. ✅ No "batch implementation" commits
10. ✅ You can trace every line of code to a story

**If all 10 are true: You're doing BMAD correctly. Keep going.**
**If ANY is false: STOP and fix immediately.**

---

## 🎯 COMMITMENT

By working on this project, all participants (human and AI) commit to:

1. **100% BMAD methodology compliance**
2. **Zero tolerance for deviations**
3. **Story-first development always**
4. **Workflow status as single source of truth**
5. **Documentation is non-negotiable**
6. **Process over speed**
7. **Daily compliance validation**
8. **Immediate correction of deviations**

**Deviations are NOT acceptable.**
**Compliance is NOT optional.**
**BMAD methodology will be followed.**

---

## 📌 QUICK REFERENCE

### Before ANY Work:
1. **RUN `/bmad-pre-flight` FIRST** (this does steps 2-4 automatically)
2. Read `docs/bmm-workflow-status.md` (done by pre-flight)
3. Verify story file exists (done by pre-flight)
4. Check `docs/architecture.md`

### During Work:
1. Follow acceptance criteria
2. Write tests
3. Document decisions
4. Commit frequently

### After Story Complete:
1. Create `STORY-X.Y-COMPLETE.md`
2. Update `bmm-workflow-status.md`
3. Commit both together
4. Move to next story

### Never Do:
- Code without story file
- Skip workflow status checks
- Work on multiple stories simultaneously
- Skip completion documentation
- Skip workflow status updates
- Skip retrospectives
- Build features outside epics
- Contradict architecture without updating docs

---

**BMAD METHODOLOGY ENFORCEMENT - ACTIVE**
**DEVIATION TOLERANCE - ZERO**
**COMPLIANCE REQUIREMENT - 100%**

**Let's build this right. One story at a time. Every time.**

🚀
