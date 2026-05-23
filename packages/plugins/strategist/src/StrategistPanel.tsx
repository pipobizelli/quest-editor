import { useState, useCallback } from 'react'
import type { PluginPanelProps } from '@quest-editor/editor'
import { buildStrategyPrompt } from './prompt'

interface StrategistConfig {
  language?: string
}

export function createStrategistPanel(config: StrategistConfig) {
  return function StrategistPanel({ quest, llmProvider }: PluginPanelProps) {
    const [loading, setLoading] = useState(false)
    const [strategy, setStrategy] = useState<string | null>(null)

    const generateStrategy = useCallback(async () => {
      if (!llmProvider) return
      setLoading(true)
      try {
        const prompt = buildStrategyPrompt(quest, config.language)
        const text = await llmProvider.generate(prompt)
        setStrategy(text)
      } catch (err) {
        console.error('Strategist error:', err)
        setStrategy('Error generating strategy. Check console.')
      } finally {
        setLoading(false)
      }
    }, [quest, llmProvider])

    if (!llmProvider) {
      return (
        <div style={{ borderTop: '1px solid #444', padding: '8px 12px', fontSize: 11, opacity: 0.5 }}>
          Strategist — no LLM provider configured
        </div>
      )
    }

    return (
      <div style={{ borderTop: '1px solid #444', padding: '8px 0' }}>
        <div style={{ padding: '4px 12px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.7 }}>Strategist</span>
          <button
            onClick={generateStrategy}
            disabled={loading}
            style={{
              padding: '3px 8px',
              background: 'transparent',
              border: '1px solid #555',
              color: 'inherit',
              fontSize: 10,
              cursor: loading ? 'wait' : 'pointer',
              borderRadius: 3,
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? 'Analyzing...' : strategy ? 'Re-analyze' : 'Analyze Board'}
          </button>
        </div>
        {strategy && (
          <div style={{
            padding: '6px 12px',
            fontSize: 11,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            maxHeight: 300,
            overflowY: 'auto',
          }}>
            {strategy}
          </div>
        )}
      </div>
    )
  }
}
