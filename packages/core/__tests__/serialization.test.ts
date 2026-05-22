import { describe, it, expect } from 'vitest'
import { createQuest, createElement, addElement, serialize, deserialize } from '../src'

describe('serialization', () => {
  it('round-trips a quest through JSON', () => {
    const quest = createQuest({ name: 'The Trial' })
    const goblin = createElement('monster', 'goblin', 5, 3)
    const full = addElement(quest, goblin)

    const json = serialize(full)
    const restored = deserialize(json)

    expect(restored.name).toBe('The Trial')
    expect(restored.elements).toHaveLength(1)
    expect(restored.elements[0].subtype).toBe('goblin')
  })

  it('throws on invalid JSON', () => {
    expect(() => deserialize('{}')).toThrow('Invalid quest format')
  })

  it('throws on malformed JSON string', () => {
    expect(() => deserialize('not json')).toThrow()
  })
})
