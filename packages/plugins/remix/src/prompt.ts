import type { Quest } from '@quest-editor/core'
import {
  getElementsByRoom,
  getCatalogEntry,
  getMonsterStats,
  formatStatsTable,
  MONSTER_STATS,
  RULES_COMBAT,
  RULES_TRAPS,
  RULES_MONSTER_BEHAVIOR,
  RULES_CHAOS_SPELLS,
} from '@quest-editor/core'

export type Difficulty = 'hard' | 'heroic' | 'legendary'

function describeBoard(quest: Quest): string {
  const sections: string[] = []

  for (const room of quest.layout.rooms) {
    const elements = getElementsByRoom(quest, room)
    const monsters = elements.filter((e) => e.type === 'monster')
    const traps = elements.filter((e) => e.type === 'trap')
    const furniture = elements.filter((e) => e.type === 'furniture')

    const monsterDetails = monsters
      .map((m) => {
        const label = getCatalogEntry(m.type, m.subtype)?.label ?? m.subtype
        const stats = getMonsterStats(m.subtype)
        return `${label}(${m.id} @${m.position.x},${m.position.y}${stats ? ` Atk:${stats.attack} Def:${stats.defend} Body:${stats.body}` : ''})`
      })
      .join(', ')

    const trapDetails = traps
      .map((t) => `${t.subtype}(@${t.position.x},${t.position.y})`)
      .join(', ')

    const furnitureList = furniture
      .map((f) => getCatalogEntry(f.type, f.subtype)?.label ?? f.subtype)
      .join(', ')

    const hasDoor = quest.elements.some(
      (el) => el.type === 'door' && isNearRoom(el.position.x, el.position.y, room),
    )

    sections.push(
      `  <room id="${room.id}" x="${room.x}" y="${room.y}" w="${room.width}" h="${room.height}" has_door="${hasDoor}">` +
      (monsterDetails ? `\n    <monsters>${monsterDetails}</monsters>` : '') +
      (trapDetails ? `\n    <traps>${trapDetails}</traps>` : '') +
      (furnitureList ? `\n    <furniture>${furnitureList}</furniture>` : '') +
      `\n  </room>`,
    )
  }

  // Corridor elements
  const roomElements = new Set<string>()
  for (const room of quest.layout.rooms) {
    for (const el of getElementsByRoom(quest, room)) {
      roomElements.add(el.id)
    }
  }
  const corridorMonsters = quest.elements.filter(
    (e) => e.type === 'monster' && !roomElements.has(e.id),
  )
  const corridorTraps = quest.elements.filter(
    (e) => e.type === 'trap' && !roomElements.has(e.id),
  )
  if (corridorMonsters.length > 0 || corridorTraps.length > 0) {
    const items = [
      ...corridorMonsters.map((m) => {
        const label = getCatalogEntry(m.type, m.subtype)?.label ?? m.subtype
        return `    <monster id="${m.id}" subtype="${m.subtype}" x="${m.position.x}" y="${m.position.y}">${label}</monster>`
      }),
      ...corridorTraps.map((t) =>
        `    <trap subtype="${t.subtype}" x="${t.position.x}" y="${t.position.y}" />`
      ),
    ]
    sections.push(`  <corridors>\n${items.join('\n')}\n  </corridors>`)
  }

  return sections.join('\n')
}

function isNearRoom(x: number, y: number, room: { x: number; y: number; width: number; height: number }): boolean {
  return (
    x >= room.x - 1 &&
    x <= room.x + room.width &&
    y >= room.y - 1 &&
    y <= room.y + room.height
  )
}

function getEmptyPositions(quest: Quest): string {
  const occupied = new Set(
    quest.elements.map((e) => `${e.position.x},${e.position.y}`),
  )
  const disabled = new Set(
    (quest.disabledTiles ?? []).map((t) => `${t.x},${t.y}`),
  )

  const hints: string[] = []
  for (const room of quest.layout.rooms) {
    const empty: string[] = []
    for (let x = room.x; x < room.x + room.width; x++) {
      for (let y = room.y; y < room.y + room.height; y++) {
        const key = `${x},${y}`
        if (!occupied.has(key) && !disabled.has(key)) {
          empty.push(`(${x},${y})`)
        }
      }
    }
    if (empty.length > 0) {
      hints.push(`  <room id="${room.id}" empty_tiles="${empty.join(' ')}" />`)
    }
  }
  return hints.join('\n')
}

const DIFFICULTY_GUIDELINES: Record<Difficulty, string> = {
  hard: `\
- Upgrade 1-2 weak monsters to stronger types (e.g., goblin→orc, skeleton→zombie, orc→fimir)
- Add 2-4 new monsters in strategic positions (chokepoints, return paths)
- Optionally add 1 new trap in a corridor or room entrance
- Keep the quest completable — do NOT make it impossible
- Total added threat should feel like a moderate increase`,

  heroic: `\
- Upgrade 2-4 monsters to stronger types (e.g., goblin→orc, orc→fimir, fimir→chaos)
- Add 4-6 new monsters, including at least 1 elite (Chaos Warrior or Gargoyle)
- Add 1-2 new traps in strategic positions
- Reposition 1-2 existing monsters for better tactical advantage (ambushes, flanking)
- The quest should feel significantly harder but still winnable with good teamwork`,

  legendary: `\
- Upgrade 3-5 monsters to much stronger types (skeletons→mummies, orcs→chaos warriors)
- Add 5-8 new monsters with at least 2 elites (Chaos Warriors or Gargoyles)
- Add 2-3 new traps
- Reposition monsters for maximum tactical advantage
- Consider adding a spellcaster monster with Chaos Spells
- The quest should feel like a serious challenge even for experienced players`,
}

export function buildRemixPrompt(
  quest: Quest,
  difficulty: Difficulty,
  language: string = 'en',
): string {
  const langName = language === 'pt' ? 'Brazilian Portuguese' : language === 'en' ? 'English' : language

  return `You are a game designer remixing a HeroQuest quest to increase its difficulty.
The Game Master wants to create a harder variant of this quest so that players who already know the original layout will face new challenges.

<difficulty>${difficulty}</difficulty>

<difficulty_guidelines>
${DIFFICULTY_GUIDELINES[difficulty]}
</difficulty_guidelines>

<game_rules>
  <combat>
${RULES_COMBAT}
  </combat>
  <monster_behavior>
${RULES_MONSTER_BEHAVIOR}
  </monster_behavior>
  <traps>
${RULES_TRAPS}
  </traps>
  <chaos_spells>
${RULES_CHAOS_SPELLS}
  </chaos_spells>
</game_rules>

<quest>
  <name>${quest.name}</name>
${quest.description ? `  <description>${quest.description}</description>\n` : ''}\
${quest.notes ? `  <gm_notes>${quest.notes}</gm_notes>\n` : ''}\
</quest>

<board>
${describeBoard(quest)}
</board>

<available_positions>
${getEmptyPositions(quest)}
</available_positions>

<monster_stats>
${formatStatsTable(MONSTER_STATS)}
</monster_stats>

<upgrade_paths>
  goblin → orc → fimir → chaos
  skeleton → zombie → mummy
  orc → fimir → chaos
  fimir → chaos → gargoyle
</upgrade_paths>

<available_traps>pittrap, fallingblock, speartrap</available_traps>

<rules>
  <rule>Keep the quest objective, room layout, doors, and furniture UNCHANGED</rule>
  <rule>Only modify monsters and traps</rule>
  <rule>Use the upgrade_paths to determine valid monster upgrades</rule>
  <rule>New monsters must be placed ONLY on available_positions (empty tiles)</rule>
  <rule>When repositioning, use the monster's id field from the board data</rule>
  <rule>Ensure repositioned monsters stay within valid room/corridor tiles</rule>
  <rule>Follow the difficulty_guidelines for the selected difficulty level</rule>
  <rule>Provide tactical reasoning for each change</rule>
</rules>

<output_format>
Respond ONLY with a valid JSON object in this exact format:
{
  "name": "Quest Name (${difficulty === 'hard' ? 'Hard' : difficulty === 'heroic' ? 'Heroic' : 'Legendary'})",
  "description": "Brief description of changes in ${langName}",
  "upgrades": [
    { "id": "element-id", "from": "goblin", "to": "orc", "reason": "reason in ${langName}" }
  ],
  "repositions": [
    { "id": "element-id", "from": { "x": 5, "y": 3 }, "to": { "x": 7, "y": 3 }, "reason": "reason in ${langName}" }
  ],
  "add_monsters": [
    { "subtype": "fimir", "x": 8, "y": 5, "reason": "reason in ${langName}" }
  ],
  "add_traps": [
    { "subtype": "pittrap", "x": 6, "y": 4, "reason": "reason in ${langName}" }
  ]
}

All arrays may be empty but must be present. Output ONLY the JSON, no markdown code fences, no extra text.
</output_format>`
}
