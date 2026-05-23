/**
 * Migration script: converts old quest editor format to the new @quest-editor/core format.
 *
 * Usage: npx tsx scripts/migrate.ts <input.json> [output.json]
 *
 * Old format: tiles as "y:x" strings, categories as separate arrays.
 * New format: unified elements array with type/subtype, Position objects.
 */

import { readFileSync, writeFileSync } from 'fs'
import { HEROQUEST_LAYOUT } from '../packages/core/src/board-layout'
import { getCatalogEntry } from '../packages/core/src/catalog'
import { DEFAULT_BOARD } from '../packages/core/src/types'

interface OldElement {
  tiles: string[]
  label?: string
  type: string
  rotation?: number
  px?: number
  py?: number
  width?: number
  height?: number
}

interface OldQuest {
  id: string
  name: string
  intro?: string
  notes?: string
  monster?: string
  book?: string
  monsters?: OldElement[]
  furnitures?: OldElement[]
  doors?: OldElement[]
  secretdoors?: OldElement[]
  blocks?: OldElement[]
  letters?: OldElement[]
  stairways?: OldElement[]
  traps?: OldElement[]
  heroes?: OldElement[]
  disabledTiles?: string[]
}

interface Position {
  x: number
  y: number
}

interface NewElement {
  id: string
  type: string
  subtype: string
  position: Position
  width?: number
  height?: number
  rotation?: number
  orientation?: string
  hidden?: boolean
  metadata?: Record<string, unknown>
}

function parseTile(tile: string): Position {
  const [yStr, xStr] = tile.split(':')
  return { x: parseInt(xStr), y: parseInt(yStr) }
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}

function migrateDoor(old: OldElement): NewElement {
  const tiles = old.tiles.map(parseTile)
  const pos = tiles[0]

  let orientation = 'vertical'
  if (tiles.length >= 2) {
    const t1 = tiles[0]
    const t2 = tiles[1]
    // Same x, different y → horizontal door (on row boundary)
    // Same y, different x → vertical door (on column boundary)
    if (t1.x === t2.x && t1.y !== t2.y) {
      orientation = 'horizontal'
      // Use the tile with smaller y as position
      if (t2.y < t1.y) { pos.x = t2.x; pos.y = t2.y }
    } else {
      orientation = 'vertical'
      // Use the tile with smaller x as position
      if (t2.x < t1.x) { pos.x = t2.x; pos.y = t2.y }
    }
  }

  const metadata: Record<string, unknown> = {}
  if (old.rotation) metadata.rotation = old.rotation
  if (old.px) metadata.px = old.px
  if (old.py) metadata.py = old.py

  return {
    id: generateId(),
    type: 'door',
    subtype: 'door',
    position: pos,
    orientation,
    ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
  }
}

function migrateSecretDoor(old: OldElement): NewElement {
  const pos = parseTile(old.tiles[0])
  const rotation = old.rotation ?? 0

  const metadata: Record<string, unknown> = {}
  if (old.px) metadata.px = old.px
  if (old.py) metadata.py = old.py

  return {
    id: generateId(),
    type: 'door',
    subtype: 'secret',
    position: pos,
    ...(rotation !== 0 ? { rotation } : {}),
    ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
  }
}

function migrateBlock(old: OldElement): NewElement {
  const tiles = old.tiles.map(parseTile)
  const pos = tiles[0]

  if (tiles.length === 1) {
    return {
      id: generateId(),
      type: 'furniture',
      subtype: 'block',
      position: pos,
    }
  }

  // Double block: determine orientation
  const t1 = tiles[0]
  const t2 = tiles[1]
  const minX = Math.min(t1.x, t2.x)
  const minY = Math.min(t1.y, t2.y)

  if (t1.y === t2.y) {
    // Same row → horizontal 2×1
    return {
      id: generateId(),
      type: 'furniture',
      subtype: 'doubleblock',
      position: { x: minX, y: minY },
      width: 2,
      height: 1,
    }
  } else {
    // Same col → vertical 1×2
    return {
      id: generateId(),
      type: 'furniture',
      subtype: 'doubleblock',
      position: { x: minX, y: minY },
      width: 1,
      height: 2,
      orientation: 'horizontal', // rotated from default 2×1
    }
  }
}

function migrateStairway(old: OldElement): NewElement {
  const tiles = old.tiles.map(parseTile)
  const minX = Math.min(...tiles.map((t) => t.x))
  const minY = Math.min(...tiles.map((t) => t.y))

  const metadata: Record<string, unknown> = {}
  if (old.rotation) metadata.rotation = old.rotation

  return {
    id: generateId(),
    type: 'marker',
    subtype: 'stairway',
    position: { x: minX, y: minY },
    width: 2,
    height: 2,
    ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
  }
}

function migrateGenericElement(
  old: OldElement,
  type: string,
  subtype?: string,
): NewElement {
  const pos = parseTile(old.tiles[0])
  const label = subtype ?? old.label ?? 'unknown'

  const metadata: Record<string, unknown> = {}
  if (old.px) metadata.px = old.px
  if (old.py) metadata.py = old.py

  const rotation = old.rotation ?? 0
  const subtypeLower = label.toLowerCase()
  const catalog = getCatalogEntry(type as any, subtypeLower)

  // Get dimensions from catalog, swap if rotation is 90/270
  let w = catalog?.width ?? 1
  let h = catalog?.height ?? 1
  const swapped = rotation === 90 || rotation === -90 || rotation === 270 || rotation === -270
  if (swapped) { const tmp = w; w = h; h = tmp }

  return {
    id: generateId(),
    type,
    subtype: subtypeLower,
    position: pos,
    ...(w > 1 ? { width: w } : {}),
    ...(h > 1 ? { height: h } : {}),
    ...(rotation !== 0 ? { rotation } : {}),
    ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
  }
}

function migrateDisabledTiles(tiles: string[]): Position[] {
  return tiles.map(parseTile)
}

function migrate(old: OldQuest) {
  const elements: NewElement[] = []

  // Monsters
  for (const m of old.monsters ?? []) {
    elements.push(migrateGenericElement(m, 'monster'))
  }

  // Furniture
  for (const f of old.furnitures ?? []) {
    elements.push(migrateGenericElement(f, 'furniture'))
  }

  // Doors
  for (const d of old.doors ?? []) {
    elements.push(migrateDoor(d))
  }

  // Secret doors
  for (const sd of old.secretdoors ?? []) {
    elements.push(migrateSecretDoor(sd))
  }

  // Blocks
  for (const b of old.blocks ?? []) {
    elements.push(migrateBlock(b))
  }

  // Letters → markers
  for (const l of old.letters ?? []) {
    elements.push(migrateGenericElement(l, 'marker'))
  }

  // Stairways → markers
  for (const s of old.stairways ?? []) {
    elements.push(migrateStairway(s))
  }

  // Traps
  for (const t of old.traps ?? []) {
    elements.push(migrateGenericElement(t, 'trap'))
  }

  // Heroes
  for (const h of old.heroes ?? []) {
    elements.push(migrateGenericElement(h, 'hero'))
  }

  const newQuest = {
    id: old.id,
    name: old.name,
    description: old.intro ?? '',
    board: { ...DEFAULT_BOARD },
    layout: HEROQUEST_LAYOUT,
    elements,
    disabledTiles: old.disabledTiles ? migrateDisabledTiles(old.disabledTiles) : [],
    notes: old.notes,
  }

  return newQuest
}

// CLI
const inputPath = process.argv[2]
if (!inputPath) {
  console.error('Usage: npx tsx scripts/migrate.ts <input.json> [output.json]')
  process.exit(1)
}

const outputPath = process.argv[3] ?? inputPath.replace('.json', '.migrated.json')

const oldData = JSON.parse(readFileSync(inputPath, 'utf-8')) as OldQuest
const newData = migrate(oldData)

writeFileSync(outputPath, JSON.stringify(newData, null, 2))
console.log(`Migrated: ${inputPath} → ${outputPath}`)
console.log(`  Elements: ${newData.elements.length}`)
console.log(`  Disabled tiles: ${newData.disabledTiles.length}`)
