---
command: /bmad-enforce
description: Enforce 100% BMAD compliance for all operations
---

# BMAD ENFORCEMENT COMMAND

## Purpose
This command GUARANTEES 100% BMAD compliance by intercepting all implementation requests and routing them through proper BMAD workflows.

## Enforcement Levels

### LEVEL 1: VALIDATION
```bash
# Always run first
/bmad-pre-flight
```

### LEVEL 2: AGENT ACTIVATION
```bash
# Detect task type and activate correct agent
if [UI_WORK]; then
    /bmad:bmm:agents:ux-expert
elif [BACKEND_WORK]; then
    /bmad:bmm:agents:dev
elif [ARCHITECTURE]; then
    /bmad:bmm:agents:architect
elif [TESTING]; then
    /bmad:bmm:agents:tea
fi
```

### LEVEL 3: WORKFLOW ENFORCEMENT
```bash
# Force story workflow
/bmad:bmm:workflows:story-context [current]
/bmad:bmm:workflows:story-ready [current]
/bmad:bmm:workflows:dev-story [current]
```

### LEVEL 4: COMPLETION VALIDATION
```bash
# Ensure proper completion
/bmad:bmm:workflows:story-done [current]
```

## Auto-Detection Rules

### Task Type Detection
- "dashboard", "UI", "component" → UX Expert
- "API", "backend", "database" → Developer
- "architecture", "design", "system" → Architect
- "test", "QA", "validation" → Test Architect
- "requirements", "story", "criteria" → Product Manager

### Workflow Stage Detection
- No story file → Create Story
- Story file exists → Story Context
- Context loaded → Story Ready
- Ready confirmed → Dev Story
- Implementation done → Story Done

## Enforcement Matrix

| User Says | BMAD Response | Action |
|-----------|--------------|--------|
| "implement X" | "Running pre-flight first..." | /bmad-pre-flight |
| "just code Y" | "Activating dev agent..." | /bmad:bmm:agents:dev |
| "quickly add Z" | "Loading story context..." | /bmad:bmm:workflows:story-context |
| "skip process" | "REFUSED - BMAD required" | Block and enforce |

## Violation Responses

### SOFT VIOLATION
```
⚠️ BMAD Reminder: [Issue]
Suggestion: [Correct approach]
Would you like me to use the proper workflow? (Y/n)
```

### HARD VIOLATION
```
❌ BMAD VIOLATION BLOCKED
Issue: [Violation]
Required: [BMAD workflow]
Executing: [Command]
[Auto-execute proper workflow]
```

### CRITICAL VIOLATION
```
🚨 CRITICAL BMAD VIOLATION
Action: STOPPING ALL WORK
Issue: [Major violation]
Resolution: Must fix before continuing
[Block all operations until fixed]
```

## Integration Points

### Session Start
ALWAYS execute:
1. /bmad-pre-flight
2. /bmad:core:agents:bmad-master
3. /bmad:bmm:workflows:story-context

### Before Implementation
ALWAYS check:
1. Story file exists
2. Correct agent active
3. Workflow stage appropriate

### After Implementation
ALWAYS complete:
1. Story completion doc
2. Sprint status update
3. Workflow status update

## Compliance Tracking

Track and report:
- Violations attempted: [count]
- Violations blocked: [count]
- Workflows completed: [count]
- Agents used: [list]
- Compliance rate: [percentage]

## Usage

```bash
# Enable enforcement for session
/bmad-enforce

# Check current compliance
/bmad-enforce --status

# Reset enforcement
/bmad-enforce --reset

# Maximum enforcement
/bmad-enforce --zero-tolerance
```

## Zero Tolerance Mode

When enabled:
- NO manual implementation allowed
- ALL work through BMAD agents
- EVERY action validated
- ZERO exceptions permitted

## Reporting

Generate compliance reports:
```bash
/bmad-enforce --report
```

Shows:
- Session compliance %
- Violations blocked
- Workflows completed
- Time saved
- Quality improvements