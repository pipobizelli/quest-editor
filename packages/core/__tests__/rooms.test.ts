import { describe, it, expect } from 'vitest'
import {
  createQuest,
  createElement,
  addElement,
  roomHasDoor,
  isRoomValid,
  isRoomNarratable,
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
