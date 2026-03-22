# Badge Quest 2026 — Full Badge Reference

---

## PERSONAL BADGES
*Earned by completing your own quests (ME tab)*

| Badge | Shape | Rarity | How to unlock |
|---|---|---|---|
| BOULDER BADGE | Octagon | Common | Complete 1 quest |
| CASCADE BADGE | Drop | Common | Complete 4 quests |
| THUNDER BADGE | Star | Rare | Complete 8 quests |
| RAINBOW BADGE | Diamond | Rare | Complete 50% of all your quests |
| SOUL BADGE | Circle | Epic | Complete 16 quests |
| MARSH BADGE | Hexagon | Epic | Complete 19 quests |
| VOLCANO BADGE | Shield | Epic | Complete 22 quests |
| EARTH BADGE | Star6 | Legendary | Complete ALL your quests |

---

## PARTY BADGES
*Earned together with your party (TOGETHER tab)*

### Combined — based on total quests done across both of you

| Badge | Shape | Rarity | How to unlock |
|---|---|---|---|
| STARTER TEAM | Ring | Common | Together complete 10 quests |
| POWER PARTY | Cross | Rare | Together complete 30 quests |
| DREAM TEAM | Star4 | Legendary | Together complete ALL quests |

### Balance — both players must reach the same % threshold

| Badge | Shape | Rarity | How to unlock |
|---|---|---|---|
| IN SYNC | Heart | Common | Both at 25% done |
| PARTNERS | Arrow | Rare | Both at 50% done |
| LEGENDS | Crown | Epic | Both at 75% done |

---

## TEAM BADGES
*Earned with a team group (TEAM tab) — scales with team size*

| Badge | Shape | Rarity | How to unlock |
|---|---|---|---|
| FIRST STEPS | Shield | Common | Every crew member has completed 1 quest |
| PACKED & READY | Hexagon | Common | Everyone has 5+ quests loaded |
| RISING HEROES | Star | Rare | Every crew member has unlocked their first badge |
| ROAD WARRIORS | Ring | Epic | Total quests done >= 10 per team member |
| HALL OF LEGENDS | Crown | Legendary | Every team member is 75%+ done |

---

## SECRET BADGES
*Hidden — you cannot find them, they find you*

| Badge | Shape | Trigger |
|---|---|---|
| ADVENTURE BEGINS | Burst | Add your very first personal quest |
| NIGHT OWL | Moon | Complete any quest between midnight and 5 AM |
| SPEEDRUNNER | Lightning | Complete 3 quests within 60 seconds |
| PROFESSOR OAK | Scroll | Open the detail view for all 8 personal badges |
| PHOTO JOURNALIST | Gem | Have photos attached to 5 different quests |
| WRONG TURN | Hourglass | Try to add a 26th quest (hit the 25-quest limit) |
| NOVELIST | Pentagon | Have notes written on 10 different quests |
| COMPANION | Flame | Send your first party invite |
| HAUNTED | Ghost | Open the app between 23:50 and 00:10 |
| DRAFT MODE | Prism | Delete any quest |

---

## Notes

- Secret badge progress is tracked locally (localStorage) and in Firestore.
- Secret badges only appear in the BADGES tab once unlocked — the section is always visible as a hint.
- SPEEDRUNNER uses an in-memory timer (resets on page reload).
- PROFESSOR OAK tracks which badge details you've opened in localStorage (`bq_badge_seen`).
- All badge dates are stored in `badgeDates` on the user/group Firestore document.
