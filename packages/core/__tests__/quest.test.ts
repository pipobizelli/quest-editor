import { describe, it, expect } from 'vitest'
import {
  createQuest,
  createElement,
  addElement,
  removeElement,
  updateElement,
  moveElement,
  isWithinBoard,
  getElementAt,
  DEFAULT_BOARD,
} from '../src'

describe('createQuest', () => {
  it('creates a quest with defaults', () => {
    const quest = createQuest()
    expect(quest.name).toBe('Untitled Quest')
    expect(quest.board).toEqual(DEFAULT_BOARD)
    expect(quest.elements).toEqual([])
    expect(quest.id).toBeTruthy()
  })

  it('creates a quest with overrides', () => {
    const quest = createQuest({ name: 'The Trial' })
    expect(quest.name).toBe('The Trial')
  })
})

describe('elements', () => {
  it('creates and adds an element', () => {
    const quest = createQuest()
    const goblin = createElement('monster', 'goblin', 5, 3)
    const updated = addElement(quest, goblin)
    expect(updated.elements).toHaveLength(1)
    expect(updated.elements[0].type).toBe('monster')
    expect(updated.elements[0].position).toEqual({ x: 5, y: 3 })
  })

  it('removes an element', () => {
    const quest = createQuest()
    const goblin = createElement('monster', 'goblin', 5, 3)
    const withGoblin = addElement(quest, goblin)
    const without = removeElement(withGoblin, goblin.id)
    expect(without.elements).toHaveLength(0)
  })

  it('updates an element', () => {
    const quest = createQuest()
    const door = createElement('door', 'wooden', 3, 4, { orientation: 'horizontal' })
    const withDoor = addElement(quest, door)
    const updated = updateElement(withDoor, door.id, { orientation: 'vertical' })
    expect(updated.elements[0].orientation).toBe('vertical')
  })

  it('moves an element', () => {
    const quest = createQuest()
    const chest = createElement('furniture', 'chest', 1, 1)
    const withChest = addElement(quest, chest)
    const moved = moveElement(withChest, chest.id, 10, 10)
    expect(moved.elements[0].position).toEqual({ x: 10, y: 10 })
  })

  it('finds element at position', () => {
    const quest = createQuest()
    const goblin = createElement('monster', 'goblin', 5, 3)
    const withGoblin = addElement(quest, goblin)
    expect(getElementAt(withGoblin, 5, 3)).toBeDefined()
    expect(getElementAt(withGoblin, 0, 0)).toBeUndefined()
  })
})

describe('isWithinBoard', () => {
  it('returns true for valid positions', () => {
    expect(isWithinBoard(DEFAULT_BOARD, 0, 0)).toBe(true)
    expect(isWithinBoard(DEFAULT_BOARD, 25, 18)).toBe(true)
  })

  it('returns false for out-of-bounds positions', () => {
    expect(isWithinBoard(DEFAULT_BOARD, -1, 0)).toBe(false)
    expect(isWithinBoard(DEFAULT_BOARD, 26, 0)).toBe(false)
    expect(isWithinBoard(DEFAULT_BOARD, 0, 19)).toBe(false)
  })
})
