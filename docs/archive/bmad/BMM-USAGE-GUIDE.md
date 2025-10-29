# 🎯 BMM USAGE GUIDE - How to Actually Use the BMAD Method

## ✅ SLASH COMMANDS NOW AVAILABLE!

The following slash commands are ready to use:

### Core Story Workflow Commands:
- `/bmad-start` - Shows current status and what to do next
- `/create-story` - Drafts the next story from backlog
- `/story-ready` - Approves story for development
- `/dev-story` - Implements the current story
- `/story-done` - Marks story as complete

---

## 📋 HOW TO IMPLEMENT A STORY (Step-by-Step)

### Example: Implementing Story 2.5 (User Authentication)

#### Step 1: Check Current Status
```
/bmad-start
```
This shows you the current project state and next story.

#### Step 2: Create the Story
```
/create-story
```
This will:
- Move Story 2.5 from BACKLOG → TODO
- Draft the user story with acceptance criteria
- Create a story file

#### Step 3: Approve for Development
```
/story-ready
```
This will:
- Review the drafted story
- Validate acceptance criteria
- Move from TODO → IN_PROGRESS

#### Step 4: Implement the Story
```
/dev-story
```
This will:
- Read the story requirements
- Implement the authentication system
- Create tests
- Update documentation

#### Step 5: Complete the Story
```
/story-done
```
This will:
- Validate implementation
- Confirm tests pass
- Move from IN_PROGRESS → DONE
- Update metrics

---

## 🚫 IMPORTANT: What NOT to Do

### ❌ DON'T:
- Work on multiple stories at once
- Skip the story creation step
- Implement features not in a story
- Forget to mark stories complete

### ✅ DO:
- Follow the workflow sequence
- Complete one story at a time
- Use the slash commands
- Update status after each story

---

## 📊 Current Project State

```yaml
Project: Zmart Mobile Marketplace
Progress: 6 stories complete (27.6%)
Next Story: 2.5 - User Authentication

Workflow State:
├── BACKLOG: 10 stories
├── TODO: (empty - use /create-story)
├── IN_PROGRESS: (empty)
└── DONE: 6 stories
```

---

## 🔧 MANUAL WORKFLOW (If Slash Commands Don't Work)

If slash commands aren't working, you can manually:

### 1. Read Current Status:
```bash
cat bmad/bmm/workflow-status.yaml
```

### 2. Create Story File:
```bash
# Create story file for Story 2.5
echo "# Story 2.5: User Authentication

## User Story
As a user, I want to authenticate with the platform...

## Acceptance Criteria
- [ ] User can register
- [ ] User can login
- [ ] User can logout
- [ ] Sessions are secure

## Technical Notes
- Use JWT tokens
- Implement with Supabase Auth
" > docs/STORY-2.5.md
```

### 3. Update Workflow Status:
Edit `bmad/bmm/workflow-status.yaml`:
- Move story from `backlog` to `todo`
- Then from `todo` to `in_progress`
- Finally from `in_progress` to `done`

### 4. Implement the Story:
Write the actual code following the acceptance criteria.

### 5. Create Completion Doc:
```bash
echo "# Story 2.5 Complete

## What Was Implemented
- Authentication system
- JWT token management
- Secure sessions

## Tests Created
- Auth flow tests
- Security tests

## Status
✅ All acceptance criteria met
" > docs/STORY-2.5-COMPLETE.md
```

---

## 🎯 QUICK REFERENCE

### Story States:
```
BACKLOG → TODO → IN_PROGRESS → DONE
```

### Commands in Order:
1. `/bmad-start` (check status)
2. `/create-story` (draft story)
3. `/story-ready` (approve)
4. `/dev-story` (implement)
5. `/story-done` (complete)

### Current Next Action:
```
/create-story
```
This will start Story 2.5: User Authentication

---

## ✨ PRO TIPS

1. **Always check status first** with `/bmad-start`
2. **Complete stories fully** before starting new ones
3. **Follow the workflow** - it prevents problems
4. **Document as you go** - not after
5. **One story at a time** - no multitasking

---

## 🚀 READY TO START?

Run `/create-story` to begin implementing Story 2.5: User Authentication!

The BMM framework will guide you through each step.