# BMAD Start - Quick Start Guide for BMad Method Module

Shows the current project status and available next actions.

## Current Project Status

```yaml
Project: Zmart Mobile Marketplace
Scale: Level 3 (12-40 stories)
Phase: Implementation

Progress: 21/76 points (27.6%)
Completed Stories: 6
Remaining Stories: 10

Current Epic: Epic 2 - Core Features
Next Story: 2.5 - User Authentication
```

## Available Workflows

### Story Implementation Cycle:

1. **Create Story** (`/create-story`)
   - Moves next story from BACKLOG to TODO
   - SM agent drafts the story

2. **Approve Story** (`/story-ready`)
   - Reviews and approves story
   - Moves from TODO to IN_PROGRESS

3. **Implement Story** (`/dev-story`)
   - DEV agent implements
   - Creates tests and docs

4. **Complete Story** (`/story-done`)
   - Validates and marks complete
   - Moves to DONE

## Quick Start

To start the next story (2.5 - User Authentication):
```
/create-story
```

## Story State Machine

```
BACKLOG → TODO → IN_PROGRESS → DONE
   ↑        ↑         ↑          ↑
   └────────┴─────────┴──────────┘
     One story at each active state
```

## Current Backlog

- 2.5: User Authentication (5 pts) ← NEXT
- 2.6: User Profile Management (3 pts)
- 3.1: Product Listing View (5 pts)
- 3.2: Product Detail View (3 pts)
- 3.3: Product Creation Flow (5 pts)
- 3.4: Product Edit/Delete (3 pts)
- 4.1: Shopping Cart (5 pts)
- 4.2: Checkout Flow (8 pts)
- 4.3: Payment Processing (8 pts)
- 4.4: Order Management (5 pts)