import type { Quest, QuestElement, Room } from '@quest-editor/core'
import { getElementsByRoom, getCatalogEntry } from '@quest-editor/core'

function describeElements(elements: QuestElement[]): string {
  const groups = new Map<string, string[]>()

  for (const el of elements) {
    const catalog = getCatalogEntry(el.type, el.subtype)
    const label = catalog?.label ?? el.subtype
    const list = groups.get(el.type) ?? []
    list.push(label)
    groups.set(el.type, list)
  }

  const parts: string[] = []

  const monsters = groups.get('monster')
  if (monsters) parts.push(`Monsters: ${formatList(monsters)}`)

  const npcs = groups.get('npc')
  if (npcs) parts.push(`NPCs: ${formatList(npcs)}`)

  const furniture = groups.get('furniture')
  if (furniture) parts.push(`Furniture: ${formatList(furniture)}`)

  const traps = groups.get('trap')
  if (traps) parts.push(`Hidden traps: ${formatList(traps)}`)

  const treasure = groups.get('treasure')
  if (treasure) parts.push(`Treasure: ${formatList(treasure)}`)

  const doors = groups.get('door')
  if (doors) parts.push(`Doors: ${formatList(doors)}`)

  return parts.join('\n')
}

function formatList(items: string[]): string {
  const counts = new Map<string, number>()
  for (const item of items) {
    counts.set(item, (counts.get(item) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => count > 1 ? `${count}x ${name}` : name)
    .join(', ')
}

export function buildPrompt(
  quest: Quest,
  room: Room,
  language: string = 'en',
): string {
  const elements = getElementsByRoom(quest, room)
  const elementDesc = describeElements(elements)

  return `You are a narrator for a dungeon crawling board game (HeroQuest style).
A hero just opened a door and is looking into a room. Write a short, atmospheric narration (2-4 sentences) describing what they see.

Quest: "${quest.name}"
${quest.description ? `Quest context: ${quest.description}` : ''}
${quest.notes ? `GM notes: ${quest.notes}` : ''}

Room contents:
${elementDesc || 'The room appears empty.'}

Rules:
- Do NOT mention game mechanics, tile positions, or technical details.
- Do NOT reveal hidden traps — only describe what is visible.
- Write in ${language === 'pt' ? 'Brazilian Portuguese' : language === 'en' ? 'English' : language}.
- Be atmospheric and immersive, suitable for a game master to read aloud.
- Keep it short: 2-4 sentences max.`
}
