# Badge Quest — Idea Bank

Ideas to explore in future sessions. Not committed to — just captured.

## Badges Tab — Make It More Engaging
The current PERSONAL / PARTY / TEAM structure feels correct but the tab itself is too static.
Ideas to explore when we get to it:
- Animated badge reveals on scroll-into-view
- Progress toward next locked badge (e.g. "3 more quests to unlock")
- Badge detail modal with lore/flavour text
- Rarity showcase — legendary badges get a special treatment
- A "recent unlocks" highlight at the top

## Onboarding
New visitors hit the sign-in screen with zero context — no explanation of what Badge Quest is or why they'd want it.

Ideas:
- A **hero screen** before sign-in: a hobbit-style adventure scene — a lone hero setting out, friends pulling them into a quest, badges glinting in the distance. The tone should feel like the opening of a fantasy novel, not a SaaS landing page.
- Tagline idea: *"A quest is better shared."* or *"Your friends are waiting. The adventure has already begun."*
- Animated badge or confetti teaser so the game feel is obvious before signing up
- After first sign-in: a brief welcome flow — "Set your name → Add your first quest → Invite a friend"
- Empty state improvements: when a new user lands on ME tab with no quests, guide them rather than just showing a blank board
- Consider a "try before you sign in" mode (view-only demo data) — lowers the barrier significantly

## Icons & Visual Polish
- Review all emoji/icon usage across the app — many feel generic rather than XP-native
- Candidates: shuffle button (🔀), new quest button (+), tab icons, header icon
- Goal: replace with pixel-art style SVG icons or XP-era equivalents that match the retro game feel
- Specifically flagged: shuffle and new quest buttons in the quest panel titlebar

## Profile & Account
- User profile panel: change username, color, and avatar
- Avatar builder: pixel-art style character creator (builds on the existing LAS/SOF SVG heads)

## AI & Personalisation
- Based on existing goals / personality patterns, suggest new goals to users

## Gamification
- 2027 version: move from Kanto to Johto (progress carries over between years)
- Battle league leaders when hitting milestone completions

## Goal Management
- Drag-to-reorder goals (fun / playful interaction)
- New goal types: habit streak, tier/level (5 stars), range slider, etc.

## Social
- Add more sign-in providers: Facebook and Apple (already available in Firebase console)
- Party vs Team distinction (IN PROGRESS — see below)

## Team Badges (for when Team groups are built)
Ideas for fun collective badges that scale with team size:
- "SQUAD UP" — everyone has completed at least 1 quest
- "ALL IN" — everyone has added at least 5 quests to their board
- "TEAM SPIRIT" — every member has unlocked at least their first individual badge
- "LEGENDS" — every member is at 75%+ completion
- Combined total badges that scale: threshold = team_size × N (e.g. 10 per person, 20 per person)
- Streak badge: team goes X days without anyone being inactive

## More & Funner Badges
The current 8 individual badges follow a straight count-based progression. Worth exploring more creative unlock conditions:

### Personality / playstyle badges
- "OVERACHIEVER" — completed more quests than you set at the start (added mid-year and still finished them)
- "SPEED RUN" — completed 5 quests in the same calendar month
- "SLOW BURN" — took the whole year but got there (last badge earned in Dec)
- "COMEBACK KID" — went from 0 new completions for 30+ days, then completed 3 in a row

### Quirky milestone badges
- "BAKER'S DOZEN" — exactly 13 quests done
- "HALF BLOOD" — precisely 50% done (not approximate — exact halfway point)
- "NIGHT OWL" — completed a quest after midnight
- "EARLY BIRD" — completed a quest before 7am

### Meta / effort badges
- "PHOTO JOURNALIST" — attached a photo to 5 different quests
- "NOVELIST" — added notes to 10 different quests
- "QUEST SETTER" — set 25+ quests on your board
- "COLLECTOR" — unlocked all 8 individual badges

### Surprise / secret badges ⭐ PRIORITY
Inspired by Pokémon Yellow rare candies — hidden in seemingly random places, discovered by accident.
The thrill is that you have NO idea they exist until one just appears.

**Core mechanic:**
- Secret badges do NOT appear as locked slots. No hints. No count.
- When one triggers, it pops in as a surprise celebration (different animation — maybe a shimmer/sparkle instead of confetti)
- After earning one, a "SECRET BADGE FOUND!" screen appears, like finding a hidden item
- The badge case gets a hidden "??" section that only reveals itself once you've found your first one
- Each badge has a quirky, vague name that makes you go "wait... how did I get that?"

**Candidate secret badges:**
- "RARE CANDY" — tap the Badge Quest title/logo 10 times in a row (Easter egg tap)
- "HAUNTED" — open the app exactly at midnight
- "GLITCH CITY" — somehow trigger an edge case (e.g. have 0 goals, mark something done — impossible but fun to attempt)
- "MISSINGNO" — reach exactly 999 total interactions (taps, completions, etc.) — a stretch goal
- "LUCKY DAY" — complete a quest on your birthday (if we store birthday) or Jan 1st
- "SPEEDRUNNER" — complete 3 quests within 60 seconds of each other
- "THE GRIND" — open the app 30 days in a row
- "COMPLETIONIST" — find all other secret badges (meta-badge)
- "WRONG TURN" — tap something 5 times fast that isn't normally tappable
- "PROFESSOR OAK" — read the badge description of every single badge (all slots tapped)

**Technical approach when we build it:**
- `SECRET_BADGE_DEFS` array, same structure as BADGE_DEFS but with a `secret: true` flag and a `check(appState, event)` function
- A persistent counter store in localStorage (e.g. `bq_secret_counters`) tracking: titleTaps, midnightOpens, etc.
- On specific user interactions, run `checkSecretBadges(event)` — keeps main logic clean
- Earned secret badges stored in Firestore alongside normal unlockedBadges

### Shape & visual ideas
- More interesting shapes: scroll, lightning bolt, flame, compass, sword
- Animated badge unlock: particle burst beyond just confetti
- Badge "level up" — same badge but gold-bordered version for repeat completions

### Visual Easter Eggs & Meta Windows humour
- **CLIPPY** — a secret badge (or persistent companion) that appears after earning enough secret badges, or via Easter egg tap. SVG paperclip with eyes. "It looks like you're trying to complete all your quests. Would you like help with that?"
- Clippy could be a rare animated overlay that pops up occasionally with a vague tip, fully in the Windows XP assistant spirit
- Lean into the Windows XP aesthetic: faux "dialog boxes", fake error popups as jokes, balloon tooltips
- "BSOD" secret badge — trigger a fake Blue Screen of Death overlay (with a dismiss button) as a secret animation
- Windows startup chime plays when you first log in (secret audio Easter egg)
- Right-click context menu Easter egg on the logo or a specific element
