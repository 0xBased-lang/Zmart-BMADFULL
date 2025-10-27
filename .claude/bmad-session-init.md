# BMAD SESSION INITIALIZATION - MANDATORY

## 🚨 THIS FILE ENFORCES BMAD COMPLIANCE

### AUTOMATIC SESSION START PROTOCOL

**EVERY SESSION MUST BEGIN WITH:**

```bash
# Step 1: Pre-flight validation (MANDATORY)
/bmad-pre-flight

# Step 2: Load project context
/bmad:core:agents:bmad-master
"Initialize BMAD session for Zmart project, verify compliance status"

# Step 3: Current story validation
/bmad:bmm:workflows:story-context
"Load current story context and validate alignment"
```

### SESSION RULES ENFORCEMENT

1. **NO IMPLEMENTATION WITHOUT PRE-FLIGHT**
   - If pre-flight fails → STOP
   - Fix issues before proceeding
   - No exceptions allowed

2. **NO MANUAL STORY WORK**
   - All story work through BMAD agents
   - No direct implementation
   - Agents handle everything

3. **NO SKIPPING WORKFLOWS**
   - Every story follows complete workflow
   - No shortcuts
   - No "quick fixes"

### COMPLIANCE CHECKLIST

Before ANY implementation:
- [ ] Pre-flight passed
- [ ] BMAD Master activated
- [ ] Story context loaded
- [ ] Correct agent selected
- [ ] Workflow initiated

### ENFORCEMENT TRIGGERS

If user requests implementation:
1. Check if pre-flight was run
2. If not, REFUSE and run pre-flight
3. Only proceed after validation

### DEVIATION PREVENTION

**Red Flags to Watch:**
- "Let's quickly implement..."
- "Skip the process this time..."
- "Just add this feature..."
- "Can you directly code..."

**Response to Red Flags:**
"⚠️ BMAD VIOLATION DETECTED. Running compliance check..."
Then execute: /bmad-pre-flight

### AGENT SELECTION MATRIX

| Task Type | Required Agent | Command |
|-----------|---------------|---------|
| UI/UX Work | UX Expert | `/bmad:bmm:agents:ux-expert` |
| Implementation | Developer | `/bmad:bmm:agents:dev` |
| Architecture | Architect | `/bmad:bmm:agents:architect` |
| Testing | Test Architect | `/bmad:bmm:agents:tea` |
| Requirements | Product Manager | `/bmad:bmm:agents:pm` |
| Analysis | Business Analyst | `/bmad:bmm:agents:analyst` |

### WORKFLOW AUTOMATION

For Story Work:
```
CREATE → /bmad:bmm:workflows:create-story
READY → /bmad:bmm:workflows:story-ready
DEVELOP → /bmad:bmm:workflows:dev-story
COMPLETE → /bmad:bmm:workflows:story-done
```

### COMPLIANCE MONITORING

Every 30 minutes:
- Run compliance check
- Verify on correct story
- Confirm using right agents
- Validate workflow status

### VIOLATION RESPONSE

If violation detected:
1. IMMEDIATE STOP
2. Document violation
3. Run pre-flight
4. Restart with proper workflow
5. No proceeding until compliant