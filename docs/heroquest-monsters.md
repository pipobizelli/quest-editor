# HeroQuest — Monster Chart

> Monster stats reference for the quest-editor LLM agents.

---

## Monster Stats

| Monster        | Movement | Attack | Defend | Body | Mind | Notes                              |
|----------------|----------|--------|--------|------|------|------------------------------------|
| Goblin         | 10       | 2      | 1      | 1    | 1    | Fastest monster, weakest defense   |
| Orc            | 8        | 3      | 2      | 1    | 2    | Fast, moderate attack              |
| Fimir          | 6        | 3      | 3      | 2    | 3    | Balanced, good defense and mind    |
| Skeleton       | 6        | 2      | 2      | 1    | 0    | Undead, immune to mind spells      |
| Zombie         | 5        | 2      | 3      | 1    | 0    | Undead, slow but tough defense     |
| Mummy          | 4        | 3      | 4      | 2    | 0    | Undead, slowest but highest defend |
| Chaos Warrior  | 7        | 4      | 4      | 3    | 3    | Elite, strong all-around           |
| Gargoyle       | 6        | 4      | 5      | 3    | 4    | Boss-tier, highest defense         |

---

## Column Definitions

- **Movement**: Number of squares the monster moves per turn (fixed, no dice roll).
- **Attack**: Number of combat dice rolled when attacking. Each Skull = 1 hit.
- **Defend**: Number of combat dice rolled when defending. Each Black Shield = 1 block.
- **Body**: Hit points. When reduced to 0, the monster is killed and removed.
- **Mind**: Resistance to mind-affecting spells. 0 = undead (immune to mind spells like Sleep, Command, Fear).

---

## Monster Categories

### Undead (Mind 0)

- **Skeleton**, **Zombie**, **Mummy**
- Immune to mind-affecting spells (Sleep, Fear, Command, etc.)
- Cannot be reasoned with or intimidated

### Living (Mind > 0)

- **Goblin**, **Orc**, **Fimir**
- Susceptible to all spell types
- Goblins and Orcs are the most common dungeon fodder

### Elite / Boss

- **Chaos Warrior**, **Gargoyle**
- High Attack + Defend + Body makes them very dangerous
- Gargoyle is the strongest standard monster in the base game

---

## Monster Behavior Rules

1. Monsters move a **fixed** number of squares (no dice roll).
2. Each monster performs **one move + one action** per Zargon's turn (or action + move).
3. Monsters may move and attack **diagonally**.
4. Monsters may **open or close doors**.
5. Monsters may **share squares** on the gameboard.
6. Monsters do **NOT** spring hidden traps.
7. Monsters do **NOT** search for treasure or secret doors.
8. Monsters do **NOT** need to move the full distance.
9. Some monsters may cast **Chaos Spells** (as noted in specific Quest Notes).

---

## Wandering Monsters

When a Hero draws a Wandering Monster card from the treasure deck:
1. Zargon identifies the monster type from the card.
2. Places the monster figure adjacent to the searching Hero.
3. The Hero must fight immediately.
4. The Wandering Monster uses the stats from this chart.
5. If surrounding squares are occupied, place as close as possible.

---

## Tactical Notes (for Strategist Agent)

### Threat Ranking (by overall danger)

1. **Gargoyle** — 4 Atk / 5 Def / 3 Body — hardest to kill, hits hard
2. **Chaos Warrior** — 4 Atk / 4 Def / 3 Body — nearly as dangerous, slightly less tanky
3. **Mummy** — 3 Atk / 4 Def / 2 Body — very tanky for its attack, slow (easy to kite)
4. **Fimir** — 3 Atk / 3 Def / 2 Body — balanced threat, moderate speed
5. **Orc** — 3 Atk / 2 Def / 1 Body — glass cannon, fast, dies in 1 hit easily
6. **Zombie** — 2 Atk / 3 Def / 1 Body — annoying tank, low damage, slow
7. **Skeleton** — 2 Atk / 2 Def / 1 Body — filler, easy kill
8. **Goblin** — 2 Atk / 1 Def / 1 Body — weakest, but fastest (can swarm)

### Expected Hits to Kill (approximate)

With 3 Attack Dice (Barbarian with Broadsword):
- Goblin/Skeleton/Orc/Zombie: ~1 round
- Fimir/Mummy: ~1-2 rounds
- Chaos Warrior/Gargoyle: ~2-3 rounds
