import { describe, it, expect } from 'vitest'
import { createQuest, createElement, addElement } from '@quest-editor/core'
import { buildPrompt } from '../src/prompt'

function questWithRoom() {
  let quest = createQuest({ name: 'Test Quest', description: 'A test' })
  quest = addElement(quest, createElement('monster', 'skeleton', 2, 2))
  quest = addElement(quest, createElement('monster', 'skeleton', 3, 2))
  quest = addElement(quest, createElement('furniture', 'chest', 4, 2))
  quest = addElement(quest, createElement('trap', 'pittrap', 3, 3, { hidden: true }))
  return quest
}

describe('narrator buildPrompt', () => {
  it('returns a non-empty string', () => {
    const quest = questWithRoom()
    const room = quest.layout.rooms[0]
    const prompt = buildPrompt(quest, room, 'en')
    expect(prompt).toBeTruthy()
    expect(typeof prompt).toBe('string')
  })

  it('includes quest name', () => {
    const quest = questWithRoom()
    const room = quest.layout.rooms[0]
    const prompt = buildPrompt(quest, room, 'en')
    expect(prompt).toContain('Test Quest')
  })

  it('includes creature lore', () => {
    const quest = questWithRoom()
    const room = quest.layout.rooms[0]
    const prompt = buildPrompt(quest, room, 'en')
    expect(prompt).toContain('<creature_lore>')
    expect(prompt).toContain('SKELETON')
  })

  it('includes trap knowledge', () => {
    const quest = questWithRoom()
    const room = quest.layout.rooms[0]
    const prompt = buildPrompt(quest, room, 'en')
    expect(prompt).toContain('<trap_knowledge>')
    expect(prompt).toContain('Pit Trap')
  })

  it('respects language setting', () => {
    const quest = questWithRoom()
    const room = quest.layout.rooms[0]
    const prompt = buildPrompt(quest, room, 'pt')
    expect(prompt).toContain('Brazilian Portuguese')
  })

  it('never reveals hidden traps rule is present', () => {
    const quest = questWithRoom()
    const room = quest.layout.rooms[0]
    const prompt = buildPrompt(quest, room, 'en')
    expect(prompt).toContain('NEVER reveal hidden traps')
  })

  it('includes tone when provided', () => {
    const quest = questWithRoom()
    const room = quest.layout.rooms[0]
    const prompt = buildPrompt(quest, room, 'en', 'dark and gore')
    expect(prompt).toContain('Tone and style: dark and gore')
  })

  it('omits tone rule when not provided', () => {
    const quest = questWithRoom()
    const room = quest.layout.rooms[0]
    const prompt = buildPrompt(quest, room, 'en')
    expect(prompt).not.toContain('Tone and style')
  })

  it('accepts a RoomGroup', () => {
    const quest = questWithRoom()
    const group = { id: 'test-group', label: 'Test', rooms: [quest.layout.rooms[0]] }
    const prompt = buildPrompt(quest, group, 'en')
    expect(prompt).toContain('Test Quest')
    expect(prompt).toContain('Skeleton')
  })

  it('includes previous narrations when provided', () => {
    const quest = questWithRoom()
    const room = quest.layout.rooms[0]
    const prev = {
      'room-1': 'A dark chamber filled with dust.',
      'room-2': 'The sound of dripping water echoes.',
    }
    const prompt = buildPrompt(quest, room, 'en', undefined, prev)
    expect(prompt).toContain('<previous_narrations>')
    expect(prompt).toContain('A dark chamber filled with dust.')
    expect(prompt).toContain('The sound of dripping water echoes.')
    expect(prompt).toContain('room="room-1"')
    expect(prompt).toContain('room="room-2"')
  })

  it('omits previous narrations section when empty', () => {
    const quest = questWithRoom()
    const room = quest.layout.rooms[0]
    const prompt = buildPrompt(quest, room, 'en', undefined, {})
    expect(prompt).not.toContain('<previous_narrations>')
  })

  it('includes narrative arc rule', () => {
    const quest = questWithRoom()
    const room = quest.layout.rooms[0]
    const prompt = buildPrompt(quest, room, 'en')
    expect(prompt).toContain('narrative arc')
  })
})
