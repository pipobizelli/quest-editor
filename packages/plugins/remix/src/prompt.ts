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
  RULES_REMIX_GUIDELINES,
} from '@quest-editor/core'

export type Difficulty = 'hard' | 'heroic' | 'legendary'

function describeBoard(quest: Quest): string {
  const sections: string[] = []

  for (const room of quest.layout.rooms) {
    const elements = getElementsByRoom(quest, room)
    const monsters = elements.filter((e) => e.type === 'monster')
    const traps = elements.filter((e) => e.type === 'trap')
    const furniture = elements.filter((e) => e.type === 'furniture')
    const npcs = elements.filter((e) => e.type === 'npc')
    const treasure = elements.filter((e) => e.type === 'treasure')

    const monsterDetails = monsters
      .map((m) => {
        const label = getCatalogEntry(m.type, m.subtype)?.label ?? m.subtype
        const stats = getMonsterStats(m.subtype)
        return `${label}(${m.id} @${m.position.x},${m.position.y}${stats ? ` Atk:${stats.attack} Def:${stats.defend} Body:${stats.body}` : ''})`
      })
      .join(', ')

    const trapDetails = traps
      .map((t) => `${getCatalogEntry(t.type, t.subtype)?.label ?? t.subtype}(${t.id} @${t.position.x},${t.position.y})`)
      .join(', ')

    const furnitureDetails = furniture
      .map((f) => {
        const label = getCatalogEntry(f.type, f.subtype)?.label ?? f.subtype
        const w = f.width ?? 1
        const h = f.height ?? 1
        return `${label}(${f.id} @${f.position.x},${f.position.y} ${w}x${h})`
      })
      .join(', ')

    const npcDetails = npcs
      .map((n) => `${getCatalogEntry(n.type, n.subtype)?.label ?? n.subtype}(${n.id} @${n.position.x},${n.position.y})`)
      .join(', ')

    const treasureDetails = treasure
      .map((t) => `${getCatalogEntry(t.type, t.subtype)?.label ?? t.subtype}(${t.id} @${t.position.x},${t.position.y})`)
      .join(', ')

    const hasDoor = quest.elements.some(
      (el) => el.type === 'door' && isNearRoom(el.position.x, el.position.y, room),
    )

    sections.push(
      `  <room id="${room.id}" x="${room.x}" y="${room.y}" w="${room.width}" h="${room.height}" has_door="${hasDoor}">` +
      (monsterDetails ? `\n    <monsters>${monsterDetails}</monsters>` : '') +
      (trapDetails ? `\n    <traps>${trapDetails}</traps>` : '') +
      (furnitureDetails ? `\n    <furniture>${furnitureDetails}</furniture>` : '') +
      (npcDetails ? `\n    <npcs>${npcDetails}</npcs>` : '') +
      (treasureDetails ? `\n    <treasure>${treasureDetails}</treasure>` : '') +
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
  const corridorElements = quest.elements.filter(
    (e) => !roomElements.has(e.id) && e.type !== 'door' && e.type !== 'marker' && e.type !== 'hero',
  )
  if (corridorElements.length > 0) {
    const items = corridorElements.map((el) => {
      const label = getCatalogEntry(el.type, el.subtype)?.label ?? el.subtype
      return `    <element type="${el.type}" id="${el.id}" subtype="${el.subtype}" x="${el.position.x}" y="${el.position.y}">${label}</element>`
    })
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
  const occupied = new Set<string>()
  for (const e of quest.elements) {
    const w = e.width ?? 1
    const h = e.height ?? 1
    for (let dx = 0; dx < w; dx++) {
      for (let dy = 0; dy < h; dy++) {
        occupied.add(`${e.position.x + dx},${e.position.y + dy}`)
      }
    }
  }
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
LAYOUT CHANGES: Light room role shuffle — move 1-2 key elements to different rooms
MONSTERS: Upgrade 1-2 weak monsters + redistribute some between rooms. Add 2-4 new monsters.
TRAPS: Move 1-2 traps to different locations. Optionally add 1 new trap.
FURNITURE: Move 1-2 pieces within or between rooms.
Keep the quest completable. Total added threat = moderate increase.`,

  heroic: `\
LAYOUT CHANGES: Full room role shuffle — reassign boss room, treasure room, ambush points
MONSTERS: Upgrade 2-4 monsters + full redistribution. Add 4-6 new including 1 elite.
TRAPS: Move most traps + add 1-2 new ones in previously safe areas.
FURNITURE: Rearrange furniture in 2-3 rooms. Change which furniture holds treasure.
NPCs: Consider moving NPCs to different rooms.
Significantly harder but still winnable with good teamwork.`,

  legendary: `\
LAYOUT CHANGES: Full remix (Strategy D) — everything moves, maximum unpredictability
MONSTERS: Major upgrades (3-5) + complete redistribution. Add 5-8 new with 2+ elites.
TRAPS: Complete trap rearrangement + add 2-3 new.
FURNITURE: Full rearrangement across rooms. Multiple decoy treasure locations.
NPCs: Move to unexpected but narratively coherent locations.
A serious challenge even for experienced players. Apply all remix strategies.`,
}

export function buildRemixPrompt(
  quest: Quest,
  difficulty: Difficulty,
  language: string = 'en',
): string {
  const langName = language === 'pt' ? 'Brazilian Portuguese' : language === 'en' ? 'English' : language

  return `You are a game designer remixing a HeroQuest quest for replayability and increased difficulty.
Players already know the original layout. Your job is to rearrange the quest so it feels fresh and unpredictable while keeping its narrative essence.

<difficulty>${difficulty}</difficulty>

<difficulty_guidelines>
${DIFFICULTY_GUIDELINES[difficulty]}
</difficulty_guidelines>

<remix_guidelines>
${RULES_REMIX_GUIDELINES}
</remix_guidelines>

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

<disabled_tiles>
${(quest.disabledTiles ?? []).length > 0 ? (quest.disabledTiles ?? []).map((t) => `(${t.x},${t.y})`).join(' ') : 'none'}
</disabled_tiles>

<available_positions>
${getEmptyPositions(quest)}
</available_positions>

<monster_stats>
${formatStatsTable(MONSTER_STATS)}
</monster_stats>

<upgrade_paths>
IMPORTANT: Upgrades MUST stay within the same monster family. Never cross families.

LIVING family (susceptible to mind spells):
  goblin → orc → fimir → chaos → gargoyle

UNDEAD family (immune to mind spells, Mind 0):
  skeleton → zombie → mummy
</upgrade_paths>

<available_traps>pittrap, fallingrock, speartrap</available_traps>

<rules>
  <rule>Room structure, doors, stairway, and quest objective MUST NOT change</rule>
  <rule>Use element IDs when referencing existing elements for upgrades, repositions, and removals</rule>
  <rule>New elements must be placed ONLY on available_positions (empty tiles). NEVER place anything on disabled tiles — they are walls/blocked squares</rule>
  <rule>Repositioned elements must also land on valid available_positions, never on disabled tiles</rule>
  <rule>Use ONLY these exact monster subtypes: goblin, orc, fimir, skeleton, zombie, mummy, chaos, gargoyle</rule>
  <rule>Use ONLY these exact trap subtypes: pittrap, fallingrock, speartrap</rule>
  <rule>Furniture dimensions must fit within the target room</rule>
  <rule>Follow the remix_guidelines for what can/cannot change</rule>
  <rule>Follow the difficulty_guidelines for how much to change</rule>
  <rule>Provide tactical reasoning for each change</rule>
  <rule>Pass the quality checklist in the remix_guidelines</rule>
</rules>

<output_format>
Respond ONLY with a valid JSON object. CRITICAL: use the EXACT element IDs from the board data above (e.g. "a1b2c3d4"). Do NOT invent IDs.

{
  "name": "Quest Name (${difficulty === 'hard' ? 'Hard' : difficulty === 'heroic' ? 'Heroic' : 'Legendary'})",
  "description": "Brief description of the remix theme and strategy used, in ${langName}",
  "upgrades": [
    { "id": "exact-id-from-board", "from": "goblin", "to": "orc", "reason": "reason in ${langName}" }
  ],
  "repositions": [
    { "id": "exact-id-from-board", "from": { "x": 5, "y": 3 }, "to": { "x": 7, "y": 3 }, "reason": "reason in ${langName}" }
  ],
  "add_monsters": [
    { "subtype": "fimir", "x": 8, "y": 5, "reason": "reason in ${langName}" }
  ],
  "add_traps": [
    { "subtype": "pittrap", "x": 6, "y": 4, "reason": "reason in ${langName}" }
  ],
  "remove": [
    { "id": "exact-id-from-board", "reason": "reason in ${langName}" }
  ]
}

All arrays may be empty but must be present. Output ONLY the JSON, no markdown code fences, no extra text.
</output_format>`
}
