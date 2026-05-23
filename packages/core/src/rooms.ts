import type { Quest, QuestElement, Room } from './types'

/**
 * Returns all elements whose position falls within a room's bounds.
 */
export function getElementsByRoom(quest: Quest, room: Room): QuestElement[] {
  return quest.elements.filter((el) => {
    const ex = el.position.x
    const ey = el.position.y
    return (
      ex >= room.x &&
      ex < room.x + room.width &&
      ey >= room.y &&
      ey < room.y + room.height
    )
  })
}

/**
 * Returns a map of room id → elements in that room.
 */
export function getElementsByAllRooms(quest: Quest): Map<string, QuestElement[]> {
  const map = new Map<string, QuestElement[]>()
  for (const room of quest.layout.rooms) {
    const elements = getElementsByRoom(quest, room)
    if (elements.length > 0) {
      map.set(room.id, elements)
    }
  }
  return map
}
