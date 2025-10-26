# Story Done - BMad Method Module v6a

Marks a story as complete and moves it from IN_PROGRESS to DONE.

## Usage

This command completes the current story:

1. Validates implementation meets acceptance criteria
2. Confirms tests pass
3. Moves story to DONE
4. Updates metrics

## Workflow

```bash
# Validate implementation
# Confirm tests pass
# Move to DONE
# Update completion metrics
```

## Completion Steps

1. Load workflow status from bmad/bmm/workflow-status.yaml
2. Verify IN_PROGRESS story implementation
3. Validate all acceptance criteria met
4. Move story from IN_PROGRESS to DONE
5. Update workflow-status.yaml with:
   - Completion date
   - Updated metrics
   - Progress percentage

## Validation Checklist

- ✅ All acceptance criteria met
- ✅ Tests written and passing
- ✅ Documentation updated
- ✅ Code reviewed