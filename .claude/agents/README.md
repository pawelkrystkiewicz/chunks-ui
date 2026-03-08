# Agent Roles

Lightweight role definitions for agent isolation. These files define the expected behavior and constraints for each agent type and are referenced in Agent tool prompts.

## Roles

| Role | Access | Use when |
|------|--------|----------|
| [scout](./scout.md) | Read-only | Exploring, researching, auditing |
| [builder](./builder.md) | Read + Write | Implementing, fixing, refactoring |
| [reviewer](./reviewer.md) | Read-only | Reviewing diffs, checking quality |

## Usage

When spawning an agent, open the relevant role file and prepend its **System Prompt** section to your agent prompt.

```
# In an Agent tool call:
[paste system prompt from role file]

Your task: [specific instructions]
```

## Worktree Isolation

Use `isolation: "worktree"` on the Agent tool for:
- Experimental changes that might not pan out
- Parallel work on two separate components simultaneously
- Any agent task where contaminating the main workspace would be costly

The Agent tool automatically cleans up the worktree if no changes were made.

## Scope Discipline

Each agent should operate on a declared file scope. State explicitly in the prompt which files/directories the agent is allowed to modify. Cross-component contamination is the most common failure mode.
