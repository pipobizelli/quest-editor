import { describe, it, expect } from 'vitest'
import {
  createQuest,
  createElement,
  addElement,
  validateQuest,
  type Quest,
} from '../src'

function emptyQuest(): Quest {
  return createQuest()
}

function validQuest(): Quest {
  let quest = createQuest({ name: 'Valid' })
  quest = addElement(quest, createElement('marker', 'stairway', 0, 17, { width: 2, height: 2 }))
  quest = addElement(quest, createElement('monster', 'goblin', 2, 2))
  quest = addElement(quest, createElement('door', 'door', 0, 1, { orientation: 'vertical' }))
  return quest
}

describe('validateQuest', () => {
  it('returns no errors for a valid quest', () => {
    const issues = validateQuest(validQuest())
    const errors = issues.filter((i) => i.severity === 'error')
    expect(errors).toHaveLength(0)
  })

  it('warns about empty quest', () => {
    const quest = createQuest({ elements: [] })
    const issues = validateQuest(quest)
    expect(issues.some((i) => i.message.includes('no elements'))).toBe(true)
  })

  it('errors when no stairway', () => {
    let quest = emptyQuest()
    quest = addElement(quest, createElement('monster', 'goblin', 2, 2))
    const issues = validateQuest(quest)
    expect(issues.some((i) => i.severity === 'error' && i.message.includes('stairway'))).toBe(true)
  })

  it('no stairway error when stairway exists', () => {
    const quest = validQuest()
    const issues = validateQuest(quest)
    expect(issues.some((i) => i.message.includes('stairway'))).toBe(false)
  })

  it('errors for element outside board', () => {
    let quest = validQuest()
    quest = addElement(quest, createElement('monster', 'orc', 99, 99))
    const issues = validateQuest(quest)
    expect(issues.some((i) => i.severity === 'error' && i.message.includes('outside the board'))).toBe(true)
  })

  it('errors for element on disabled tile', () => {
    let quest = validQuest()
    quest = addElement(quest, createElement('monster', 'orc', 5, 5))
    quest = { ...quest, disabledTiles: [{ x: 5, y: 5 }] }
    const issues = validateQuest(quest)
    expect(issues.some((i) => i.severity === 'error' && i.message.includes('disabled tile'))).toBe(true)
  })

  it('warns about unknown subtype', () => {
    let quest = validQuest()
    quest = addElement(quest, createElement('monster', 'dragon', 3, 3))
    const issues = validateQuest(quest)
    expect(issues.some((i) => i.message.includes('Unknown') && i.message.includes('dragon'))).toBe(true)
  })

  it('warns about door without orientation', () => {
    let quest = validQuest()
    quest = addElement(quest, createElement('door', 'door', 5, 5))
    const issues = validateQuest(quest)
    expect(issues.some((i) => i.message.includes('no orientation'))).toBe(true)
  })

  it('warns about room with content but no door', () => {
    let quest = createQuest()
    quest = addElement(quest, createElement('marker', 'stairway', 0, 17, { width: 2, height: 2 }))
    // room-1 at (1,1) — add monster but no door
    quest = addElement(quest, createElement('monster', 'goblin', 2, 2))
    const issues = validateQuest(quest)
    expect(issues.some((i) => i.message.includes('no connected door'))).toBe(true)
  })

  it('warns about overlapping monsters', () => {
    let quest = validQuest()
    quest = addElement(quest, createElement('monster', 'orc', 3, 3))
    quest = addElement(quest, createElement('monster', 'skeleton', 3, 3))
    const issues = validateQuest(quest)
    expect(issues.some((i) => i.message.includes('overlap'))).toBe(true)
  })

  it('does not warn about different element types on same tile', () => {
    let quest = validQuest()
    quest = addElement(quest, createElement('monster', 'orc', 3, 3))
    quest = addElement(quest, createElement('trap', 'pittrap', 3, 3, { hidden: true }))
    const issues = validateQuest(quest)
    // Monster + trap on same tile is valid (trap is hidden under the floor)
    expect(issues.some((i) => i.message.includes('overlap'))).toBe(false)
  })

  it('includes elementId in element-specific issues', () => {
    let quest = validQuest()
    const orc = createElement('monster', 'orc', 99, 99)
    quest = addElement(quest, orc)
    const issues = validateQuest(quest)
    const outOfBounds = issues.find((i) => i.message.includes('outside the board'))
    expect(outOfBounds?.elementId).toBe(orc.id)
  })
})
