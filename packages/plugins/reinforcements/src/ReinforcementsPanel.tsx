import { useState, useCallback } from 'react'
import type { PluginPanelProps } from '@quest-editor/editor'
import { createElement, addElement } from '@quest-editor/core'
import { buildReinforcementsPrompt } from './prompt'

interface ReinforcementEntry {
  subtype: string
  x: number
  y: number
  reason: string
}

interface ReinforcementSuggestion {
  description: string
  monsters: ReinforcementEntry[]
}

interface ReinforcementsConfig {
  language?: string
}

export function createReinforcementsPanel(config: ReinforcementsConfig) {
  return function ReinforcementsPanel({ quest, onUpdateQuest, llmProvider }: PluginPanelProps) {
    const [loading, setLoading] = useState(false)
    const [suggestion, setSuggestion] = useState<ReinforcementSuggestion | null>(null)
    const [error, setError] = useState<string | null>(null)

    const generate = useCallback(async () => {
      if (!llmProvider) return
      setLoading(true)
      setError(null)
      try {
        const prompt = buildReinforcementsPrompt(quest, config.language)
        const raw = await llmProvider.generate(prompt)

        const jsonStr = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
        const data = JSON.parse(jsonStr) as ReinforcementSuggestion

        if (!data.monsters || !Array.isArray(data.monsters)) {
          throw new Error('Invalid response format')
        }

        setSuggestion(data)
      } catch (err) {
        console.error('Reinforcements error:', err)
        setError('Failed to generate. Try again.')
      } finally {
        setLoading(false)
      }
    }, [quest, llmProvider])

    const apply = useCallback(() => {
      if (!suggestion) return
      let updated = quest
      for (const m of suggestion.monsters) {
        const el = createElement('monster', m.subtype, m.x, m.y)
        updated = addElement(updated, el)
      }
      onUpdateQuest(updated)
      setSuggestion(null)
    }, [quest, suggestion, onUpdateQuest])

    const dismiss = useCallback(() => {
      setSuggestion(null)
    }, [])

    if (!llmProvider) {
      return (
        <div style={{ borderTop: '1px solid #555', padding: '8px 12px', fontSize: 11, color: '#888' }}>
          Reinforcements — no LLM provider configured
        </div>
      )
    }

    return (
      <div style={{ borderTop: '1px solid #555', padding: '8px 0' }}>
        <div style={{ padding: '4px 12px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#ccc' }}>Reinforcements</span>
          {!suggestion && (
            <button
              onClick={generate}
              disabled={loading}
              style={{
                padding: '3px 8px',
                background: 'transparent',
                border: '1px solid #666',
                color: '#bbb',
                fontSize: 10,
                cursor: loading ? 'wait' : 'pointer',
                borderRadius: 3,
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
          )}
        </div>

        {error && (
          <div style={{ padding: '4px 12px', fontSize: 11, color: '#e74c3c' }}>
            {error}
          </div>
        )}

        {suggestion && (
          <div style={{ padding: '0 12px' }}>
            <div style={{ fontSize: 11, color: '#ccc', marginBottom: 8, lineHeight: 1.4 }}>
              {suggestion.description}
            </div>

            {suggestion.monsters.map((m, i) => (
              <div
                key={i}
                style={{
                  padding: '4px 8px',
                  marginBottom: 4,
                  background: 'rgba(231, 76, 60, 0.15)',
                  borderRadius: 4,
                  fontSize: 11,
                }}
              >
                <div style={{ fontWeight: 600, color: '#e0a0a0' }}>
                  {m.subtype} ({m.x}, {m.y})
                </div>
                <div style={{ color: '#bbb' }}>{m.reason}</div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 6, marginTop: 8, marginBottom: 8 }}>
              <button
                onClick={apply}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  background: '#1a5a1a',
                  border: 'none',
                  color: '#eee',
                  fontSize: 11,
                  cursor: 'pointer',
                  borderRadius: 4,
                }}
              >
                Apply ({suggestion.monsters.length} monsters)
              </button>
              <button
                onClick={dismiss}
                style={{
                  padding: '5px 8px',
                  background: '#555',
                  border: 'none',
                  color: '#eee',
                  fontSize: 11,
                  cursor: 'pointer',
                  borderRadius: 4,
                }}
              >
                Dismiss
              </button>
              <button
                onClick={generate}
                disabled={loading}
                style={{
                  padding: '5px 8px',
                  background: 'transparent',
                  border: '1px solid #666',
                  color: '#bbb',
                  fontSize: 11,
                  cursor: 'pointer',
                  borderRadius: 4,
                }}
              >
                ↻
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }
}
