import type { Quest, QuestElement, Room, Position } from './types'

/**
 * Checks if a door element is properly connected to a room's wall,
 * considering both position AND orientation.
 *
 * - Vertical doors sit on the right edge of their tile (bridge left↔right).
 *   They connect to left/right walls of a room.
 * - Horizontal doors sit on the bottom edge of their tile (bridge top↔bottom).
 *   They connect to top/bottom walls of a room.
 */
function isDoorConnectedToRoom(el: QuestElement, room: Room): boolean {
  const x = el.position.x
  const y = el.position.y
  const isVertical = el.orientation === 'vertical'
  const isHorizontal = el.orientation === 'horizontal'

  // Left wall: vertical door at x = room.x - 1, y within room height
  if (isVertical && x === room.x - 1 && y >= room.y && y < room.y + room.height) return true
  // Right wall: vertical door at x = room.x + room.width, y within room height
  if (isVertical && x === room.x + room.width && y >= room.y && y < room.y + room.height) return true
  // Top wall: horizontal door at y = room.y - 1, x within room width
  if (isHorizontal && y === room.y - 1 && x >= room.x && x < room.x + room.width) return true
  // Bottom wall: horizontal door at y = room.y + room.height, x within room width
  if (isHorizontal && y === room.y + room.height && x >= room.x && x < room.x + room.width) return true

  // Door inside the room (shared internal wall between grouped rooms)
  if (x >= room.x && x < room.x + room.width && y >= room.y && y < room.y + room.height) return true

  return false
}

/**
 * Returns true if the room has at least one properly connected door.
 */
export function roomHasDoor(quest: Quest, room: Room): boolean {
  return quest.elements.some(
    (el) => el.type === 'door' && isDoorConnectedToRoom(el, room),
  )
}

/**
 * Returns true if the room has at least one non-disabled tile.
 */
export function isRoomValid(quest: Quest, room: Room): boolean {
  const disabled = new Set(
    (quest.disabledTiles ?? []).map((t) => `${t.x},${t.y}`),
  )
  for (let x = room.x; x < room.x + room.width; x++) {
    for (let y = room.y; y < room.y + room.height; y++) {
      if (!disabled.has(`${x},${y}`)) return true
    }
  }
  return false
}

/**
 * Returns true if a room should appear in the narrator (has a door AND has valid tiles).
 */
export function isRoomNarratable(quest: Quest, room: Room): boolean {
  return isRoomValid(quest, room) && roomHasDoor(quest, room)
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
