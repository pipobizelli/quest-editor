import { describe, it, expect } from 'vitest'
import { createQuest, createElement, addElement } from '@quest-editor/core'
import { buildRemixPrompt } from '../src/prompt'

function sampleQuest() {
  let quest = createQuest({ name: 'The Trial', description: 'Find the artifact' })
  quest = addElement(quest, createElement('monster', 'goblin', 2, 2))
  quest = addElement(quest, createElement('monster', 'skeleton', 8, 7))
  quest = addElement(quest, createElement('furniture', 'chest', 5, 3))
  quest = addElement(quest, createElement('furniture', 'table', 10, 8, { width: 3, height: 2 }))
  quest = addElement(quest, createElement('trap', 'pittrap', 6, 4, { hidden: true }))
  quest = addElement(quest, createElement('npc', 'prisoner', 11, 9))
  return quest
}

describe('remix buildRemixPrompt', () => {
  it('returns a non-empty string', () => {
    const prompt = buildRemixPrompt(sampleQuest(), 'hard', 'en')
    expect(prompt).toBeTruthy()
  })

  it('includes difficulty level', () => {
    const prompt = buildRemixPrompt(sampleQuest(), 'heroic', 'en')
    expect(prompt).toContain('<difficulty>heroic</difficulty>')
  })

  it('includes remix guidelines', () => {
    const prompt = buildRemixPrompt(sampleQuest(), 'hard', 'en')
    expect(prompt).toContain('<remix_guidelines>')
    expect(prompt).toContain('WHAT MUST NOT CHANGE')
    expect(prompt).toContain('WHAT CAN CHANGE')
  })

  it('includes element IDs in board description', () => {
    const quest = sampleQuest()
    const prompt = buildRemixPrompt(quest, 'hard', 'en')
    // Elements should have their IDs in the board description
    for (const el of quest.elements) {
      if (el.type !== 'hero' && el.type !== 'door' && el.type !== 'marker') {
        expect(prompt).toContain(el.id)
      }
    }
  })

  it('includes furniture dimensions', () => {
    const prompt = buildRemixPrompt(sampleQuest(), 'hard', 'en')
    expect(prompt).toContain('3x2')
  })

  it('enforces monster family rules', () => {
    const prompt = buildRemixPrompt(sampleQuest(), 'hard', 'en')
    expect(prompt).toContain('LIVING family')
    expect(prompt).toContain('UNDEAD family')
    expect(prompt).toContain('Never cross families')
  })

  it('requests exact IDs in output', () => {
    const prompt = buildRemixPrompt(sampleQuest(), 'hard', 'en')
    expect(prompt).toContain('EXACT element IDs')
  })

  it('includes all output arrays in format', () => {
    const prompt = buildRemixPrompt(sampleQuest(), 'hard', 'en')
    expect(prompt).toContain('"upgrades"')
    expect(prompt).toContain('"repositions"')
    expect(prompt).toContain('"add_monsters"')
    expect(prompt).toContain('"add_traps"')
    expect(prompt).toContain('"remove"')
  })

  it('scales guidelines with difficulty', () => {
    const hard = buildRemixPrompt(sampleQuest(), 'hard', 'en')
    const legendary = buildRemixPrompt(sampleQuest(), 'legendary', 'en')
    expect(hard).toContain('Light room role shuffle')
    expect(legendary).toContain('Full remix')
  })
})
