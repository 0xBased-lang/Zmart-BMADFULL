# ✅ DAILY BMAD COMPLIANCE CHECKLIST

**Use this EVERY DAY before starting work**

---

## 📋 MORNING CHECKLIST (5 MINUTES)

### Step 1: Read Workflow Status
```bash
cat docs/bmm-workflow-status.md | grep -E "CURRENT_|IN_PROGRESS"
```

**Questions:**
- [ ] What phase am I in?
- [ ] What epic am I in?
- [ ] What story am I working on?
- [ ] Is this the ONLY story in progress?

---

### Step 2: Verify Story File Exists
```bash
# Replace X.Y with your current story number
ls docs/STORY-*.md docs/stories/story-*.md 2>/dev/null | tail -5
```

**Questions:**
- [ ] Does current story file exist?
- [ ] Does it have acceptance criteria?
- [ ] Have I read it today?

---

### Step 3: Check Previous Work Is Complete
```bash
git log --oneline -5
ls docs/STORY-*-COMPLETE.md | tail -5
```

**Questions:**
- [ ] Did I complete yesterday's story?
- [ ] Does STORY-X.Y-COMPLETE.md exist?
- [ ] Is workflow status updated?
- [ ] Is git committed?

---

### Step 4: Verify Architecture Alignment
```bash
grep -n "your-technology" docs/architecture.md
```

**Questions:**
- [ ] Does my planned work align with architecture.md?
- [ ] Do I need to update architecture.md?
- [ ] Are there any contradictions?

---

## 🎯 DURING WORK (HOURLY CHECK)

### Every Hour, Ask Yourself:
- [ ] Am I still on the CURRENT_STORY from workflow status?
- [ ] Am I following the acceptance criteria?
- [ ] Am I documenting my decisions?
- [ ] Have I committed recently?
- [ ] Am I working on ONLY one story?

**If answer to ANY is NO: STOP and correct immediately.**

---

## 📝 END OF DAY CHECKLIST (10 MINUTES)

### Step 1: Check Story Completion Status
**If story is complete:**
- [ ] All acceptance criteria met
- [ ] Tests written and passing
- [ ] Created STORY-X.Y-COMPLETE.md
- [ ] Updated bmm-workflow-status.md
  - [ ] Moved story from TODO to COMPLETED
  - [ ] Updated COMPLETED_COUNT
  - [ ] Updated IN_PROGRESS_STORY to next
  - [ ] Updated COMPLETION_PERCENTAGE
- [ ] Committed with message: "feat: Complete Story X.Y - [title]"

**If story is NOT complete:**
- [ ] Committed work in progress
- [ ] Added TODO comments for tomorrow
- [ ] Workflow status still shows IN_PROGRESS
- [ ] No completion doc created (that's correct)

---

### Step 2: Verify Git Status
```bash
git status
git log --oneline -3
```

**Questions:**
- [ ] All work committed?
- [ ] Commit messages follow pattern?
- [ ] No uncommitted story completion?

---

### Step 3: Plan Tomorrow
**Write down:**
- Tomorrow I will work on Story: _____
- Acceptance criteria to complete: _____
- Expected completion: YES / NO / PARTIAL

---

## 🚨 WEEKLY COMPLIANCE AUDIT (FRIDAY - 15 MINUTES)

### Validation 1: Story Completion Tracking
```bash
# Count completed stories per workflow status
cat docs/bmm-workflow-status.md | grep "COMPLETED_COUNT:"

# Count completion docs that exist
ls docs/STORY-*-COMPLETE.md | wc -l
```
**Question:** Do these numbers match? [ YES / NO ]

---

### Validation 2: Epic Retrospectives
```bash
# What epic are we in?
cat docs/bmm-workflow-status.md | grep "CURRENT_EPIC:"

# How many retrospectives should exist?
ls docs/retrospective-epic-*.md 2>/dev/null | wc -l
```
**Question:** Are all required retrospectives created? [ YES / NO ]

---

### Validation 3: Workflow Status Accuracy
```bash
cat docs/bmm-workflow-status.md
```
**Questions:**
- [ ] CURRENT_PHASE matches reality?
- [ ] CURRENT_EPIC matches reality?
- [ ] CURRENT_STORY matches reality?
- [ ] IN_PROGRESS_STORY is exactly 1 story?
- [ ] COMPLETED_STORIES list is accurate?
- [ ] Completion percentage is correct?

---

### Validation 4: No Deviation Detected
**Review this week's work:**
- [ ] All code maps to a story in epics.md
- [ ] No "batch implementation" commits
- [ ] No features built outside stories
- [ ] No skipped story completion docs
- [ ] No multiple stories in progress simultaneously

**If ANY checkbox is unchecked: Deviation detected. Fix immediately.**

---

## 🎯 EPIC COMPLETION CHECKLIST

### When Completing an Epic:

1. **Verify All Stories Complete**
   ```bash
   # List all stories for this epic from epics.md
   # Verify each has completion doc
   ls docs/STORY-{epicNumber}.*-COMPLETE.md
   ```
   - [ ] All epic stories have completion docs
   - [ ] All epic stories marked COMPLETED in workflow status

2. **Create Epic Completion Document**
   - [ ] Created EPIC-{N}-COMPLETE.md
   - [ ] Documented what was delivered
   - [ ] Documented any deviations (should be NONE)
   - [ ] Listed all completed stories
   - [ ] Added evidence (links, screenshots, metrics)

3. **Create Retrospective (MANDATORY)**
   - [ ] Created retrospective-epic-{N}.md
   - [ ] What went well
   - [ ] What could improve
   - [ ] Action items for next epic
   - [ ] Velocity/metrics review
   - [ ] Process improvements identified

4. **Update Workflow Status**
   - [ ] Set CURRENT_EPIC to next epic
   - [ ] Set CURRENT_STORY to first story of next epic
   - [ ] Clear IN_PROGRESS_STORY
   - [ ] Verified COMPLETED_COUNT is accurate
   - [ ] Updated COMPLETION_PERCENTAGE

5. **Commit**
   ```bash
   git add docs/EPIC-{N}-COMPLETE.md
   git add docs/retrospective-epic-{N}.md
   git add docs/bmm-workflow-status.md
   git commit -m "feat: Complete Epic {N} - {Epic Title}"
   ```

6. **Celebrate!** 🎉
   - Take a break
   - Review accomplishments
   - Prepare mentally for next epic

---

## 🚨 RED FLAGS (IMMEDIATE ACTION REQUIRED)

### If You Notice Any of These, STOP IMMEDIATELY:

🚩 **Workflow status not checked today**
→ Read it NOW before continuing

🚩 **Working on different story than IN_PROGRESS_STORY**
→ STOP. Commit current work. Realign to correct story.

🚩 **Story file doesn't exist for current work**
→ STOP. Create story file from epics.md first.

🚩 **Multiple stories in progress**
→ STOP. Complete current story fully before next.

🚩 **Completion doc missing for "completed" story**
→ STOP. Create missing completion doc.

🚩 **Retrospective missing for completed epic**
→ STOP. Create retrospective before starting new epic.

🚩 **Work doesn't map to any story in epics.md**
→ STOP. Update epics.md first, or stop this work.

🚩 **Architecture contradicts implementation**
→ STOP. Update architecture.md or change implementation.

🚩 **Git commits without story reference**
→ STOP. Amend commits to reference story number.

🚩 **Feeling tempted to "just finish this quickly"**
→ STOP. That's how deviations start. Follow process.

---

## ✅ GREEN FLAGS (YOU'RE DOING IT RIGHT)

### These Indicate Good BMAD Compliance:

✅ Workflow status checked every morning
✅ Only one story in progress
✅ Story file exists and is referenced
✅ Commits reference story numbers
✅ Story completion docs created immediately
✅ Workflow status updated after every story
✅ Retrospectives exist for completed epics
✅ All work maps to stories in epics.md
✅ Architecture.md stays current
✅ Regular compliance validation

**If you see all green flags: Keep doing what you're doing! 🎯**

---

## 📞 QUICK DECISION TREE

```
Question: Can I start working now?
├─ Have I read workflow status today?
│  ├─ NO → Read it first
│  └─ YES → Continue
├─ Does story file exist?
│  ├─ NO → Create story file first
│  └─ YES → Continue
├─ Am I working on CURRENT_STORY?
│  ├─ NO → STOP. Realign or complete current story first.
│  └─ YES → Continue
├─ Is previous work committed?
│  ├─ NO → Commit first
│  └─ YES → Continue
└─ All checks pass? → START WORK ✅
```

---

## 🎯 ONE-PAGE QUICK REFERENCE

**EVERY MORNING:**
1. Read `docs/bmm-workflow-status.md`
2. Verify story file exists
3. Check previous work committed

**DURING WORK:**
1. Follow acceptance criteria
2. One story at a time
3. Commit frequently

**EVERY EVENING:**
1. If story complete: Create STORY-X.Y-COMPLETE.md
2. Update bmm-workflow-status.md
3. Commit with proper message

**EVERY FRIDAY:**
1. Validate story count matches docs
2. Verify no deviations occurred
3. Plan next week

**EPIC COMPLETE:**
1. Create EPIC-X-COMPLETE.md
2. Create retrospective-epic-X.md (MANDATORY)
3. Update workflow status
4. Take a break!

---

**Print this checklist. Keep it visible. Use it daily.**

**BMAD compliance is achieved through daily discipline, not occasional effort.**

🚀
