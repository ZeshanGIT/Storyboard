---
name: skill-archive-routing
description: Map slash skill refs (/grilling, /tdd) to .agents/skill-archive/. Use when attached archived skill names another skill or you need sibling not in discovery path.
---

# Archived skill routing

Skills in `.agents/skill-archive/` — not `.agents/skills/`. Cursor scans only latter. `/grilling` = doc shorthand, not Cursor slash cmd.

## Resolve ref

1. Strip `/` → folder name (`/grilling` → `grilling`)
2. Read `.agents/skill-archive/<name>/SKILL.md`
3. Follow before continuing parent

Example: grill-me says `/grilling` → Read `.agents/skill-archive/grilling/SKILL.md`

## Missing skill

Glob `.agents/skill-archive/**/SKILL.md`, match frontmatter `name:`. Still missing → tell user.

## Rules

- Ref skills not auto-attached — Read explicitly
- User attach: `@.agents/skill-archive/<name>/SKILL.md`
- New install in `.agents/skills/` → `./scripts/archive-skills.sh`
