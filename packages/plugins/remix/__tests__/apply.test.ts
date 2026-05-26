import { describe, it, expect } from 'vitest'
import {
  createQuest,
  createElement,
  addElement,
  type Quest,
} from '@quest-editor/core'
import {
  resolveElement,
  normalizeSubtype,
  isDisabledTile,
  isOccupiedTile,
  isTileBlocked,
  applyRemix,
  createDefaultSelection,
  type RemixSuggestion,
  type ApplySelection,
} from '../src/apply'

// ─── Helpers ─────────────────────────────────────────────────────────

function sampleQuest(): Quest {
  let quest = createQuest({ name: 'Original' })
  quest = addElement(quest, createElement('monster', 'goblin', 2, 2))
  quest = addElement(quest, createElement('monster', 'skeleton', 8, 7))
  quest = addElement(quest, createElement('furniture', 'chest', 5, 3))
  return quest
}

function questWithDisabledTiles(): Quest {
  const quest = sampleQuest()
  return { ...quest, disabledTiles: [{ x: 10, y: 10 }, { x: 11, y: 10 }] }
}

function emptySuggestion(overrides?: Partial<RemixSuggestion>): RemixSuggestion {
  return {
    name: 'Test',
    description: '',
    upgrades: [],
    repositions: [],
    add_monsters: [],
    add_traps: [],
    remove: [],
    ...overrides,
  }
}

function allSelected(s: RemixSuggestion): ApplySelection {
  return createDefaultSelection(s)
}

// ─── resolveElement ──────────────────────────────────────────────────

describe('resolveElement', () => {
  it('resolves by exact ID', () => {
    const quest = sampleQuest()
    const goblin = quest.elements.find((e) => e.subtype === 'goblin')!
    expect(resolveElement(quest.elements, goblin.id)).toBeDefined()
    expect(resolveElement(quest.elements, goblin.id)!.id).toBe(goblin.id)
  })

  it('falls back to subtype + position', () => {
    const quest = sampleQuest()
    const resolved = resolveElement(quest.elements, 'fake-id', {
      subtype: 'goblin', x: 2, y: 2,
    })
    expect(resolved).toBeDefined()
    expect(resolved!.subtype).toBe('goblin')
  })

  it('falls back to position only', () => {
    const quest = sampleQuest()
    const resolved = resolveElement(quest.elements, 'fake-id', { x: 8, y: 7 })
    expect(resolved).toBeDefined()
    expect(resolved!.subtype).toBe('skeleton')
  })

  it('falls back to subtype only', () => {
    const quest = sampleQuest()
    const resolved = resolveElement(quest.elements, 'fake-id', { subtype: 'goblin' })
    expect(resolved).toBeDefined()
    expect(resolved!.subtype).toBe('goblin')
  })

  it('returns undefined when nothing matches', () => {
    const quest = sampleQuest()
    expect(resolveElement(quest.elements, 'fake-id', {
      subtype: 'gargoyle', x: 99, y: 99,
    })).toBeUndefined()
  })

  it('prefers exact ID over fallback', () => {
    const quest = sampleQuest()
    const skeleton = quest.elements.find((e) => e.subtype === 'skeleton')!
    const resolved = resolveElement(quest.elements, skeleton.id, {
      subtype: 'goblin', x: 2, y: 2,
    })
    expect(resolved!.subtype).toBe('skeleton')
  })
})

// ─── normalizeSubtype ────────────────────────────────────────────────

describe('normalizeSubtype', () => {
  it('returns valid subtypes as-is', () => {
    expect(normalizeSubtype('monster', 'goblin')).toBe('goblin')
    expect(normalizeSubtype('monster', 'chaos')).toBe('chaos')
    expect(normalizeSubtype('trap', 'pittrap')).toBe('pittrap')
  })

  it('normalizes common LLM aliases', () => {
    expect(normalizeSubtype('monster', 'chaos_warrior')).toBe('chaos')
    expect(normalizeSubtype('monster', 'Chaos Warrior')).toBe('chaos')
    expect(normalizeSubtype('monster', 'chaoswarrior')).toBe('chaos')
    expect(normalizeSubtype('trap', 'pit_trap')).toBe('pittrap')
    expect(normalizeSubtype('trap', 'falling_block')).toBe('fallingrock')
    expect(normalizeSubtype('trap', 'spear_trap')).toBe('speartrap')
  })

  it('handles collapsed forms', () => {
    expect(normalizeSubtype('trap', 'pit trap')).toBe('pittrap')
    expect(normalizeSubtype('trap', 'spear trap')).toBe('speartrap')
  })

  it('returns null for unknown subtypes', () => {
    expect(normalizeSubtype('monster', 'dragon')).toBeNull()
    expect(normalizeSubtype('monster', 'troll')).toBeNull()
    expect(normalizeSubtype('trap', 'lava_pit')).toBeNull()
  })

  it('is case-insensitive', () => {
    expect(normalizeSubtype('monster', 'GOBLIN')).toBe('goblin')
    expect(normalizeSubtype('monster', 'Orc')).toBe('orc')
  })
})

// ─── isDisabledTile ──────────────────────────────────────────────────

describe('isDisabledTile', () => {
  it('returns true for disabled tiles', () => {
    const quest = questWithDisabledTiles()
    expect(isDisabledTile(quest, 10, 10)).toBe(true)
    expect(isDisabledTile(quest, 11, 10)).toBe(true)
  })

  it('returns false for non-disabled tiles', () => {
    const quest = questWithDisabledTiles()
    expect(isDisabledTile(quest, 5, 5)).toBe(false)
  })

  it('handles quest without disabled tiles', () => {
    const quest = sampleQuest()
    expect(isDisabledTile(quest, 5, 5)).toBe(false)
  })
})

// ─── isOccupiedTile ──────────────────────────────────────────────────

describe('isOccupiedTile', () => {
  it('returns true for tile with a 1x1 element', () => {
    const quest = sampleQuest()
    expect(isOccupiedTile(quest.elements, 2, 2)).toBe(true) // goblin
  })

  it('returns true for tiles covered by multi-tile furniture', () => {
    let quest = createQuest()
    quest = addElement(quest, createElement('furniture', 'table', 3, 3, { width: 3, height: 2 }))
    // table occupies (3,3) (4,3) (5,3) (3,4) (4,4) (5,4)
    expect(isOccupiedTile(quest.elements, 3, 3)).toBe(true)
    expect(isOccupiedTile(quest.elements, 5, 4)).toBe(true)
    expect(isOccupiedTile(quest.elements, 6, 3)).toBe(false) // outside
  })

  it('returns false for empty tiles', () => {
    const quest = sampleQuest()
    expect(isOccupiedTile(quest.elements, 0, 0)).toBe(false)
  })
})

// ─── isTileBlocked ───────────────────────────────────────────────────

describe('isTileBlocked', () => {
  it('returns true for disabled tiles', () => {
    const quest = questWithDisabledTiles()
    expect(isTileBlocked(quest, 10, 10)).toBe(true)
  })

  it('returns true for occupied tiles', () => {
    const quest = sampleQuest()
    expect(isTileBlocked(quest, 2, 2)).toBe(true) // goblin
  })

  it('returns false for free tiles', () => {
    const quest = sampleQuest()
    expect(isTileBlocked(quest, 0, 0)).toBe(false)
  })
})

// ─── createDefaultSelection ──────────────────────────────────────────

describe('createDefaultSelection', () => {
  it('creates all-true selection', () => {
    const suggestion = emptySuggestion({
      upgrades: [{ id: 'a', from: 'goblin', to: 'orc', reason: '' }],
      add_monsters: [
        { subtype: 'fimir', x: 1, y: 1, reason: '' },
        { subtype: 'orc', x: 2, y: 2, reason: '' },
      ],
    })
    const sel = createDefaultSelection(suggestion)
    expect(sel.upgrades).toEqual([true])
    expect(sel.add_monsters).toEqual([true, true])
    expect(sel.repositions).toEqual([])
    expect(sel.add_traps).toEqual([])
    expect(sel.remove).toEqual([])
  })
})

// ─── applyRemix ──────────────────────────────────────────────────────

describe('applyRemix', () => {
  it('renames the quest', () => {
    const quest = sampleQuest()
    const suggestion = emptySuggestion({ name: 'Original (Hard)' })
    const result = applyRemix(quest, suggestion, allSelected(suggestion))
    expect(result.name).toBe('Original (Hard)')
  })

  it('upgrades monsters with correct IDs', () => {
    const quest = sampleQuest()
    const goblin = quest.elements.find((e) => e.subtype === 'goblin')!
    const suggestion = emptySuggestion({
      upgrades: [{ id: goblin.id, from: 'goblin', to: 'orc', reason: '' }],
    })
    const result = applyRemix(quest, suggestion, allSelected(suggestion))
    expect(result.elements.find((e) => e.id === goblin.id)!.subtype).toBe('orc')
  })

  it('upgrades monsters with wrong IDs using fallback', () => {
    const quest = sampleQuest()
    const suggestion = emptySuggestion({
      upgrades: [{ id: 'wrong-id', from: 'goblin', to: 'orc', reason: '' }],
    })
    const result = applyRemix(quest, suggestion, allSelected(suggestion))
    expect(result.elements.some((e) => e.subtype === 'orc')).toBe(true)
  })

  it('normalizes monster subtypes on upgrade', () => {
    const quest = sampleQuest()
    const goblin = quest.elements.find((e) => e.subtype === 'goblin')!
    const suggestion = emptySuggestion({
      upgrades: [{ id: goblin.id, from: 'goblin', to: 'chaos_warrior', reason: '' }],
    })
    const result = applyRemix(quest, suggestion, allSelected(suggestion))
    expect(result.elements.find((e) => e.id === goblin.id)!.subtype).toBe('chaos')
  })

  it('skips upgrade with invalid subtype', () => {
    const quest = sampleQuest()
    const goblin = quest.elements.find((e) => e.subtype === 'goblin')!
    const suggestion = emptySuggestion({
      upgrades: [{ id: goblin.id, from: 'goblin', to: 'dragon', reason: '' }],
    })
    const result = applyRemix(quest, suggestion, allSelected(suggestion))
    expect(result.elements.find((e) => e.id === goblin.id)!.subtype).toBe('goblin')
  })

  it('repositions elements', () => {
    const quest = sampleQuest()
    const skeleton = quest.elements.find((e) => e.subtype === 'skeleton')!
    const suggestion = emptySuggestion({
      repositions: [{ id: skeleton.id, from: { x: 8, y: 7 }, to: { x: 10, y: 5 }, reason: '' }],
    })
    const result = applyRemix(quest, suggestion, allSelected(suggestion))
    expect(result.elements.find((e) => e.id === skeleton.id)!.position).toEqual({ x: 10, y: 5 })
  })

  it('blocks reposition to disabled tile', () => {
    const quest = questWithDisabledTiles()
    const skeleton = quest.elements.find((e) => e.subtype === 'skeleton')!
    const suggestion = emptySuggestion({
      repositions: [{ id: skeleton.id, from: { x: 8, y: 7 }, to: { x: 10, y: 10 }, reason: '' }],
    })
    const result = applyRemix(quest, suggestion, allSelected(suggestion))
    expect(result.elements.find((e) => e.id === skeleton.id)!.position).toEqual({ x: 8, y: 7 })
  })

  it('adds new monsters with valid subtypes', () => {
    const quest = sampleQuest()
    const suggestion = emptySuggestion({
      add_monsters: [{ subtype: 'fimir', x: 12, y: 9, reason: '' }],
    })
    const result = applyRemix(quest, suggestion, allSelected(suggestion))
    expect(result.elements.some((e) => e.subtype === 'fimir')).toBe(true)
  })

  it('normalizes monster subtypes on add', () => {
    const quest = sampleQuest()
    const suggestion = emptySuggestion({
      add_monsters: [{ subtype: 'chaos_warrior', x: 12, y: 9, reason: '' }],
    })
    const result = applyRemix(quest, suggestion, allSelected(suggestion))
    expect(result.elements.some((e) => e.subtype === 'chaos')).toBe(true)
    expect(result.elements.some((e) => e.subtype === 'chaos_warrior')).toBe(false)
  })

  it('skips add_monster with invalid subtype', () => {
    const quest = sampleQuest()
    const before = quest.elements.length
    const suggestion = emptySuggestion({
      add_monsters: [{ subtype: 'dragon', x: 12, y: 9, reason: '' }],
    })
    const result = applyRemix(quest, suggestion, allSelected(suggestion))
    expect(result.elements.length).toBe(before)
  })

  it('blocks add_monster on disabled tile', () => {
    const quest = questWithDisabledTiles()
    const before = quest.elements.length
    const suggestion = emptySuggestion({
      add_monsters: [{ subtype: 'orc', x: 10, y: 10, reason: '' }],
    })
    const result = applyRemix(quest, suggestion, allSelected(suggestion))
    expect(result.elements.length).toBe(before)
  })

  it('blocks add_monster on tile occupied by furniture', () => {
    let quest = createQuest()
    quest = addElement(quest, createElement('furniture', 'table', 3, 3, { width: 3, height: 2 }))
    const before = quest.elements.length
    const suggestion = emptySuggestion({
      add_monsters: [{ subtype: 'orc', x: 4, y: 3, reason: '' }], // inside table
    })
    const result = applyRemix(quest, suggestion, allSelected(suggestion))
    expect(result.elements.length).toBe(before)
  })

  it('blocks add_monster on tile occupied by another monster', () => {
    const quest = sampleQuest()
    const before = quest.elements.length
    const suggestion = emptySuggestion({
      add_monsters: [{ subtype: 'orc', x: 2, y: 2, reason: '' }], // goblin is here
    })
    const result = applyRemix(quest, suggestion, allSelected(suggestion))
    expect(result.elements.length).toBe(before)
  })

  it('adds traps as hidden', () => {
    const quest = sampleQuest()
    const suggestion = emptySuggestion({
      add_traps: [{ subtype: 'pittrap', x: 6, y: 4, reason: '' }],
    })
    const result = applyRemix(quest, suggestion, allSelected(suggestion))
    const trap = result.elements.find((e) => e.subtype === 'pittrap')
    expect(trap).toBeDefined()
    expect(trap!.hidden).toBe(true)
  })

  it('normalizes trap subtypes on add', () => {
    const quest = sampleQuest()
    const suggestion = emptySuggestion({
      add_traps: [{ subtype: 'falling_block', x: 6, y: 4, reason: '' }],
    })
    const result = applyRemix(quest, suggestion, allSelected(suggestion))
    expect(result.elements.some((e) => e.subtype === 'fallingrock')).toBe(true)
  })

  it('blocks add_trap on disabled tile', () => {
    const quest = questWithDisabledTiles()
    const before = quest.elements.length
    const suggestion = emptySuggestion({
      add_traps: [{ subtype: 'pittrap', x: 10, y: 10, reason: '' }],
    })
    const result = applyRemix(quest, suggestion, allSelected(suggestion))
    expect(result.elements.length).toBe(before)
  })

  it('removes elements', () => {
    const quest = sampleQuest()
    const chest = quest.elements.find((e) => e.subtype === 'chest')!
    const suggestion = emptySuggestion({
      remove: [{ id: chest.id, reason: '' }],
    })
    const result = applyRemix(quest, suggestion, allSelected(suggestion))
    expect(result.elements.find((e) => e.id === chest.id)).toBeUndefined()
  })

  it('skips operations that dont match any element', () => {
    const quest = sampleQuest()
    const suggestion = emptySuggestion({
      upgrades: [{ id: 'nonexistent', from: 'gargoyle', to: 'chaos', reason: '' }],
      repositions: [{ id: 'nonexistent', from: { x: 99, y: 99 }, to: { x: 1, y: 1 }, reason: '' }],
      remove: [{ id: 'nonexistent', reason: '' }],
    })
    const result = applyRemix(quest, suggestion, allSelected(suggestion))
    expect(result.elements.length).toBe(quest.elements.length)
  })

  it('applies multiple operations in correct order', () => {
    const quest = sampleQuest()
    const goblin = quest.elements.find((e) => e.subtype === 'goblin')!
    const skeleton = quest.elements.find((e) => e.subtype === 'skeleton')!
    const chest = quest.elements.find((e) => e.subtype === 'chest')!

    const suggestion = emptySuggestion({
      name: 'Full Remix',
      remove: [{ id: chest.id, reason: '' }],
      upgrades: [{ id: goblin.id, from: 'goblin', to: 'orc', reason: '' }],
      repositions: [{ id: skeleton.id, from: { x: 8, y: 7 }, to: { x: 5, y: 3 }, reason: '' }],
      add_monsters: [{ subtype: 'chaos', x: 12, y: 9, reason: '' }],
      add_traps: [{ subtype: 'speartrap', x: 6, y: 4, reason: '' }],
    })
    const result = applyRemix(quest, suggestion, allSelected(suggestion))

    expect(result.name).toBe('Full Remix')
    expect(result.elements.find((e) => e.id === chest.id)).toBeUndefined()
    expect(result.elements.find((e) => e.id === goblin.id)!.subtype).toBe('orc')
    expect(result.elements.find((e) => e.id === skeleton.id)!.position).toEqual({ x: 5, y: 3 })
    expect(result.elements.some((e) => e.subtype === 'chaos')).toBe(true)
    expect(result.elements.some((e) => e.subtype === 'speartrap')).toBe(true)
  })
})

// ─── Selective Apply ─────────────────────────────────────────────────

describe('selective apply', () => {
  it('skips unchecked upgrades', () => {
    const quest = sampleQuest()
    const goblin = quest.elements.find((e) => e.subtype === 'goblin')!
    const suggestion = emptySuggestion({
      upgrades: [{ id: goblin.id, from: 'goblin', to: 'orc', reason: '' }],
    })
    const sel = createDefaultSelection(suggestion)
    sel.upgrades[0] = false
    const result = applyRemix(quest, suggestion, sel)
    expect(result.elements.find((e) => e.id === goblin.id)!.subtype).toBe('goblin')
  })

  it('skips unchecked add_monsters', () => {
    const quest = sampleQuest()
    const suggestion = emptySuggestion({
      add_monsters: [
        { subtype: 'fimir', x: 12, y: 9, reason: '' },
        { subtype: 'orc', x: 6, y: 3, reason: '' },
      ],
    })
    const sel = createDefaultSelection(suggestion)
    sel.add_monsters[0] = false // skip fimir
    const result = applyRemix(quest, suggestion, sel)
    expect(result.elements.some((e) => e.subtype === 'fimir')).toBe(false)
    expect(result.elements.some((e) => e.subtype === 'orc' && e.position.x === 6)).toBe(true)
  })

  it('skips unchecked repositions', () => {
    const quest = sampleQuest()
    const skeleton = quest.elements.find((e) => e.subtype === 'skeleton')!
    const suggestion = emptySuggestion({
      repositions: [{ id: skeleton.id, from: { x: 8, y: 7 }, to: { x: 10, y: 5 }, reason: '' }],
    })
    const sel = createDefaultSelection(suggestion)
    sel.repositions[0] = false
    const result = applyRemix(quest, suggestion, sel)
    expect(result.elements.find((e) => e.id === skeleton.id)!.position).toEqual({ x: 8, y: 7 })
  })

  it('skips unchecked removes', () => {
    const quest = sampleQuest()
    const chest = quest.elements.find((e) => e.subtype === 'chest')!
    const suggestion = emptySuggestion({
      remove: [{ id: chest.id, reason: '' }],
    })
    const sel = createDefaultSelection(suggestion)
    sel.remove[0] = false
    const result = applyRemix(quest, suggestion, sel)
    expect(result.elements.find((e) => e.id === chest.id)).toBeDefined()
  })

  it('applies mix of checked and unchecked', () => {
    const quest = sampleQuest()
    const goblin = quest.elements.find((e) => e.subtype === 'goblin')!
    const suggestion = emptySuggestion({
      upgrades: [{ id: goblin.id, from: 'goblin', to: 'orc', reason: '' }],
      add_monsters: [
        { subtype: 'fimir', x: 12, y: 9, reason: '' },
        { subtype: 'mummy', x: 6, y: 3, reason: '' },
      ],
    })
    const sel = createDefaultSelection(suggestion)
    sel.upgrades[0] = false     // skip upgrade
    sel.add_monsters[1] = false // skip mummy
    const result = applyRemix(quest, suggestion, sel)
    expect(result.elements.find((e) => e.id === goblin.id)!.subtype).toBe('goblin') // not upgraded
    expect(result.elements.some((e) => e.subtype === 'fimir')).toBe(true)  // added
    expect(result.elements.some((e) => e.subtype === 'mummy')).toBe(false) // skipped
  })
})
