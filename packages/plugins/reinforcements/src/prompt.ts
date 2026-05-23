import type { Quest } from '@quest-editor/core'
import {
  getElementsByRoom,
  getCatalogEntry,
  getMonsterStats,
  formatStatsTable,
  MONSTER_STATS,
} from '@quest-editor/core'

function describeBoard(quest: Quest): string {
  const sections: string[] = []

  for (const room of quest.layout.rooms) {
    const elements = getElementsByRoom(quest, room)
    const monsterCount = elements.filter((e) => e.type === 'monster').length
    const furnitureList = elements
      .filter((e) => e.type === 'furniture')
      .map((e) => getCatalogEntry(e.type, e.subtype)?.label ?? e.subtype)
    const hasDoor = quest.elements.some(
      (el) => el.type === 'door' && isNearRoom(el.position.x, el.position.y, room),
    )

    sections.push(
      `  <room id="${room.id}" x="${room.x}" y="${room.y}" w="${room.width}" h="${room.height}" has_door="${hasDoor}" monsters="${monsterCount}" furniture="${furnitureList.join(', ') || 'none'}" />`,
    )
  }

  // Existing monsters summary
  const monsters = quest.elements.filter((e) => e.type === 'monster')
  if (monsters.length > 0) {
    const summary = monsters.map((m) => {
      const label = getCatalogEntry(m.type, m.subtype)?.label ?? m.subtype
      return `    <monster subtype="${m.subtype}" x="${m.position.x}" y="${m.position.y}">${label}</monster>`
    })
    sections.push(`  <existing_monsters>\n${summary.join('\n')}\n  </existing_monsters>`)
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

export function buildReinforcementsPrompt(
  quest: Quest,
  language: string = 'en',
): string {
  const langName = language === 'pt' ? 'Brazilian Portuguese' : language === 'en' ? 'English' : language

  return `You are a game designer for a HeroQuest-style dungeon crawling board game.
The Game Master wants to add extra monsters to make the quest more challenging, especially for quests where heroes must retrieve an item and return to the stairs.

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

<available_monsters>
${formatStatsTable(MONSTER_STATS)}
</available_monsters>

<rules>
  <rule>Add 3-6 monsters that fit the quest's theme and narrative</rule>
  <rule>Place monsters in empty tiles only (use available_positions)</rule>
  <rule>Prioritize positions that block the return path to the stairs</rule>
  <rule>Mix weaker monsters (goblins, skeletons) with 1-2 stronger ones</rule>
  <rule>Do NOT place monsters in rooms that are already heavily populated</rule>
  <rule>Consider corridors as ambush points for the return journey</rule>
  <rule>Include a brief reason for each monster placement</rule>
</rules>

<output_format>
Respond ONLY with a valid JSON object in this exact format:
{
  "description": "Brief explanation of the reinforcement theme in ${langName}",
  "monsters": [
    { "subtype": "skeleton", "x": 5, "y": 8, "reason": "Brief reason in ${langName}" }
  ]
}

IMPORTANT: Output ONLY the JSON, no markdown code fences, no extra text.
</output_format>

<examples>
  <example>
    <output>
{
  "description": "Reforços de mortos-vivos emergem das sombras para bloquear a rota de fuga dos heróis.",
  "monsters": [
    { "subtype": "skeleton", "x": 5, "y": 8, "reason": "Bloqueia o corredor principal de retorno" },
    { "subtype": "zombie", "x": 3, "y": 12, "reason": "Emboscada na encruzilhada" },
    { "subtype": "mummy", "x": 10, "y": 5, "reason": "Guardião da sala do tesouro" },
    { "subtype": "skeleton", "x": 7, "y": 0, "reason": "Proteção próxima às escadas" }
  ]
}
    </output>
  </example>
</examples>`
}
