import type { Quest, QuestElement } from '@quest-editor/core'
import {
  createElement,
  addElement,
  removeElement,
  updateElement,
  moveElement,
  normalizeSubtype,
  isTileBlocked,
} from '@quest-editor/core'

// ─── Types ───────────────────────────────────────────────────────────

export interface UpgradeEntry {
  id: string
  from: string
  to: string
  reason: string
}

export interface RepositionEntry {
  id: string
  from: { x: number; y: number }
  to: { x: number; y: number }
  reason: string
}

export interface AddMonsterEntry {
  subtype: string
  x: number
  y: number
  reason: string
}

export interface AddTrapEntry {
  subtype: string
  x: number
  y: number
  reason: string
}

export interface RemoveEntry {
  id: string
  reason: string
}

export interface RemixSuggestion {
  name: string
  description: string
  upgrades: UpgradeEntry[]
  repositions: RepositionEntry[]
  add_monsters: AddMonsterEntry[]
  add_traps: AddTrapEntry[]
  remove: RemoveEntry[]
}

export interface ApplySelection {
  upgrades: boolean[]
  repositions: boolean[]
  add_monsters: boolean[]
  add_traps: boolean[]
  remove: boolean[]
}

// ─── Resolve Element ─────────────────────────────────────────────────

export function resolveElement(
  elements: QuestElement[],
  id: string,
  hint?: { subtype?: string; x?: number; y?: number },
): QuestElement | undefined {
  const byId = elements.find((e) => e.id === id)
  if (byId) return byId
  if (!hint) return undefined
  // Fallback 1: subtype + position
  if (hint.subtype != null && hint.x != null && hint.y != null) {
    const match = elements.find(
      (e) => e.subtype === hint.subtype && e.position.x === hint.x && e.position.y === hint.y,
    )
    if (match) return match
  }
  // Fallback 2: position only
  if (hint.x != null && hint.y != null) {
    const match = elements.find(
      (e) => e.position.x === hint.x && e.position.y === hint.y,
    )
    if (match) return match
  }
  // Fallback 3: subtype only (first match)
  if (hint.subtype != null) {
    return elements.find((e) => e.subtype === hint.subtype)
  }
  return undefined
}

// ─── Apply Remix ─────────────────────────────────────────────────────

export function createDefaultSelection(suggestion: RemixSuggestion): ApplySelection {
  return {
    upgrades: suggestion.upgrades.map(() => true),
    repositions: suggestion.repositions.map(() => true),
    add_monsters: suggestion.add_monsters.map(() => true),
    add_traps: suggestion.add_traps.map(() => true),
    remove: suggestion.remove.map(() => true),
  }
}

export function applyRemix(
  quest: Quest,
  suggestion: RemixSuggestion,
  selection: ApplySelection,
): Quest {
  let updated = { ...quest, name: suggestion.name }

  // Remove elements first
  for (let i = 0; i < suggestion.remove.length; i++) {
    if (!selection.remove[i]) continue
    const r = suggestion.remove[i]
    const el = resolveElement(updated.elements, r.id)
    if (el) {
      updated = removeElement(updated, el.id)
    }
  }

  // Apply upgrades
  for (let i = 0; i < suggestion.upgrades.length; i++) {
    if (!selection.upgrades[i]) continue
    const u = suggestion.upgrades[i]
    const el = resolveElement(updated.elements, u.id, { subtype: u.from })
    if (!el || el.type !== 'monster') continue
    const normalizedTo = normalizeSubtype('monster', u.to)
    if (!normalizedTo) continue
    updated = updateElement(updated, el.id, { subtype: normalizedTo })
  }

  // Apply repositions
  for (let i = 0; i < suggestion.repositions.length; i++) {
    if (!selection.repositions[i]) continue
    const r = suggestion.repositions[i]
    if (isTileBlocked(updated, r.to.x, r.to.y)) continue
    const el = resolveElement(updated.elements, r.id, { x: r.from.x, y: r.from.y })
    if (el) {
      updated = moveElement(updated, el.id, r.to.x, r.to.y)
    }
  }

  // Add new monsters
  for (let i = 0; i < suggestion.add_monsters.length; i++) {
    if (!selection.add_monsters[i]) continue
    const m = suggestion.add_monsters[i]
    if (isTileBlocked(updated, m.x, m.y)) continue
    const subtype = normalizeSubtype('monster', m.subtype)
    if (!subtype) continue
    updated = addElement(updated, createElement('monster', subtype, m.x, m.y))
  }

  // Add new traps
  for (let i = 0; i < suggestion.add_traps.length; i++) {
    if (!selection.add_traps[i]) continue
    const t = suggestion.add_traps[i]
    if (isTileBlocked(updated, t.x, t.y)) continue
    const subtype = normalizeSubtype('trap', t.subtype)
    if (!subtype) continue
    updated = addElement(updated, createElement('trap', subtype, t.x, t.y, { hidden: true }))
  }

  return updated
}
