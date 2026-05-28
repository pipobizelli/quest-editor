import type { Quest, QuestElement } from './types'
import { isWithinBoard } from './quest'
import { getCatalogEntry } from './catalog'
import { roomHasDoor, getElementsByRoom } from './rooms'
import { isDisabledTile } from './tiles'

export type IssueSeverity = 'error' | 'warning'

export interface QuestIssue {
  severity: IssueSeverity
  message: string
  elementId?: string
}

export function validateQuest(quest: Quest): QuestIssue[] {
  const issues: QuestIssue[] = []

  // ── Stairway ─────────────────────────────────────────────────
  const stairways = quest.elements.filter(
    (e) => e.type === 'marker' && e.subtype === 'stairway',
  )
  if (stairways.length === 0) {
    issues.push({ severity: 'error', message: 'No stairway — heroes have no entry/exit point' })
  }

  // ── Elements outside board ────────────────────────────────────
  for (const el of quest.elements) {
    if (!isWithinBoard(quest.board, el.position.x, el.position.y)) {
      const label = getCatalogEntry(el.type, el.subtype)?.label ?? el.subtype
      issues.push({
        severity: 'error',
        message: `${label} at (${el.position.x},${el.position.y}) is outside the board`,
        elementId: el.id,
      })
    }
  }

  // ── Elements on disabled tiles ────────────────────────────────
  for (const el of quest.elements) {
    if (isDisabledTile(quest, el.position.x, el.position.y)) {
      const label = getCatalogEntry(el.type, el.subtype)?.label ?? el.subtype
      issues.push({
        severity: 'error',
        message: `${label} at (${el.position.x},${el.position.y}) is on a disabled tile`,
        elementId: el.id,
      })
    }
  }

  // ── Invalid subtypes ──────────────────────────────────────────
  for (const el of quest.elements) {
    if (!getCatalogEntry(el.type, el.subtype)) {
      issues.push({
        severity: 'warning',
        message: `Unknown ${el.type} subtype "${el.subtype}" at (${el.position.x},${el.position.y})`,
        elementId: el.id,
      })
    }
  }

  // ── Door orientation ──────────────────────────────────────────
  const doors = quest.elements.filter((e) => e.type === 'door' && e.subtype !== 'secret')
  for (const door of doors) {
    if (!door.orientation) {
      const label = getCatalogEntry(door.type, door.subtype)?.label ?? door.subtype
      issues.push({
        severity: 'warning',
        message: `${label} at (${door.position.x},${door.position.y}) has no orientation set`,
        elementId: door.id,
      })
    }
  }

  // ── Rooms without doors ───────────────────────────────────────
  for (const room of quest.layout.rooms) {
    if (!roomHasDoor(quest, room)) {
      // Only warn if room has content
      const elements = getElementsByRoom(quest, room).filter(
        (e) => e.type !== 'door' && e.type !== 'marker',
      )
      if (elements.length > 0) {
        issues.push({
          severity: 'warning',
          message: `${room.id} has content but no connected door`,
        })
      }
    }
  }

  // ── Overlapping monsters/NPCs ─────────────────────────────────
  const singleTileElements = quest.elements.filter(
    (e) => (e.type === 'monster' || e.type === 'hero' || e.type === 'npc') && (e.width ?? 1) === 1 && (e.height ?? 1) === 1,
  )
  const posMap = new Map<string, QuestElement[]>()
  for (const el of singleTileElements) {
    const key = `${el.position.x},${el.position.y}`
    const list = posMap.get(key) ?? []
    list.push(el)
    posMap.set(key, list)
  }
  for (const [pos, elements] of posMap) {
    if (elements.length > 1) {
      const labels = elements.map((e) => getCatalogEntry(e.type, e.subtype)?.label ?? e.subtype)
      issues.push({
        severity: 'warning',
        message: `${labels.join(' & ')} overlap at (${pos})`,
      })
    }
  }

  // ── Empty quest ───────────────────────────────────────────────
  if (quest.elements.length === 0) {
    issues.push({ severity: 'warning', message: 'Quest has no elements' })
  }

  return issues
}
