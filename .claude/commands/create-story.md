# Create Story - BMad Method Module v6a

Moves the next story from BACKLOG to TODO and drafts it using the Scrum Master agent.

## Usage

This command initiates the story creation workflow:

1. Reads the workflow status file
2. Moves the next story from BACKLOG to TODO
3. Has the SM agent draft the user story
4. Creates a story file with acceptance criteria

## Workflow

```bash
# Load workflow status
cat bmad/bmm/workflow-status.yaml

# Identify next story in BACKLOG
# Move to TODO
# Draft story with SM agent
```

## Steps

1. Load the workflow.xml from bmad/core/tasks/workflow.xml
2. Pass the workflow config: bmad/bmm/workflows/4-implementation/create-story/workflow.yaml
3. Follow the workflow instructions to draft the story
4. Update workflow-status.yaml to move story to TODO

## Story Format

The story will be created with:
- User story statement
- Acceptance criteria
- Technical notes
- Dependencies
- Estimated points