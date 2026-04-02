# CLAUDE.md — Badge Quest 2026

## Purpose

You are working on **Badge Quest 2026**, a goal-tracking PWA designed like a retro game.

Your job is to make **small, correct, and safe improvements** without breaking:

- existing behavior
- visual identity (XP + pixel RPG)
- Firebase data integrity
- modular vanilla JS structure

---

## Product Philosophy (read this before building anything)

Badge Quest is an **adventure companion**, not a to-do list. This is not a subtle distinction — it shapes every feature, every piece of copy, and every UI decision.

**Completion is never required.** Goals can change. Life changes. Abandoning a quest is not failure — it's the adventure going a different direction. The app never judges.

**No pressure. No guilt. No shame.** The product should not chase users when they're gone, punish them for inactivity, or make them feel behind. It should be delightful when they return.

**Use it when you feel like it.** We don't care about time-in-app or streaks. We care that when someone opens it, they feel something good.

**The journey is the point, not the destination.** A quest that's sat on the board for 6 months is not a red mark — it's a story.

**Badge philosophy:**
- **Visible badges** celebrate participation and adventure — showing up, trying, being in motion. Not grinding to 100%.
- **Secret badges** are for discoverers. Any completionist mechanic (finish everything, unlock all badges) lives here — hidden, never pressure, pure joy when found.
- Regular badges should feel like happy milestones, not a checklist to clear.

**When building, always ask:**
- Does this create pressure or guilt? If yes, redesign it.
- Does this empty state invite or shame? It should always invite.
- Does this progress element say "look how far you've come" or "look how much is left"? It should always be the former.
- Would a notification or reminder feel like a friend waving, or a boss chasing? Always the former.

---

## Project Files

All files live in:
`C:\Users\Niklas Missel\Vibecoding\Claude projekter\Badge Quest 2026\`

| File | Role |
|---|---|
| `index.html` | App shell, DOM structure |
| `style.css` | XP Luna + pixel RPG visual identity |
| `app.js` | Entry point, app init, routing |
| `ui.js` | DOM rendering, panels, tabs, dialogs |
| `db.js` | Firestore reads/writes |
| `auth.js` | Firebase Auth logic |
| `badges.js` | Badge definitions and unlock logic |
| `partners.js` | Partner/team/invite logic |
| `firebase.js` | Firebase SDK init and config |
| `sw.js` | Service worker — PWA caching |
| `manifest.json` | PWA manifest |
| `vercel.json` | Vercel deployment config |

---

## Core Principles (Non-Negotiable)

### 1) Do not invent reality
Never assume files, functions, selectors, or data structures exist.

If unsure:
- state what you checked
- state what is unknown

### 2) Smallest safe change
- Prefer minimal diffs
- Do not refactor unless required
- If refactoring:
  - isolate it
  - keep behavior identical
  - explain why

### 3) Evidence > intuition
Base decisions on:
- actual code
- existing patterns
- current UI behavior

Do not apply generic best practices blindly.

### 4) Preserve conventions
Match:
- file structure
- naming
- DOM patterns
- Firebase usage
- UI patterns
- animation + sound behavior

### 5) Protect the product feel
This is a **game-like experience**, not a SaaS app.

Do not:
- modernize the UI
- remove feedback/celebration
- simplify away personality

Preserve:
- XP Luna styling
- pixel font usage
- tactile UI (tabs, buttons, dialogs)
- reward loops (badges, confetti, sounds)

### 6) Leave it slightly better
When touching code:
- allow tiny safe cleanup
- remove obvious dead code if directly related
- do not expand scope

---

## Workflow

### 1) Inspect first
Before doing anything:
- locate relevant files
- confirm where logic actually lives
- avoid trusting assumptions

### 2) Check if underspecified

A task is underspecified if unclear:
- what changes vs stays
- what "done" means
- scope boundaries
- constraints
- data impact

If multiple interpretations exist → treat as underspecified.

### 3) Ask must-have questions

Rules:
- ask 1–5 max
- use numbered questions
- prefer multiple choice
- include a **recommended default**
- allow quick reply format

Example:

```
1) Scope?
   a) Minimal change (recommended)
   b) Refactor nearby code
   c) Not sure — use recommended

2) Visual change?
   a) Preserve current XP style (recommended)
   b) Minor polish
   c) Redesign

Reply: 1a 2a
```

### 4) Pause before acting

Until critical unknowns are resolved:

Do NOT:
- edit files
- commit to implementation
- create full plans based on guesses

You MAY:
- read files
- inspect structure
- map dependencies

If user says proceed anyway:
- list assumptions clearly
- proceed within them only

### 5) Restate task (short)

Before coding, state in 1–3 sentences:
- what will change
- what stays the same
- what success means

### 6) Implement

- touch minimal files
- avoid new abstractions
- keep functions simple
- do not restructure modules unnecessarily
- stay consistent with existing patterns

### 7) Verify

Check what matters for the change:
- logic correctness
- DOM behavior
- empty/error states
- auth-dependent flows
- Firestore reads/writes
- mobile/responsive behavior
- animations/sounds (if affected)

If something wasn't verified → say it.

### 8) Report clearly

Always include:

```
Changed:
- file.js

What changed:
- key points

Verified:
- what you actually checked

Assumptions / risks:
- anything uncertain
```

---

## Project Guardrails

### Architecture
- No frameworks
- No new dependencies unless necessary
- No artificial abstractions
- Prefer direct, readable JS

### Firebase Safety
Be careful with:
- auth
- user identity
- partners/teams
- invites
- Firestore schema

Never assume data shape without checking.

Call out:
- data risks
- migration risks

### UI Safety
Preserve:
- XP layout patterns
- panel + tab system
- feedback clarity
- game-like feel

### Animation / Sound Safety
Do not break:
- badge unlock flow
- confetti
- swipe interactions
- sound feedback

### PWA Safety
If touching `sw.js`, `manifest.json`, or the install flow:
- treat as high risk
- state what was verified

---

## Definition of Done

Done =

1. Feature works as intended
2. Matches existing code + UI patterns
3. Minimal surface area changed
4. No invented assumptions
5. Key behavior verified
6. Risks clearly stated

---

## Anti-Patterns

Do not:
- invent code or data structures
- over-refactor
- add dependencies casually
- modernize UI
- replace clear code with abstraction
- skip verification
- make silent Firebase changes

---

## Output Templates

### Clarifying questions

```
Before I start:

1) Scope?
   a) Minimal change (recommended)
   b) Refactor nearby
   c) Not sure

2) Visual change?
   a) Preserve XP style (recommended)
   b) Minor polish
   c) Redesign

Reply: 1a 2a
```

### Restatement

```
I'll make a minimal change to [area], keep [unchanged], and treat it as done when [result].
```

### Completion

```
Changed:
- file.js

What changed:
- ...

Verified:
- ...

Assumptions / risks:
- ...
```
