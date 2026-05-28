import type { Quest, QuestElement, ElementType } from './types'
import { getCatalogEntry } from './catalog'
import { isDisabledTile } from './tiles'

// ─── Subtype Normalization ───────────────────────────────────────────

const SUBTYPE_ALIASES: Record<string, string> = {
  // Monsters
  'chaos_warrior': 'chaos',
  'chaos warrior': 'chaos',
  'chaoswarrior': 'chaos',
  'warrior': 'chaos',
  // Traps
  'pit_trap': 'pittrap',
  'pit trap': 'pittrap',
  'pit': 'pittrap',
  'falling_block': 'fallingrock',
  'falling block': 'fallingrock',
  'fallingblock': 'fallingrock',
  'falling_rock': 'fallingrock',
  'spear_trap': 'speartrap',
  'spear trap': 'speartrap',
  'spear': 'speartrap',
}

export function normalizeSubtype(type: ElementType, subtype: string): string | null {
  const lower = subtype.toLowerCase().trim()
  if (getCatalogEntry(type, lower)) return lower
  const alias = SUBTYPE_ALIASES[lower]
  if (alias && getCatalogEntry(type, alias)) return alias
  const collapsed = lower.replace(/[\s_-]/g, '')
  if (getCatalogEntry(type, collapsed)) return collapsed
  return null
}

// ─── Tile Availability ───────────────────────────────────────────────

export function isOccupiedTile(elements: QuestElement[], x: number, y: number): boolean {
  return elements.some((e) => {
    const w = e.width ?? 1
    const h = e.height ?? 1
    return x >= e.position.x && x < e.position.x + w &&
           y >= e.position.y && y < e.position.y + h
  })
}

export function isTileBlocked(quest: Quest, x: number, y: number): boolean {
  return isDisabledTile(quest, x, y) || isOccupiedTile(quest.elements, x, y)
}
