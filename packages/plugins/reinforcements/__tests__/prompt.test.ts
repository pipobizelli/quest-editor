import { describe, it, expect } from 'vitest'
import { createQuest, createElement, addElement } from '@quest-editor/core'
import { buildReinforcementsPrompt } from '../src/prompt'

function sampleQuest() {
  let quest = createQuest({ name: 'The Maze' })
  quest = addElement(quest, createElement('monster', 'orc', 5, 3))
  quest = addElement(quest, createElement('monster', 'skeleton', 8, 7))
  return quest
}

describe('reinforcements buildReinforcementsPrompt', () => {
  it('returns a non-empty string', () => {
    const prompt = buildReinforcementsPrompt(sampleQuest(), 'en')
    expect(prompt).toBeTruthy()
  })

  it('includes quest name', () => {
    const prompt = buildReinforcementsPrompt(sampleQuest(), 'en')
    expect(prompt).toContain('The Maze')
  })

  it('includes game rules', () => {
    const prompt = buildReinforcementsPrompt(sampleQuest(), 'en')
    expect(prompt).toContain('<combat>')
    expect(prompt).toContain('<monster_behavior>')
    expect(prompt).toContain('<traps>')
  })

  it('includes existing monsters in board', () => {
    const prompt = buildReinforcementsPrompt(sampleQuest(), 'en')
    expect(prompt).toContain('Orc')
    expect(prompt).toContain('Skeleton')
  })

  it('includes available positions', () => {
    const prompt = buildReinforcementsPrompt(sampleQuest(), 'en')
    expect(prompt).toContain('<available_positions>')
  })

  it('includes available monsters stats', () => {
    const prompt = buildReinforcementsPrompt(sampleQuest(), 'en')
    expect(prompt).toContain('Goblin')
    expect(prompt).toContain('Gargoyle')
  })

  it('requests JSON output', () => {
    const prompt = buildReinforcementsPrompt(sampleQuest(), 'en')
    expect(prompt).toContain('valid JSON')
    expect(prompt).toContain('"monsters"')
  })
})
