# HeroQuest — Quest Remix Guidelines

> Guidelines for remixing a quest's layout while preserving its essence.
> Used by the Remix plugin to generate meaningful variations for replayability.

---

## Goal

Players who have completed a quest already know the layout: where monsters hide, where traps are, and the safest path to the objective. A remix should make the quest feel **fresh and unpredictable** while keeping the **same narrative arc and challenge intent**.

---

## What MUST NOT Change

These elements define the quest's identity and must remain fixed:

- **Room structure**: walls, corridors, room sizes, and room positions on the board
- **Door positions**: doors stay where they are (they are part of the board architecture)
- **Quest objective**: if the goal is "rescue the prisoner", it stays that way
- **Stairway position**: the entry/exit point stays fixed
- **Quest narrative**: the story/lore of the quest stays intact

---

## What CAN Change

### 1. Monster Placement (High Impact)

- **Relocate monsters** between rooms — a Chaos Warrior that was in room A can move to room B
- **Swap monster types** within the same tier — Orcs for Fimirs, Skeletons for Zombies
- **Change room roles** — the "ambush room" can become a different room
- **Vary monster count per room** — redistribute, don't just add
- **Move corridor guards** — monsters in corridors can shift to different chokepoints

**Constraints:**
- Maintain the overall monster count (±2 is acceptable)
- Keep the total threat level appropriate for the difficulty
- The boss/key monster should stay in a room with narrative significance (e.g., the deepest room, the throne room)

### 2. Trap Placement (High Impact)

- **Move traps to different corridors/rooms** — the pit trap doesn't have to be in the same corridor
- **Change trap types** — swap a pit trap for a falling block, or a spear trap for a chest trap
- **Add traps where there were none** — empty corridors are good candidates
- **Remove or relocate existing traps** — don't just pile more on

**Constraints:**
- Keep a similar total number of traps (±1)
- Traps should still be in places where heroes are likely to walk or search
- Don't place traps in rooms that are already very dangerous (too many monsters + trap = unfair)

### 3. Furniture Rearrangement (Medium Impact)

- **Move furniture within a room** — table goes to the other corner, bookcase to the opposite wall
- **Swap furniture between rooms** — the alchemist's bench moves to a different room
- **Change which piece of furniture holds treasure** — if the chest had gold, now the bookcase does

**Constraints:**
- Keep furniture count per room similar (±1)
- Furniture must fit within the room dimensions
- Don't remove all furniture from a room (it loses atmosphere)
- Thematic furniture should stay in thematic rooms (tomb stays in a crypt-like room)

### 4. Treasure Relocation (Medium Impact)

- **Move quest-specific treasure** to a different room — the artifact can be in room C instead of room B
- **Change which furniture hides the treasure** — was under the chest, now behind the bookcase
- **Add decoy rooms** — a room that looks important but has nothing

**Constraints:**
- The treasure/objective must still be reachable
- Don't hide critical quest items behind mandatory death traps

### 5. Secret Door Repositioning (Low-Medium Impact)

- **Move secret doors** to different walls — the shortcut changes
- **Add a new secret door** as an alternative path
- **Remove a secret door** to force a longer route

**Constraints:**
- At least one viable path to the objective must exist
- Secret doors should connect rooms/corridors in a way that makes spatial sense

### 6. NPC Repositioning (Low Impact)

- **Move NPCs** (prisoners, quest givers) to different rooms
- This changes which room the heroes need to reach

**Constraints:**
- NPCs should be in rooms that make narrative sense (prisoner in a cell-like room, not in an open corridor)

---

## Remix Strategies

### Strategy A — Room Role Shuffle

Reassign the "purpose" of each room while keeping the same total content:
- The "boss room" becomes a different room (preferably still deep in the dungeon)
- The "trap corridor" shifts to a different corridor
- The "treasure room" moves
- Early rooms might become harder, late rooms might become easier

**Best for:** Players who memorize the optimal path

### Strategy B — Monster Redistribution

Keep monsters in roughly the same rooms but change their positions and types:
- Monsters that were at the back of the room are now at the door
- Ranged threats replace melee threats
- Add a second wave (monsters in adjacent corridors that respond to combat noise)

**Best for:** Players who memorize room-by-room tactics

### Strategy C — Trap Gauntlet Shift

Completely rearrange the trap layout:
- Safe corridors become trapped
- Previously trapped corridors become safe
- Add traps near doors (heroes rushing into rooms get punished)

**Best for:** Players who memorize safe paths

### Strategy D — Full Remix (combine A + B + C)

Apply all strategies together for maximum unpredictability. This is the recommended approach for players who have completed the quest 3+ times.

---

## Difficulty Scaling in Remixes

When combining remix with difficulty increase:

| Difficulty | Monster Changes | Trap Changes | Layout Changes |
|------------|----------------|--------------|----------------|
| Hard       | Upgrade 1-2 + redistribute | Move 1-2 traps | Light room role shuffle |
| Heroic     | Upgrade 2-4 + full redistribute | Move + add traps | Full room role shuffle |
| Legendary  | Major upgrades + redistribute + add | Full trap rearrange | Full remix (Strategy D) |

---

## Quality Checklist

A good remix should pass these checks:

1. The quest is still **completable** — there is a viable path to the objective
2. The **narrative still makes sense** — story beats align with the new layout
3. **No room is empty AND no room is death** — balance the threat distribution
4. **Early rooms are easier than late rooms** — maintain a difficulty curve
5. The **boss encounter still feels climactic** — it shouldn't be the first room
6. **Traps are in places heroes will actually walk** — not in dead-end rooms nobody visits
7. **Furniture enhances atmosphere** — rooms don't feel bare
8. The remix feels **different enough** that a player who knows the original will be surprised
