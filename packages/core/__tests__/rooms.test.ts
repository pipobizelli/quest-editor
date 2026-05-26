import { describe, it, expect } from 'vitest'
import {
  createQuest,
  createElement,
  addElement,
  roomHasDoor,
  isRoomValid,
  isRoomNarratable,
  getGroupedRooms,
  isGroupNarratable,
  getElementsByRoom,
  getElementsByRooms,
  type Quest,
  type Room,
} from '../src'

function questWithRoom(): Quest {
  return createQuest()
}

function getRoom(quest: Quest, id: string): Room {
  return quest.layout.rooms.find((r) => r.id === id)!
}

// ─── roomHasDoor (orientation-aware) ─────────────────────────────────

describe('roomHasDoor', () => {
  it('detects vertical door on left wall', () => {
    let quest = questWithRoom()
    const room = quest.layout.rooms[0] // room-1 at (1,1) 4x3
    // Vertical door at x = room.x - 1 = 0, y = 1 (left wall)
    quest = addElement(quest, createElement('door', 'door', 0, 1, { orientation: 'vertical' }))
    expect(roomHasDoor(quest, room)).toBe(true)
  })

  it('detects vertical door on right wall', () => {
    let quest = questWithRoom()
    const room = quest.layout.rooms[0] // room-1 at (1,1) 4x3
    // Vertical door at x = room.x + room.width = 5, y = 2 (right wall)
    quest = addElement(quest, createElement('door', 'door', 5, 2, { orientation: 'vertical' }))
    expect(roomHasDoor(quest, room)).toBe(true)
  })

  it('detects horizontal door on top wall', () => {
    let quest = questWithRoom()
    const room = quest.layout.rooms[0] // room-1 at (1,1) 4x3
    // Horizontal door at y = room.y - 1 = 0, x = 2 (top wall)
    quest = addElement(quest, createElement('door', 'door', 2, 0, { orientation: 'horizontal' }))
    expect(roomHasDoor(quest, room)).toBe(true)
  })

  it('detects horizontal door on bottom wall', () => {
    let quest = questWithRoom()
    const room = quest.layout.rooms[0] // room-1 at (1,1) 4x3
    // Horizontal door at y = room.y + room.height = 4, x = 3 (bottom wall)
    quest = addElement(quest, createElement('door', 'door', 3, 4, { orientation: 'horizontal' }))
    expect(roomHasDoor(quest, room)).toBe(true)
  })

  it('rejects horizontal door on left/right wall (wrong orientation)', () => {
    let quest = questWithRoom()
    const room = quest.layout.rooms[0]
    // Horizontal door on left wall position — wrong orientation
    quest = addElement(quest, createElement('door', 'door', 0, 1, { orientation: 'horizontal' }))
    expect(roomHasDoor(quest, room)).toBe(false)
  })

  it('rejects vertical door on top/bottom wall (wrong orientation)', () => {
    let quest = questWithRoom()
    const room = quest.layout.rooms[0]
    // Vertical door on bottom wall position — wrong orientation
    quest = addElement(quest, createElement('door', 'door', 2, 4, { orientation: 'vertical' }))
    expect(roomHasDoor(quest, room)).toBe(false)
  })

  it('detects door inside the room (shared wall)', () => {
    let quest = questWithRoom()
    const room = quest.layout.rooms[0] // room-1 at (1,1) 4x3
    // Door inside room bounds
    quest = addElement(quest, createElement('door', 'door', 2, 2, { orientation: 'vertical' }))
    expect(roomHasDoor(quest, room)).toBe(true)
  })

  it('returns false when no doors exist', () => {
    const quest = questWithRoom()
    const room = quest.layout.rooms[0]
    expect(roomHasDoor(quest, room)).toBe(false)
  })
})

// ─── isRoomValid ─────────────────────────────────────────────────────

describe('isRoomValid', () => {
  it('returns true for room with no disabled tiles', () => {
    const quest = questWithRoom()
    const room = quest.layout.rooms[0]
    expect(isRoomValid(quest, room)).toBe(true)
  })

  it('returns true for room with some disabled tiles', () => {
    let quest = questWithRoom()
    const room = quest.layout.rooms[0] // (1,1) 4x3
    quest = { ...quest, disabledTiles: [{ x: 1, y: 1 }, { x: 2, y: 1 }] }
    expect(isRoomValid(quest, room)).toBe(true)
  })

  it('returns false for room entirely disabled', () => {
    let quest = questWithRoom()
    const room = quest.layout.rooms[0] // (1,1) 4x3 = 12 tiles
    const allDisabled = []
    for (let x = room.x; x < room.x + room.width; x++) {
      for (let y = room.y; y < room.y + room.height; y++) {
        allDisabled.push({ x, y })
      }
    }
    quest = { ...quest, disabledTiles: allDisabled }
    expect(isRoomValid(quest, room)).toBe(false)
  })
})

// ─── isRoomNarratable ────────────────────────────────────────────────

describe('isRoomNarratable', () => {
  it('returns true when room has valid tiles and a properly connected door', () => {
    let quest = questWithRoom()
    const room = quest.layout.rooms[0] // (1,1) 4x3
    quest = addElement(quest, createElement('door', 'door', 0, 1, { orientation: 'vertical' }))
    expect(isRoomNarratable(quest, room)).toBe(true)
  })

  it('returns false when room has no door', () => {
    const quest = questWithRoom()
    const room = quest.layout.rooms[0]
    expect(isRoomNarratable(quest, room)).toBe(false)
  })

  it('returns false when room is entirely disabled even with a door', () => {
    let quest = questWithRoom()
    const room = quest.layout.rooms[0] // (1,1) 4x3
    quest = addElement(quest, createElement('door', 'door', 0, 1, { orientation: 'vertical' }))
    const allDisabled = []
    for (let x = room.x; x < room.x + room.width; x++) {
      for (let y = room.y; y < room.y + room.height; y++) {
        allDisabled.push({ x, y })
      }
    }
    quest = { ...quest, disabledTiles: allDisabled }
    expect(isRoomNarratable(quest, room)).toBe(false)
  })

  it('returns false when door has wrong orientation', () => {
    let quest = questWithRoom()
    const room = quest.layout.rooms[0]
    // Horizontal door on left wall — wrong
    quest = addElement(quest, createElement('door', 'door', 0, 1, { orientation: 'horizontal' }))
    expect(isRoomNarratable(quest, room)).toBe(false)
  })
})

// ─── getGroupedRooms ─────────────────────────────────────────────────

function questWithGroupedRooms(): Quest {
  return createQuest({
    layout: {
      rooms: [
        { id: 'room-a', x: 1, y: 1, width: 4, height: 3 },
        { id: 'room-L-1', group: 'room-L', x: 10, y: 10, width: 4, height: 3 },
        { id: 'room-L-2', group: 'room-L', x: 11, y: 13, width: 3, height: 1 },
        { id: 'room-b', x: 20, y: 1, width: 3, height: 3 },
      ],
      walls: [],
    },
  })
}

describe('getGroupedRooms', () => {
  it('groups rooms with same group field', () => {
    const quest = questWithGroupedRooms()
    const groups = getGroupedRooms(quest)
    expect(groups).toHaveLength(3) // room-a, room-L (2 rooms), room-b
  })

  it('grouped rooms share a single group entry', () => {
    const quest = questWithGroupedRooms()
    const groups = getGroupedRooms(quest)
    const lGroup = groups.find((g) => g.id === 'room-L')
    expect(lGroup).toBeDefined()
    expect(lGroup!.rooms).toHaveLength(2)
    expect(lGroup!.rooms[0].id).toBe('room-L-1')
    expect(lGroup!.rooms[1].id).toBe('room-L-2')
  })

  it('ungrouped rooms become their own group', () => {
    const quest = questWithGroupedRooms()
    const groups = getGroupedRooms(quest)
    const roomA = groups.find((g) => g.id === 'room-a')
    expect(roomA).toBeDefined()
    expect(roomA!.rooms).toHaveLength(1)
  })

  it('preserves order (first room appearance)', () => {
    const quest = questWithGroupedRooms()
    const groups = getGroupedRooms(quest)
    expect(groups[0].id).toBe('room-a')
    expect(groups[1].id).toBe('room-L')
    expect(groups[2].id).toBe('room-b')
  })
})

// ─── isGroupNarratable ───────────────────────────────────────────────

describe('isGroupNarratable', () => {
  it('returns true when any room in group has door + valid tiles', () => {
    let quest = questWithGroupedRooms()
    // Door on left wall of room-L-1
    quest = addElement(quest, createElement('door', 'door', 9, 10, { orientation: 'vertical' }))
    const groups = getGroupedRooms(quest)
    const lGroup = groups.find((g) => g.id === 'room-L')!
    expect(isGroupNarratable(quest, lGroup)).toBe(true)
  })

  it('returns false when no room in group has a door', () => {
    const quest = questWithGroupedRooms()
    const groups = getGroupedRooms(quest)
    const lGroup = groups.find((g) => g.id === 'room-L')!
    expect(isGroupNarratable(quest, lGroup)).toBe(false)
  })

  it('returns false when all rooms in group are disabled', () => {
    let quest = questWithGroupedRooms()
    quest = addElement(quest, createElement('door', 'door', 9, 10, { orientation: 'vertical' }))
    // Disable all tiles in both L-shaped rooms
    const disabled = []
    for (const room of quest.layout.rooms.filter((r) => r.group === 'room-L')) {
      for (let x = room.x; x < room.x + room.width; x++) {
        for (let y = room.y; y < room.y + room.height; y++) {
          disabled.push({ x, y })
        }
      }
    }
    quest = { ...quest, disabledTiles: disabled }
    const groups = getGroupedRooms(quest)
    const lGroup = groups.find((g) => g.id === 'room-L')!
    expect(isGroupNarratable(quest, lGroup)).toBe(false)
  })
})

// ─── getElementsByRooms ──────────────────────────────────────────────

describe('getElementsByRooms', () => {
  it('returns elements from multiple rooms without duplicates', () => {
    let quest = questWithGroupedRooms()
    quest = addElement(quest, createElement('monster', 'orc', 11, 11))   // in room-L-1
    quest = addElement(quest, createElement('monster', 'goblin', 12, 13)) // in room-L-2
    quest = addElement(quest, createElement('monster', 'skeleton', 2, 2)) // in room-a (not in group)

    const lRooms = quest.layout.rooms.filter((r) => r.group === 'room-L')
    const elements = getElementsByRooms(quest, lRooms)
    expect(elements).toHaveLength(2)
    expect(elements.some((e) => e.subtype === 'orc')).toBe(true)
    expect(elements.some((e) => e.subtype === 'goblin')).toBe(true)
    expect(elements.some((e) => e.subtype === 'skeleton')).toBe(false)
  })

  it('deduplicates elements at room boundaries', () => {
    let quest = questWithGroupedRooms()
    // Element at a position that could be in overlapping room bounds
    quest = addElement(quest, createElement('monster', 'orc', 11, 12))
    const lRooms = quest.layout.rooms.filter((r) => r.group === 'room-L')
    const elements = getElementsByRooms(quest, lRooms)
    const orcCount = elements.filter((e) => e.subtype === 'orc').length
    expect(orcCount).toBe(1)
  })
})

// ─── getElementsByRoom (multi-tile) ──────────────────────────────────

describe('getElementsByRoom multi-tile', () => {
  it('detects element by origin inside room', () => {
    let quest = createQuest()
    const room = quest.layout.rooms[0] // room-1 at (1,1) 4x3
    quest = addElement(quest, createElement('monster', 'goblin', 2, 2))
    expect(getElementsByRoom(quest, room)).toHaveLength(1)
  })

  it('detects multi-tile element whose origin is inside room', () => {
    let quest = createQuest()
    const room = quest.layout.rooms[0] // room-1 at (1,1) 4x3
    // Table 3x2 with origin at (1,1), extends to (3,2) — fully inside room
    quest = addElement(quest, createElement('furniture', 'table', 1, 1, { width: 3, height: 2 }))
    expect(getElementsByRoom(quest, room)).toHaveLength(1)
  })

  it('detects multi-tile element that extends INTO the room from outside', () => {
    let quest = createQuest()
    const room = quest.layout.rooms[0] // room-1 at (1,1) 4x3
    // Table 3x2 with origin at (0,1) — origin is outside room but extends into it
    quest = addElement(quest, createElement('furniture', 'table', 0, 1, { width: 3, height: 2 }))
    expect(getElementsByRoom(quest, room)).toHaveLength(1)
  })

  it('does NOT detect element fully outside room', () => {
    let quest = createQuest()
    const room = quest.layout.rooms[0] // room-1 at (1,1) 4x3
    // Table at (10,10) — nowhere near the room
    quest = addElement(quest, createElement('furniture', 'table', 10, 10, { width: 3, height: 2 }))
    expect(getElementsByRoom(quest, room)).toHaveLength(0)
  })

  it('detects element that partially overlaps room edge', () => {
    let quest = createQuest()
    const room = quest.layout.rooms[0] // room-1 at (1,1) 4x3 → covers x:[1,4] y:[1,3]
    // Bookcase 3x1 at origin (3,0) extends to (5,0) — y=0 is above room (y starts at 1)
    // This should NOT overlap since it's above
    quest = addElement(quest, createElement('furniture', 'bookcase', 3, 0, { width: 3, height: 1 }))
    expect(getElementsByRoom(quest, room)).toHaveLength(0)
  })

  it('detects element touching room bottom edge from above', () => {
    let quest = createQuest()
    const room = quest.layout.rooms[0] // room-1 at (1,1) 4x3 → y:[1,3]
    // Rack 1x2 at (2,2) extends to (2,3) — fully inside room
    quest = addElement(quest, createElement('furniture', 'rack', 2, 2, { width: 1, height: 2 }))
    expect(getElementsByRoom(quest, room)).toHaveLength(1)
  })
})
