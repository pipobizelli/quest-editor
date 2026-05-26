import { useState, useCallback } from 'react'
import type { PluginPanelProps } from '@quest-editor/editor'
import { getCatalogEntry } from '@quest-editor/core'
import { buildRemixPrompt, type Difficulty } from './prompt'
import {
  type RemixSuggestion,
  type ApplySelection,
  createDefaultSelection,
  applyRemix,
} from './apply'

interface RemixConfig {
  language?: string
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  hard: 'Hard',
  heroic: 'Heroic',
  legendary: 'Legendary',
}

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  hard: '#e67e22',
  heroic: '#e74c3c',
  legendary: '#9b59b6',
}

export function createRemixPanel(config: RemixConfig) {
  return function RemixPanel({ quest, onUpdateQuest, llmProvider, lock, unlock }: PluginPanelProps) {
    const [loading, setLoading] = useState(false)
    const [difficulty, setDifficulty] = useState<Difficulty>('hard')
    const [suggestion, setSuggestion] = useState<RemixSuggestion | null>(null)
    const [selection, setSelection] = useState<ApplySelection | null>(null)
    const [error, setError] = useState<string | null>(null)

    const generate = useCallback(async () => {
      if (!llmProvider) return
      setLoading(true)
      setError(null)
      lock('Remixing quest...')
      try {
        const prompt = buildRemixPrompt(quest, difficulty, config.language)
        const raw = await llmProvider.generate(prompt)

        const jsonStr = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
        const data = JSON.parse(jsonStr) as RemixSuggestion

        data.upgrades = data.upgrades ?? []
        data.repositions = data.repositions ?? []
        data.add_monsters = data.add_monsters ?? []
        data.add_traps = data.add_traps ?? []
        data.remove = data.remove ?? []

        setSuggestion(data)
        setSelection(createDefaultSelection(data))
      } catch (err) {
        console.error('Remix error:', err)
        setError('Failed to generate. Try again.')
      } finally {
        setLoading(false)
        unlock()
      }
    }, [quest, difficulty, llmProvider, lock, unlock])

    const toggle = useCallback((
      category: keyof ApplySelection,
      index: number,
    ) => {
      setSelection((prev) => {
        if (!prev) return prev
        const arr = [...prev[category]]
        arr[index] = !arr[index]
        return { ...prev, [category]: arr }
      })
    }, [])

    const selectedCount = selection
      ? Object.values(selection).flat().filter(Boolean).length
      : 0

    const apply = useCallback(() => {
      if (!suggestion || !selection) return
      const updated = applyRemix(quest, suggestion, selection)
      onUpdateQuest(updated)
      setSuggestion(null)
      setSelection(null)
    }, [quest, suggestion, selection, onUpdateQuest])

    const dismiss = useCallback(() => {
      setSuggestion(null)
      setSelection(null)
    }, [])

    if (!llmProvider) {
      return (
        <div style={{ borderTop: '1px solid #555', padding: '8px 12px', fontSize: 11, color: '#888' }}>
          Remix — no LLM provider configured
        </div>
      )
    }

    return (
      <div style={{ borderTop: '1px solid #555', padding: '8px 0' }}>
        <div style={{ padding: '4px 12px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#ccc' }}>Remix</span>
          {!suggestion && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                style={{
                  padding: '2px 4px',
                  background: '#353535',
                  border: '1px solid #555',
                  color: DIFFICULTY_COLORS[difficulty],
                  fontSize: 10,
                  borderRadius: 3,
                  cursor: 'pointer',
                }}
              >
                {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d) => (
                  <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
                ))}
              </select>
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
                {loading ? 'Remixing...' : 'Remix'}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: '4px 12px', fontSize: 11, color: '#e74c3c' }}>
            {error}
          </div>
        )}

        {suggestion && selection && (
          <div style={{ padding: '0 12px' }}>
            <div style={{ fontSize: 11, color: '#ccc', marginBottom: 8, lineHeight: 1.4 }}>
              {suggestion.description}
            </div>

            {suggestion.upgrades.length > 0 && (
              <ChangeSection title="Upgrades" color="#e67e22">
                {suggestion.upgrades.map((u, i) => (
                  <ChangeItem key={i} color="#e67e22" checked={selection.upgrades[i]} onToggle={() => toggle('upgrades', i)}>
                    <span style={{ fontWeight: 600 }}>
                      {getCatalogEntry('monster', u.from)?.label ?? u.from} → {getCatalogEntry('monster', u.to)?.label ?? u.to}
                    </span>
                    <div style={{ color: '#bbb' }}>{u.reason}</div>
                  </ChangeItem>
                ))}
              </ChangeSection>
            )}

            {suggestion.repositions.length > 0 && (
              <ChangeSection title="Repositions" color="#3498db">
                {suggestion.repositions.map((r, i) => {
                  const el = quest.elements.find((e) => e.id === r.id)
                  const label = el ? (getCatalogEntry(el.type, el.subtype)?.label ?? el.subtype) : r.id
                  return (
                    <ChangeItem key={i} color="#3498db" checked={selection.repositions[i]} onToggle={() => toggle('repositions', i)}>
                      <span style={{ fontWeight: 600 }}>
                        {label}: ({r.from.x},{r.from.y}) → ({r.to.x},{r.to.y})
                      </span>
                      <div style={{ color: '#bbb' }}>{r.reason}</div>
                    </ChangeItem>
                  )
                })}
              </ChangeSection>
            )}

            {suggestion.add_monsters.length > 0 && (
              <ChangeSection title="New Monsters" color="#e74c3c">
                {suggestion.add_monsters.map((m, i) => (
                  <ChangeItem key={i} color="#e74c3c" checked={selection.add_monsters[i]} onToggle={() => toggle('add_monsters', i)}>
                    <span style={{ fontWeight: 600 }}>
                      {getCatalogEntry('monster', m.subtype)?.label ?? m.subtype} ({m.x},{m.y})
                    </span>
                    <div style={{ color: '#bbb' }}>{m.reason}</div>
                  </ChangeItem>
                ))}
              </ChangeSection>
            )}

            {suggestion.add_traps.length > 0 && (
              <ChangeSection title="New Traps" color="#f39c12">
                {suggestion.add_traps.map((t, i) => (
                  <ChangeItem key={i} color="#f39c12" checked={selection.add_traps[i]} onToggle={() => toggle('add_traps', i)}>
                    <span style={{ fontWeight: 600 }}>
                      {getCatalogEntry('trap', t.subtype)?.label ?? t.subtype} ({t.x},{t.y})
                    </span>
                    <div style={{ color: '#bbb' }}>{t.reason}</div>
                  </ChangeItem>
                ))}
              </ChangeSection>
            )}

            {suggestion.remove.length > 0 && (
              <ChangeSection title="Removed" color="#95a5a6">
                {suggestion.remove.map((r, i) => {
                  const el = quest.elements.find((e) => e.id === r.id)
                  const label = el ? (getCatalogEntry(el.type, el.subtype)?.label ?? el.subtype) : r.id
                  return (
                    <ChangeItem key={i} color="#95a5a6" checked={selection.remove[i]} onToggle={() => toggle('remove', i)}>
                      <span style={{ fontWeight: 600 }}>{label}</span>
                      <div style={{ color: '#bbb' }}>{r.reason}</div>
                    </ChangeItem>
                  )
                })}
              </ChangeSection>
            )}

            <div style={{ display: 'flex', gap: 6, marginTop: 8, marginBottom: 8 }}>
              <button
                onClick={apply}
                disabled={selectedCount === 0}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  background: selectedCount > 0 ? '#1a5a1a' : '#333',
                  border: 'none',
                  color: '#eee',
                  fontSize: 11,
                  cursor: selectedCount > 0 ? 'pointer' : 'not-allowed',
                  borderRadius: 4,
                  opacity: selectedCount > 0 ? 1 : 0.5,
                }}
              >
                Apply ({selectedCount} changes)
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

function ChangeSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function ChangeItem({ color, checked, onToggle, children }: {
  color: string
  checked: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div
      onClick={onToggle}
      style={{
        padding: '4px 8px',
        marginBottom: 4,
        background: checked ? `${color}15` : 'transparent',
        borderLeft: `2px solid ${checked ? color : '#555'}`,
        borderRadius: '0 4px 4px 0',
        fontSize: 11,
        color: checked ? '#ccc' : '#666',
        cursor: 'pointer',
        opacity: checked ? 1 : 0.5,
        display: 'flex',
        gap: 6,
        alignItems: 'flex-start',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        onClick={(e) => e.stopPropagation()}
        style={{ marginTop: 2, flexShrink: 0, accentColor: color }}
      />
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}
