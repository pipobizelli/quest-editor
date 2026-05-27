import type { Quest, Room } from './types'

/**
 * Check if a tile is inside any room.
 */
export function isTileInRoom(quest: Quest, x: number, y: number): boolean {
  return quest.layout.rooms.some(
    (r) => x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height,
  )
}

/**
 * Check if a tile is blocked for corridor purposes
 * (out of bounds, disabled, inside a room, or occupied by a furniture block).
 */
function isCorridorBlocked(quest: Quest, x: number, y: number): boolean {
  if (x < 0 || x >= quest.board.width || y < 0 || y >= quest.board.height) return true
  if ((quest.disabledTiles ?? []).some((t) => t.x === x && t.y === y)) return true
  if (isTileInRoom(quest, x, y)) return true
  // Furniture blocks act as walls
  for (const el of quest.elements) {
    if (el.type !== 'furniture') continue
    if (el.subtype !== 'block' && el.subtype !== 'doubleblock') continue
    const w = el.width ?? 1
    const h = el.height ?? 1
    if (x >= el.position.x && x < el.position.x + w &&
        y >= el.position.y && y < el.position.y + h) return true
  }
  return false
}

const DIRECTIONS: [number, number][] = [[0, -1], [0, 1], [-1, 0], [1, 0]] // N, S, W, E

/**
 * From a starting corridor tile, cast rays in all 4 cardinal directions.
 * Returns all tiles visible in straight lines until hitting a block.
 * Only reveals tiles in a straight line — does NOT reveal around corners.
 */
export function revealCorridorTiles(quest: Quest, startX: number, startY: number): string[] {
  if (isCorridorBlocked(quest, startX, startY)) return []

  const revealed = new Set<string>()
  revealed.add(`${startX},${startY}`)

  for (const [dx, dy] of DIRECTIONS) {
    let x = startX + dx
    let y = startY + dy
    while (!isCorridorBlocked(quest, x, y)) {
      revealed.add(`${x},${y}`)
      x += dx
      y += dy
    }
  }

  return [...revealed]
}

/**
 * Returns all corridor tiles (non-room, non-disabled, within bounds).
 */
export function getCorridorTiles(quest: Quest): string[] {
  const tiles: string[] = []
  const disabled = new Set(
    (quest.disabledTiles ?? []).map((t) => `${t.x},${t.y}`),
  )
  for (let x = 0; x < quest.board.width; x++) {
    for (let y = 0; y < quest.board.height; y++) {
      const key = `${x},${y}`
      if (disabled.has(key)) continue
      if (isTileInRoom(quest, x, y)) continue
      tiles.push(key)
    }
  }
  return tiles
}

/**
 * Returns the tiles occupied by the stairway marker(s).
 */
export function getStairwayTiles(quest: Quest): string[] {
  const tiles: string[] = []
  for (const el of quest.elements) {
    if (el.type === 'marker' && el.subtype === 'stairway') {
      const w = el.width ?? 1
      const h = el.height ?? 1
      for (let dx = 0; dx < w; dx++) {
        for (let dy = 0; dy < h; dy++) {
          tiles.push(`${el.position.x + dx},${el.position.y + dy}`)
        }
      }
    }
  }
  return tiles
}
