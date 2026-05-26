import { describe, it, expect } from 'vitest'
import {
  createQuest,
  createElement,
  addElement,
  removeElement,
  updateElement,
  moveElement,
  type Quest,
  type QuestElement,
} from '@quest-editor/core'

/**
 * Mirrors the resolveElement + apply logic from RemixPanel.
 * Extracted here so we can test it without React.
 */
function resolveElement(
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

interface RemixSuggestion {
  name: string
  description: string
  upgrades: { id: string; from: string; to: string; reason: string }[]
  repositions: { id: string; from: { x: number; y: number }; to: { x: number; y: number }; reason: string }[]
  add_monsters: { subtype: string; x: number; y: number; reason: string }[]
  add_traps: { subtype: string; x: number; y: number; reason: string }[]
  remove: { id: string; reason: string }[]
}

function applyRemix(quest: Quest, suggestion: RemixSuggestion): Quest {
  let updated = { ...quest, name: suggestion.name }

  for (const r of suggestion.remove) {
    const el = resolveElement(updated.elements, r.id)
    if (el) updated = removeElement(updated, el.id)
  }

  for (const u of suggestion.upgrades) {
    const el = resolveElement(updated.elements, u.id, { subtype: u.from })
    if (el && el.type === 'monster') {
      updated = updateElement(updated, el.id, { subtype: u.to })
    }
  }

  for (const r of suggestion.repositions) {
    const el = resolveElement(updated.elements, r.id, { x: r.from.x, y: r.from.y })
    if (el) updated = moveElement(updated, el.id, r.to.x, r.to.y)
  }

  for (const m of suggestion.add_monsters) {
    updated = addElement(updated, createElement('monster', m.subtype, m.x, m.y))
  }

  for (const t of suggestion.add_traps) {
    updated = addElement(updated, createElement('trap', t.subtype, t.x, t.y, { hidden: true }))
  }

  return updated
}

function sampleQuest() {
  let quest = createQuest({ name: 'Original' })
  quest = addElement(quest, createElement('monster', 'goblin', 2, 2))
  quest = addElement(quest, createElement('monster', 'skeleton', 8, 7))
  quest = addElement(quest, createElement('furniture', 'chest', 5, 3))
  return quest
}

describe('resolveElement', () => {
  it('resolves by exact ID', () => {
    const quest = sampleQuest()
    const goblin = quest.elements.find((e) => e.subtype === 'goblin')!
    const resolved = resolveElement(quest.elements, goblin.id)
    expect(resolved).toBeDefined()
    expect(resolved!.id).toBe(goblin.id)
  })

  it('falls back to subtype + position when ID is wrong', () => {
    const quest = sampleQuest()
    const resolved = resolveElement(quest.elements, 'fake-id', {
      subtype: 'goblin',
      x: 2,
      y: 2,
    })
    expect(resolved).toBeDefined()
    expect(resolved!.subtype).toBe('goblin')
  })

  it('returns undefined when nothing matches', () => {
    const quest = sampleQuest()
    const resolved = resolveElement(quest.elements, 'fake-id', {
      subtype: 'gargoyle',
      x: 99,
      y: 99,
    })
    expect(resolved).toBeUndefined()
  })

  it('prefers exact ID over fallback', () => {
    const quest = sampleQuest()
    const skeleton = quest.elements.find((e) => e.subtype === 'skeleton')!
    // Pass a hint that would match the goblin, but the ID matches the skeleton
    const resolved = resolveElement(quest.elements, skeleton.id, {
      subtype: 'goblin',
      x: 2,
      y: 2,
    })
    expect(resolved!.subtype).toBe('skeleton')
  })
})

describe('applyRemix', () => {
  it('renames the quest', () => {
    const quest = sampleQuest()
    const result = applyRemix(quest, {
      name: 'Original (Hard)',
      description: '',
      upgrades: [],
      repositions: [],
      add_monsters: [],
      add_traps: [],
      remove: [],
    })
    expect(result.name).toBe('Original (Hard)')
  })

  it('upgrades monsters with correct IDs', () => {
    const quest = sampleQuest()
    const goblin = quest.elements.find((e) => e.subtype === 'goblin')!
    const result = applyRemix(quest, {
      name: 'Test',
      description: '',
      upgrades: [{ id: goblin.id, from: 'goblin', to: 'orc', reason: '' }],
      repositions: [],
      add_monsters: [],
      add_traps: [],
      remove: [],
    })
    const upgraded = result.elements.find((e) => e.id === goblin.id)
    expect(upgraded!.subtype).toBe('orc')
  })

  it('upgrades monsters with wrong IDs using fallback', () => {
    const quest = sampleQuest()
    const result = applyRemix(quest, {
      name: 'Test',
      description: '',
      upgrades: [{ id: 'wrong-id', from: 'goblin', to: 'orc', reason: '' }],
      repositions: [],
      add_monsters: [],
      add_traps: [],
      remove: [],
    })
    const orc = result.elements.find((e) => e.subtype === 'orc')
    expect(orc).toBeDefined()
    expect(orc!.position).toEqual({ x: 2, y: 2 })
  })

  it('repositions elements', () => {
    const quest = sampleQuest()
    const skeleton = quest.elements.find((e) => e.subtype === 'skeleton')!
    const result = applyRemix(quest, {
      name: 'Test',
      description: '',
      upgrades: [],
      repositions: [{ id: skeleton.id, from: { x: 8, y: 7 }, to: { x: 10, y: 5 }, reason: '' }],
      add_monsters: [],
      add_traps: [],
      remove: [],
    })
    const moved = result.elements.find((e) => e.id === skeleton.id)
    expect(moved!.position).toEqual({ x: 10, y: 5 })
  })

  it('repositions with fallback when ID is wrong', () => {
    const quest = sampleQuest()
    const result = applyRemix(quest, {
      name: 'Test',
      description: '',
      upgrades: [],
      repositions: [{ id: 'bad-id', from: { x: 8, y: 7 }, to: { x: 10, y: 5 }, reason: '' }],
      add_monsters: [],
      add_traps: [],
      remove: [],
    })
    const skeleton = result.elements.find((e) => e.subtype === 'skeleton')
    expect(skeleton!.position).toEqual({ x: 10, y: 5 })
  })

  it('adds new monsters', () => {
    const quest = sampleQuest()
    const before = quest.elements.length
    const result = applyRemix(quest, {
      name: 'Test',
      description: '',
      upgrades: [],
      repositions: [],
      add_monsters: [
        { subtype: 'fimir', x: 12, y: 9, reason: '' },
        { subtype: 'orc', x: 6, y: 3, reason: '' },
      ],
      add_traps: [],
      remove: [],
    })
    expect(result.elements.length).toBe(before + 2)
    expect(result.elements.some((e) => e.subtype === 'fimir')).toBe(true)
  })

  it('adds new traps as hidden', () => {
    const quest = sampleQuest()
    const result = applyRemix(quest, {
      name: 'Test',
      description: '',
      upgrades: [],
      repositions: [],
      add_monsters: [],
      add_traps: [{ subtype: 'pittrap', x: 6, y: 4, reason: '' }],
      remove: [],
    })
    const trap = result.elements.find((e) => e.subtype === 'pittrap')
    expect(trap).toBeDefined()
    expect(trap!.hidden).toBe(true)
  })

  it('removes elements before repositioning', () => {
    const quest = sampleQuest()
    const chest = quest.elements.find((e) => e.subtype === 'chest')!
    const result = applyRemix(quest, {
      name: 'Test',
      description: '',
      upgrades: [],
      repositions: [],
      add_monsters: [],
      add_traps: [],
      remove: [{ id: chest.id, reason: '' }],
    })
    expect(result.elements.find((e) => e.id === chest.id)).toBeUndefined()
    expect(result.elements.length).toBe(quest.elements.length - 1)
  })

  it('skips operations that dont match any element', () => {
    const quest = sampleQuest()
    const result = applyRemix(quest, {
      name: 'Test',
      description: '',
      upgrades: [{ id: 'nonexistent', from: 'gargoyle', to: 'chaos', reason: '' }],
      repositions: [{ id: 'nonexistent', from: { x: 99, y: 99 }, to: { x: 1, y: 1 }, reason: '' }],
      add_monsters: [],
      add_traps: [],
      remove: [{ id: 'nonexistent', reason: '' }],
    })
    // Quest should be unchanged except for the name
    expect(result.elements.length).toBe(quest.elements.length)
    expect(result.elements.map((e) => e.subtype).sort()).toEqual(
      quest.elements.map((e) => e.subtype).sort(),
    )
  })

  it('applies multiple operations in correct order', () => {
    const quest = sampleQuest()
    const goblin = quest.elements.find((e) => e.subtype === 'goblin')!
    const skeleton = quest.elements.find((e) => e.subtype === 'skeleton')!
    const chest = quest.elements.find((e) => e.subtype === 'chest')!

    const result = applyRemix(quest, {
      name: 'Full Remix',
      description: '',
      remove: [{ id: chest.id, reason: '' }],
      upgrades: [{ id: goblin.id, from: 'goblin', to: 'orc', reason: '' }],
      repositions: [{ id: skeleton.id, from: { x: 8, y: 7 }, to: { x: 5, y: 3 }, reason: '' }],
      add_monsters: [{ subtype: 'chaos', x: 12, y: 9, reason: '' }],
      add_traps: [{ subtype: 'speartrap', x: 6, y: 4, reason: '' }],
    })

    expect(result.name).toBe('Full Remix')
    expect(result.elements.find((e) => e.id === chest.id)).toBeUndefined()
    expect(result.elements.find((e) => e.id === goblin.id)!.subtype).toBe('orc')
    expect(result.elements.find((e) => e.id === skeleton.id)!.position).toEqual({ x: 5, y: 3 })
    expect(result.elements.some((e) => e.subtype === 'chaos')).toBe(true)
    expect(result.elements.some((e) => e.subtype === 'speartrap')).toBe(true)
  })
})
