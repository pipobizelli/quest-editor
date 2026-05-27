import { describe, it, expect } from 'vitest'
import {
  createQuest,
  createElement,
  addElement,
  isTileInRoom,
  revealCorridorTiles,
  getCorridorTiles,
  getStairwayTiles,
  type Quest,
} from '../src'

function simpleQuest(): Quest {
  // Default quest has rooms defined in the HeroQuest layout
  return createQuest()
}

describe('isTileInRoom', () => {
  it('returns true for tile inside a room', () => {
    const quest = simpleQuest()
    const room = quest.layout.rooms[0] // room-1 at (1,1) 4x3
    expect(isTileInRoom(quest, room.x, room.y)).toBe(true)
    expect(isTileInRoom(quest, room.x + 1, room.y + 1)).toBe(true)
  })

  it('returns false for tile in a corridor', () => {
    const quest = simpleQuest()
    // (0,0) is outside all rooms in the HeroQuest layout
    expect(isTileInRoom(quest, 0, 0)).toBe(false)
  })
})

describe('revealCorridorTiles', () => {
  it('returns empty for a tile inside a room', () => {
    const quest = simpleQuest()
    const room = quest.layout.rooms[0]
    expect(revealCorridorTiles(quest, room.x, room.y)).toEqual([])
  })

  it('returns empty for a disabled tile', () => {
    let quest = simpleQuest()
    quest = { ...quest, disabledTiles: [{ x: 0, y: 0 }] }
    expect(revealCorridorTiles(quest, 0, 0)).toEqual([])
  })

  it('reveals tiles in a straight line from a corridor tile', () => {
    // 1-wide horizontal corridor between two rooms, walled by disabled tiles
    const quest = createQuest({
      layout: {
        rooms: [
          { id: 'r1', x: 0, y: 0, width: 2, height: 2 },
          { id: 'r2', x: 5, y: 0, width: 2, height: 2 },
        ],
        walls: [],
      },
      board: { width: 7, height: 2, cellSize: 32 },
      // Wall off the bottom row so corridor is only 1 tile wide (row 0)
      disabledTiles: [{ x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }],
    })
    const tiles = revealCorridorTiles(quest, 3, 0)
    expect(tiles).toContain('3,0')
    expect(tiles).toContain('2,0')
    expect(tiles).toContain('4,0')
    // Parallel row is disabled — should NOT be revealed
    expect(tiles).not.toContain('3,1')
  })

  it('does not reveal around corners', () => {
    // L-shaped corridor: horizontal then vertical, blocked by disabled tiles
    const quest = createQuest({
      layout: { rooms: [], walls: [] },
      board: { width: 5, height: 5, cellSize: 32 },
      disabledTiles: [
        // Walls around a horizontal corridor at y=2, x=[0..2]
        { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
        { x: 0, y: 3 }, { x: 1, y: 3 },
        // Walls around a vertical corridor at x=3, y=[0..2]
        { x: 4, y: 0 }, { x: 4, y: 1 }, { x: 4, y: 2 },
        // Block to prevent east ray from (2,2)
        { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 4, y: 4 },
      ],
    })
    // Click horizontal corridor at (1,2) — should reveal east/west but NOT turn the corner
    const tiles = revealCorridorTiles(quest, 1, 2)
    expect(tiles).toContain('0,2')
    expect(tiles).toContain('1,2')
    expect(tiles).toContain('2,2')
    // The ray goes east and hits (3,2) which is open, but that's the corner
    // It continues east to (4,2) which is disabled — stops there
    // It does NOT go north/south from (3,2) because ray only goes in original direction
    expect(tiles).toContain('3,2') // east ray reaches here
    expect(tiles).not.toContain('3,1') // does NOT turn north
    expect(tiles).not.toContain('3,0') // does NOT turn north
  })

  it('stops at board edge', () => {
    const quest = createQuest({
      layout: { rooms: [], walls: [] },
      board: { width: 5, height: 1, cellSize: 32 },
    })
    const tiles = revealCorridorTiles(quest, 2, 0)
    expect(tiles).toContain('0,0')
    expect(tiles).toContain('4,0')
    expect(tiles).not.toContain('-1,0')
    expect(tiles).not.toContain('5,0')
  })

  it('stops at disabled tiles', () => {
    const quest = createQuest({
      layout: { rooms: [], walls: [] },
      board: { width: 5, height: 1, cellSize: 32 },
      disabledTiles: [{ x: 4, y: 0 }],
    })
    const tiles = revealCorridorTiles(quest, 2, 0)
    expect(tiles).toContain('3,0')
    expect(tiles).not.toContain('4,0')
  })
})

describe('getCorridorTiles', () => {
  it('excludes room tiles and disabled tiles', () => {
    const quest = createQuest({
      layout: {
        rooms: [{ id: 'r1', x: 0, y: 0, width: 2, height: 2 }],
        walls: [],
      },
      board: { width: 4, height: 2, cellSize: 32 },
      disabledTiles: [{ x: 3, y: 1 }],
    })
    const tiles = getCorridorTiles(quest)
    // Room occupies (0,0)(1,0)(0,1)(1,1). Disabled: (3,1).
    // Corridor: (2,0)(3,0)(2,1)
    expect(tiles).toContain('2,0')
    expect(tiles).toContain('3,0')
    expect(tiles).toContain('2,1')
    expect(tiles).not.toContain('0,0') // room
    expect(tiles).not.toContain('3,1') // disabled
  })
})

describe('getStairwayTiles', () => {
  it('returns tiles covered by stairway markers', () => {
    let quest = createQuest()
    quest = addElement(quest, createElement('marker', 'stairway', 0, 17, { width: 2, height: 2 }))
    const tiles = getStairwayTiles(quest)
    expect(tiles).toContain('0,17')
    expect(tiles).toContain('1,17')
    expect(tiles).toContain('0,18')
    expect(tiles).toContain('1,18')
  })

  it('returns empty when no stairway', () => {
    const quest = createQuest()
    expect(getStairwayTiles(quest)).toEqual([])
  })
})
