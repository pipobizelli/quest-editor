import type { Quest, RoomGroup } from '@quest-editor/core'
import { getGroupedRooms, isGroupNarratable } from '@quest-editor/core'

/**
 * Generates a markdown GM script with all narrations in room order.
 */
export function buildGMScript(quest: Quest): string {
  const lines: string[] = []

  // Title
  lines.push(`# ${quest.name}`)
  lines.push('')

  // Description
  if (quest.description) {
    lines.push(`> ${quest.description.replace(/\n/g, '\n> ')}`)
    lines.push('')
  }

  // GM Notes
  if (quest.notes) {
    lines.push('## GM Notes')
    lines.push('')
    lines.push(quest.notes)
    lines.push('')
  }

  lines.push('---')
  lines.push('')

  // Narrations by room group
  const groups = getGroupedRooms(quest).filter((g) => isGroupNarratable(quest, g))
  const narrations = quest.narrations ?? {}
  let roomNumber = 1

  for (const group of groups) {
    const text = narrations[group.id]
    const label = group.rooms.length > 1
      ? `${group.label} (${group.rooms.length} parts)`
      : group.label

    lines.push(`## ${roomNumber}. ${label}`)
    lines.push('')

    if (text) {
      lines.push(text)
    } else {
      lines.push('*No narration generated.*')
    }

    lines.push('')
    roomNumber++
  }

  return lines.join('\n')
}
