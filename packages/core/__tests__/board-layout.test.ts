import { describe, it, expect } from 'vitest'
import { HEROQUEST_LAYOUT, deriveWalls } from '../src/board-layout'
import type { Room } from '../src/types'

describe('HEROQUEST_LAYOUT', () => {
  it('has exactly 23 room entries (21 rooms + 2 L-room parts)', () => {
    expect(HEROQUEST_LAYOUT.rooms).toHaveLength(23)
  })

  it('has unique room ids', () => {
    const ids = HEROQUEST_LAYOUT.rooms.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all rooms are within the 26x19 board', () => {
    for (const room of HEROQUEST_LAYOUT.rooms) {
      expect(room.x).toBeGreaterThanOrEqual(0)
      expect(room.y).toBeGreaterThanOrEqual(0)
      expect(room.x + room.width).toBeLessThanOrEqual(26)
      expect(room.y + room.height).toBeLessThanOrEqual(19)
    }
  })

  it('preserves the exact room configuration', () => {
    expect(HEROQUEST_LAYOUT.rooms).toMatchSnapshot()
  })

  it('generates walls from rooms', () => {
    expect(HEROQUEST_LAYOUT.walls.length).toBeGreaterThan(4) // more than just outer border
  })
})

describe('deriveWalls group suppression', () => {
  it('suppresses shared edges between rooms of the same group', () => {
    const rooms: Room[] = [
      { id: 'a', group: 'L', x: 0, y: 0, width: 2, height: 2 },
      { id: 'b', group: 'L', x: 0, y: 2, width: 1, height: 1 },
    ]
    const walls = deriveWalls(rooms, { width: 4, height: 4, cellSize: 32 })

    // The shared edge is the bottom of 'a' / top of 'b' at x=0,y=2
    // That single unit edge should be suppressed
    const hasSharedWall = walls.some(
      (w) => w.direction === 'horizontal' && w.x === 0 && w.y === 2 && w.length === 1,
    )
    expect(hasSharedWall).toBe(false)

    // But the non-shared part of a's bottom (x=1,y=2) should still be a wall
    const hasNonSharedWall = walls.some(
      (w) => w.direction === 'horizontal' && w.x === 1 && w.y === 2 && w.length === 1,
    )
    expect(hasNonSharedWall).toBe(true)
  })

  it('keeps walls between rooms of different groups', () => {
    const rooms: Room[] = [
      { id: 'a', x: 0, y: 0, width: 2, height: 2 },
      { id: 'b', x: 2, y: 0, width: 2, height: 2 },
    ]
    const walls = deriveWalls(rooms, { width: 4, height: 4, cellSize: 32 })

    // Vertical wall at x=2 between the two rooms should exist
    const hasDividingWall = walls.some(
      (w) => w.direction === 'vertical' && w.x === 2 && w.y === 0 && w.length >= 2,
    )
    expect(hasDividingWall).toBe(true)
  })
})
