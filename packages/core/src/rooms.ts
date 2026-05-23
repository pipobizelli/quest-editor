import type { Quest, QuestElement, Room } from './types'

/**
 * Checks if a door element is adjacent to a room's walls.
 * A door is adjacent if its position is on or just outside the room boundary.
 */
function isDoorAdjacentToRoom(el: QuestElement, room: Room): boolean {
  const x = el.position.x
  const y = el.position.y

  // Door on left wall
  if (x === room.x - 1 && y >= room.y && y < room.y + room.height) return true
  // Door on right wall
  if (x === room.x + room.width && y >= room.y && y < room.y + room.height) return true
  // Door on top wall
  if (y === room.y - 1 && x >= room.x && x < room.x + room.width) return true
  // Door on bottom wall
  if (y === room.y + room.height && x >= room.x && x < room.x + room.width) return true
  // Door inside the room (on a wall boundary)
  if (x >= room.x && x < room.x + room.width && y >= room.y && y < room.y + room.height) return true

  return false
}

/**
 * Returns true if the room has at least one door adjacent to its walls.
 */
export function roomHasDoor(quest: Quest, room: Room): boolean {
  return quest.elements.some(
    (el) => el.type === 'door' && isDoorAdjacentToRoom(el, room),
  )
}

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
