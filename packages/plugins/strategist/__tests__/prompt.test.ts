import { describe, it, expect } from 'vitest'
import { createQuest, createElement, addElement } from '@quest-editor/core'
import { buildStrategyPrompt } from '../src/prompt'

function sampleQuest() {
  let quest = createQuest({ name: 'The Trial', description: 'Rescue the prisoner', notes: 'Boss in room 3' })
  quest = addElement(quest, createElement('monster', 'goblin', 2, 2))
  quest = addElement(quest, createElement('monster', 'chaos', 10, 8))
  quest = addElement(quest, createElement('furniture', 'table', 3, 3, { width: 3, height: 2 }))
  return quest
}

describe('strategist buildStrategyPrompt', () => {
  it('returns a non-empty string', () => {
    const prompt = buildStrategyPrompt(sampleQuest(), 'en')
    expect(prompt).toBeTruthy()
  })

  it('includes quest metadata', () => {
    const prompt = buildStrategyPrompt(sampleQuest(), 'en')
    expect(prompt).toContain('The Trial')
    expect(prompt).toContain('Rescue the prisoner')
    expect(prompt).toContain('Boss in room 3')
  })

  it('includes game rules sections', () => {
    const prompt = buildStrategyPrompt(sampleQuest(), 'en')
    expect(prompt).toContain('<combat>')
    expect(prompt).toContain('<monster_behavior>')
    expect(prompt).toContain('<traps>')
    expect(prompt).toContain('<chaos_spells>')
    expect(prompt).toContain('<monster_stats>')
    expect(prompt).toContain('<hero_stats>')
  })

  it('includes board with element positions', () => {
    const prompt = buildStrategyPrompt(sampleQuest(), 'en')
    expect(prompt).toContain('Goblin')
    expect(prompt).toContain('Chaos Warrior')
  })

  it('respects language', () => {
    const prompt = buildStrategyPrompt(sampleQuest(), 'pt')
    expect(prompt).toContain('Brazilian Portuguese')
  })
})
