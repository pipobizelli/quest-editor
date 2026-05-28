import type { Quest, QuestElement, Room } from './types'
import { tileKey, buildDisabledSet } from './tiles'

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
  const disabled = buildDisabledSet(quest)
  for (let x = room.x; x < room.x + room.width; x++) {
    for (let y = room.y; y < room.y + room.height; y++) {
      if (!disabled.has(tileKey(x, y))) return true
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
 * Returns all elements that overlap with a room's bounds.
 * Considers element dimensions (width/height), not just origin position.
 */
export function getElementsByRoom(quest: Quest, room: Room): QuestElement[] {
  return quest.elements.filter((el) => {
    const ex = el.position.x
    const ey = el.position.y
    const ew = el.width ?? 1
    const eh = el.height ?? 1
    // AABB overlap: element rect [ex, ex+ew) x [ey, ey+eh) intersects room rect
    return (
      ex + ew > room.x &&
      ex < room.x + room.width &&
      ey + eh > room.y &&
      ey < room.y + room.height
    )
  })
}

/**
 * Returns all elements whose position falls within any of the given rooms.
 * Deduplicates by element id.
 */
export function getElementsByRooms(quest: Quest, rooms: Room[]): QuestElement[] {
  const seen = new Set<string>()
  const result: QuestElement[] = []
  for (const room of rooms) {
    for (const el of getElementsByRoom(quest, room)) {
      if (!seen.has(el.id)) {
        seen.add(el.id)
        result.push(el)
      }
    }
  }
  return result
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

// ─── Grouped Rooms ───────────────────────────────────────────────────

export interface RoomGroup {
  /** ID for the group. Uses the group field if available, otherwise the single room's id. */
  id: string
  /** Label for display. Uses group name or room id. */
  label: string
  /** The rooms that make up this logical room. */
  rooms: Room[]
}

/**
 * Groups rooms by their `group` field. Rooms without a group become their own group.
 * Returns groups in the order their first room appears in the layout.
 */
export function getGroupedRooms(quest: Quest): RoomGroup[] {
  const groups: RoomGroup[] = []
  const groupMap = new Map<string, RoomGroup>()

  for (const room of quest.layout.rooms) {
    if (room.group) {
      let group = groupMap.get(room.group)
      if (!group) {
        group = { id: room.group, label: room.group, rooms: [] }
        groupMap.set(room.group, group)
        groups.push(group)
      }
      group.rooms.push(room)
    } else {
      groups.push({ id: room.id, label: room.id, rooms: [room] })
    }
  }

  return groups
}

/**
 * Returns the group IDs that a door connects to.
 */
export function getGroupsForDoor(quest: Quest, doorElement: QuestElement): string[] {
  const groups = getGroupedRooms(quest)
  const connected = new Set<string>()
  for (const group of groups) {
    for (const room of group.rooms) {
      if (isDoorConnectedToRoom(doorElement, room)) {
        connected.add(group.id)
      }
    }
  }
  return [...connected]
}

/**
 * Returns true if a room group is narratable:
 * - At least one room in the group has valid (non-disabled) tiles
 * - At least one room in the group has a properly connected door
 */
export function isGroupNarratable(quest: Quest, group: RoomGroup): boolean {
  const hasValidTiles = group.rooms.some((room) => isRoomValid(quest, room))
  const hasDoor = group.rooms.some((room) => roomHasDoor(quest, room))
  return hasValidTiles && hasDoor
}
