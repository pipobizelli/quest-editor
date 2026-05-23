import type { Quest, QuestElement, Room } from '@quest-editor/core'
import {
  getElementsByRoom,
  getCatalogEntry,
  getMonsterStats,
  formatStatsTable,
  MONSTER_STATS,
  HERO_STATS,
} from '@quest-editor/core'

function describeRoomContents(quest: Quest, room: Room): string {
  const elements = getElementsByRoom(quest, room)
  if (elements.length === 0) return '  <empty />'

  const lines: string[] = []
  for (const el of elements) {
    const catalog = getCatalogEntry(el.type, el.subtype)
    const label = catalog?.label ?? el.subtype
    const stats = el.type === 'monster' ? getMonsterStats(el.subtype) : null
    const statsStr = stats ? ` (Mv:${stats.movement} Atk:${stats.attack} Def:${stats.defend} Body:${stats.body} Mind:${stats.mind})` : ''
    lines.push(`    <element type="${el.type}" subtype="${el.subtype}" x="${el.position.x}" y="${el.position.y}">${label}${statsStr}</element>`)
  }
  return lines.join('\n')
}

function describeBoard(quest: Quest): string {
  const rooms = quest.layout.rooms
  const sections: string[] = []

  for (const room of rooms) {
    const contents = describeRoomContents(quest, room)
    sections.push(`  <room id="${room.id}" x="${room.x}" y="${room.y}" w="${room.width}" h="${room.height}">\n${contents}\n  </room>`)
  }

  // Elements in corridors (not in any room)
  const roomElements = new Set<string>()
  for (const room of rooms) {
    for (const el of getElementsByRoom(quest, room)) {
      roomElements.add(el.id)
    }
  }
  const corridorElements = quest.elements.filter((el) => !roomElements.has(el.id))
  if (corridorElements.length > 0) {
    const lines = corridorElements.map((el) => {
      const catalog = getCatalogEntry(el.type, el.subtype)
      const label = catalog?.label ?? el.subtype
      return `    <element type="${el.type}" subtype="${el.subtype}" x="${el.position.x}" y="${el.position.y}">${label}</element>`
    })
    sections.push(`  <corridors>\n${lines.join('\n')}\n  </corridors>`)
  }

  return sections.join('\n')
}

export function buildStrategyPrompt(
  quest: Quest,
  language: string = 'en',
): string {
  const langName = language === 'pt' ? 'Brazilian Portuguese' : language === 'en' ? 'English' : language

  return `You are a tactical advisor for the Game Master (Zargon) in a HeroQuest board game session.
Analyze the quest board and suggest the best strategy for Zargon to challenge the heroes effectively while keeping the game fun.

<game_rules>
  <combat>
    - Each turn: a player rolls 2d6 for movement, then may attack OR cast a spell
    - Attack: roll Attack Dice, each skull = 1 hit
    - Defend: roll Defend Dice, each shield = 1 block
    - A creature dies when Body Points reach 0
    - Monsters can only attack adjacent heroes (orthogonal, not diagonal)
    - Undead (Skeleton, Zombie, Mummy) have Mind 0 and are immune to mind spells
  </combat>
  <zargon_rules>
    - Zargon moves ALL monsters each turn, after hero turns
    - Monsters are revealed when heroes open doors or enter rooms
    - Zargon can move monsters through doors
    - Monsters cannot move through other monsters or heroes
    - Zargon should challenge heroes but keep the game enjoyable
  </zargon_rules>
  <monster_stats>
${formatStatsTable(MONSTER_STATS)}
  </monster_stats>
  <hero_stats>
${formatStatsTable(HERO_STATS)}
  </hero_stats>
</game_rules>

<quest>
  <name>${quest.name}</name>
${quest.description ? `  <description>${quest.description}</description>\n` : ''}\
${quest.notes ? `  <gm_notes>${quest.notes}</gm_notes>\n` : ''}\
</quest>

<board>
${describeBoard(quest)}
</board>

<rules>
  <rule>Analyze monster positioning and suggest tactical improvements</rule>
  <rule>Consider chokepoints, room entries, and ambush opportunities</rule>
  <rule>Suggest which monsters should be aggressive vs defensive</rule>
  <rule>Consider the heroes' likely path through the dungeon</rule>
  <rule>Keep suggestions concise: 3-5 tactical tips max</rule>
  <rule>Format each tip as a numbered list item</rule>
  <rule>Write in ${langName}</rule>
</rules>

<examples>
  <example>
    <output>
1. **Emboscada no corredor**: Mova os 2 esqueletos da sala norte para o corredor em (5,8) e (5,9). Quando os heróis abrirem a porta, serão flanqueados.

2. **Defesa em camadas**: Mantenha o Guerreiro do Caos na sala do trono como última linha. Use os goblins como bucha de canhão para gastar os recursos dos heróis.

3. **Bloqueio de passagem**: Posicione o Fimir na porta entre as salas. Com Defesa 3 e Corpo 2, ele aguenta pelo menos 2 turnos, dando tempo para reforços.
    </output>
  </example>
</examples>

Provide your tactical analysis and suggestions. Output only the numbered tips.`
}
