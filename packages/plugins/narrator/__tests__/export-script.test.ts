import { describe, it, expect } from 'vitest'
import { createQuest, createElement, addElement } from '@quest-editor/core'
import { buildGMScript } from '../src/export-script'

function questWithNarrations() {
  let quest = createQuest({
    name: 'The Trial',
    description: 'Find the lost artifact.',
    notes: 'Boss is in the last room.',
  })
  quest = addElement(quest, createElement('door', 'door', 0, 1, { orientation: 'vertical' }))
  quest = addElement(quest, createElement('door', 'door', 5, 1, { orientation: 'vertical' }))
  quest = addElement(quest, createElement('monster', 'goblin', 2, 2))
  quest = addElement(quest, createElement('monster', 'skeleton', 6, 2))
  quest = {
    ...quest,
    narrations: {
      'room-1': 'A dark chamber filled with dust and cobwebs.',
      'room-2': 'The sound of bones rattling echoes through the hall.',
    },
  }
  return quest
}

describe('buildGMScript', () => {
  it('includes quest title as h1', () => {
    const script = buildGMScript(questWithNarrations())
    expect(script).toContain('# The Trial')
  })

  it('includes description as blockquote', () => {
    const script = buildGMScript(questWithNarrations())
    expect(script).toContain('> Find the lost artifact.')
  })

  it('includes GM notes section', () => {
    const script = buildGMScript(questWithNarrations())
    expect(script).toContain('## GM Notes')
    expect(script).toContain('Boss is in the last room.')
  })

  it('includes narrations with numbered room headers', () => {
    const script = buildGMScript(questWithNarrations())
    expect(script).toContain('## 1.')
    expect(script).toContain('A dark chamber filled with dust')
    expect(script).toContain('## 2.')
    expect(script).toContain('The sound of bones rattling')
  })

  it('shows placeholder for rooms without narration', () => {
    let quest = questWithNarrations()
    quest = { ...quest, narrations: { 'room-1': 'Some text.' } }
    const script = buildGMScript(quest)
    expect(script).toContain('*No narration generated.*')
  })

  it('omits GM notes when not present', () => {
    let quest = questWithNarrations()
    quest = { ...quest, notes: undefined }
    const script = buildGMScript(quest)
    expect(script).not.toContain('## GM Notes')
  })

  it('omits description blockquote when not present', () => {
    let quest = questWithNarrations()
    quest = { ...quest, description: '' }
    const script = buildGMScript(quest)
    expect(script).not.toContain('>')
  })
})
