import type { Quest, Position } from './types'

/** Canonical string key for a tile position. Used as Set/Map key across the codebase. */
export function tileKey(x: number, y: number): string {
  return `${x},${y}`
}

/** Parse a tile key back to [x, y]. */
export function parseTileKey(key: string): [number, number] {
  const [x, y] = key.split(',').map(Number)
  return [x, y]
}

/** Build a Set of disabled tile keys for O(1) lookup. */
export function buildDisabledSet(quest: Quest): Set<string> {
  return new Set((quest.disabledTiles ?? []).map((t) => tileKey(t.x, t.y)))
}

export function isDisabledTile(quest: Quest, x: number, y: number): boolean {
  return (quest.disabledTiles ?? []).some((t) => t.x === x && t.y === y)
}

export function toggleTile(quest: Quest, x: number, y: number): Quest {
  const tiles = quest.disabledTiles ?? []
  const exists = tiles.some((p) => p.x === x && p.y === y)
  return {
    ...quest,
    disabledTiles: exists
      ? tiles.filter((p) => !(p.x === x && p.y === y))
      : [...tiles, { x, y }],
  }
}

export function toggleTilesRect(
  quest: Quest,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): Quest {
  const minX = Math.min(x1, x2)
  const maxX = Math.max(x1, x2)
  const minY = Math.min(y1, y2)
  const maxY = Math.max(y1, y2)

  const existing = buildDisabledSet(quest)

  let disabledCount = 0
  const rectTiles: Position[] = []
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      rectTiles.push({ x, y })
      if (existing.has(tileKey(x, y))) disabledCount++
    }
  }

  const shouldRemove = disabledCount > rectTiles.length / 2
  const rectKeys = new Set(rectTiles.map((p) => tileKey(p.x, p.y)))

  if (shouldRemove) {
    return {
      ...quest,
      disabledTiles: (quest.disabledTiles ?? []).filter(
        (p) => !rectKeys.has(tileKey(p.x, p.y)),
      ),
    }
  }

  const newTiles = rectTiles.filter((p) => !existing.has(tileKey(p.x, p.y)))
  return {
    ...quest,
    disabledTiles: [...(quest.disabledTiles ?? []), ...newTiles],
  }
}
