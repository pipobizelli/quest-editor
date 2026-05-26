import type { Quest, QuestElement, Room, RoomGroup } from '@quest-editor/core'
import { getElementsByRooms, getCatalogEntry, CREATURE_LORE, RULES_TRAPS } from '@quest-editor/core'

function describeElements(elements: QuestElement[]): string {
  const groups = new Map<string, string[]>()

  for (const el of elements) {
    const catalog = getCatalogEntry(el.type, el.subtype)
    const label = catalog?.label ?? el.subtype
    const list = groups.get(el.type) ?? []
    list.push(label)
    groups.set(el.type, list)
  }

  const lines: string[] = []

  const monsters = groups.get('monster')
  if (monsters) lines.push(`  <monsters>${formatList(monsters)}</monsters>`)

  const npcs = groups.get('npc')
  if (npcs) lines.push(`  <npcs>${formatList(npcs)}</npcs>`)

  const furniture = groups.get('furniture')
  if (furniture) lines.push(`  <furniture>${formatList(furniture)}</furniture>`)

  const traps = groups.get('trap')
  if (traps) lines.push(`  <hidden_traps>${formatList(traps)}</hidden_traps>`)

  const treasure = groups.get('treasure')
  if (treasure) lines.push(`  <treasure>${formatList(treasure)}</treasure>`)

  const doors = groups.get('door')
  if (doors) lines.push(`  <doors>${formatList(doors)}</doors>`)

  return lines.join('\n')
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

function getLanguageInstruction(language: string): string {
  switch (language) {
    case 'pt': return 'Brazilian Portuguese'
    case 'es': return 'Spanish'
    case 'fr': return 'French'
    case 'de': return 'German'
    case 'it': return 'Italian'
    default: return 'English'
  }
}

/**
 * Build a narration prompt for a room group (one or more rooms forming a logical room).
 * For backwards compatibility, also accepts a single Room.
 */
export function buildPrompt(
  quest: Quest,
  roomOrGroup: Room | RoomGroup,
  language: string = 'en',
  tone?: string,
): string {
  const rooms = 'rooms' in roomOrGroup ? roomOrGroup.rooms : [roomOrGroup]
  const elements = getElementsByRooms(quest, rooms)
  const elementDesc = describeElements(elements)

  return `You are a narrator for a HeroQuest board game session.
A hero just opened a door revealing a new room. Your job is to write a short, atmospheric narration for the Game Master to read aloud.

<quest>
  <name>${quest.name}</name>
${quest.description ? `  <description>${quest.description}</description>\n` : ''}\
${quest.notes ? `  <gm_notes>${quest.notes}</gm_notes>\n` : ''}\
</quest>

<room>
${elementDesc || '  <empty>true</empty>'}
</room>

<creature_lore>
${CREATURE_LORE}
</creature_lore>

<trap_knowledge>
${RULES_TRAPS}
</trap_knowledge>

<rules>
  <rule>Write 2-4 sentences maximum</rule>
  <rule>NEVER mention game mechanics, tile positions, dice, or technical details</rule>
  <rule>NEVER reveal hidden traps — but you may add subtle atmospheric hints (cold drafts, loose stones, faint clicking sounds) without naming the trap type</rule>
  <rule>Be atmospheric and immersive, use sensory details (sight, sound, smell)</rule>
  <rule>Use the creature_lore to describe monsters with rich, thematic detail — not just their names</rule>
  <rule>Mention the creatures and notable furniture naturally, not as a list</rule>
  <rule>Write in ${getLanguageInstruction(language)}</rule>${tone ? `\n  <rule>Tone and style: ${tone}</rule>` : ''}
</rules>

<examples>
  <example>
    <input>
      <monsters>2x Skeleton</monsters>
      <furniture>Table, Bookcase</furniture>
    </input>
    <output>A porta range ao abrir, revelando uma câmara empoeirada. Dois esqueletos erguem-se das sombras, suas armaduras enferrujadas rangendo a cada movimento. Uma mesa coberta de teias de aranha ocupa o centro da sala, enquanto uma estante repleta de tomos antigos se apoia contra a parede ao fundo.</output>
  </example>
  <example>
    <input>
      <empty>true</empty>
    </input>
    <output>O silêncio é a primeira coisa que os recebe ao abrir a porta. A sala está vazia, mas marcas no chão de pedra sugerem que algo — ou alguém — esteve aqui recentemente.</output>
  </example>
  <example>
    <input>
      <monsters>Gargoyle</monsters>
      <furniture>Tomb, 2x Chest</furniture>
      <treasure>Gold</treasure>
    </input>
    <output>Um frio sobrenatural invade o corredor quando a porta se abre. No centro da cripta, uma gárgula de pedra observa com olhos que parecem seguir cada movimento. Atrás dela, um sarcófago de mármore negro repousa entre dois baús ornamentados, e o brilho de moedas de ouro escapa por uma fresta.</output>
  </example>
</examples>

Write the narration for this room. Output only the narration text, nothing else.`
}
