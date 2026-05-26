import { useState, useCallback } from 'react'
import type { PluginPanelProps } from '@quest-editor/editor'
import {
  createElement,
  addElement,
  removeElement,
  updateElement,
  moveElement,
  getCatalogEntry,
} from '@quest-editor/core'
import { buildRemixPrompt, type Difficulty } from './prompt'

interface UpgradeEntry {
  id: string
  from: string
  to: string
  reason: string
}

interface RepositionEntry {
  id: string
  from: { x: number; y: number }
  to: { x: number; y: number }
  reason: string
}

interface AddMonsterEntry {
  subtype: string
  x: number
  y: number
  reason: string
}

interface AddTrapEntry {
  subtype: string
  x: number
  y: number
  reason: string
}

interface RemoveEntry {
  id: string
  reason: string
}

interface RemixSuggestion {
  name: string
  description: string
  upgrades: UpgradeEntry[]
  repositions: RepositionEntry[]
  add_monsters: AddMonsterEntry[]
  add_traps: AddTrapEntry[]
  remove: RemoveEntry[]
}

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

        data.remove = data.remove ?? []
        if (!data.upgrades || !data.repositions || !data.add_monsters || !data.add_traps) {
          throw new Error('Invalid response format')
        }

        setSuggestion(data)
      } catch (err) {
        console.error('Remix error:', err)
        setError('Failed to generate. Try again.')
      } finally {
        setLoading(false)
        unlock()
      }
    }, [quest, difficulty, llmProvider, lock, unlock])

    // Resolve element by ID, falling back to matching by subtype and/or position
    const resolveElement = useCallback((
      elements: typeof quest.elements,
      id: string,
      hint?: { subtype?: string; x?: number; y?: number },
    ) => {
      const byId = elements.find((e) => e.id === id)
      if (byId) return byId
      if (!hint) return undefined
      // Fallback 1: match by subtype + position (most specific)
      if (hint.subtype != null && hint.x != null && hint.y != null) {
        const match = elements.find(
          (e) => e.subtype === hint.subtype && e.position.x === hint.x && e.position.y === hint.y,
        )
        if (match) return match
      }
      // Fallback 2: match by position only (for repositions)
      if (hint.x != null && hint.y != null) {
        const match = elements.find(
          (e) => e.position.x === hint.x && e.position.y === hint.y,
        )
        if (match) return match
      }
      // Fallback 3: match by subtype only — first match (for upgrades)
      if (hint.subtype != null) {
        return elements.find((e) => e.subtype === hint.subtype)
      }
      return undefined
    }, [])

    const apply = useCallback(() => {
      if (!suggestion) return
      let updated = quest

      // Apply name
      updated = { ...updated, name: suggestion.name }

      // Remove elements first (before repositions to free up tiles)
      for (const r of suggestion.remove) {
        const el = resolveElement(updated.elements, r.id)
        if (el) {
          updated = removeElement(updated, el.id)
        }
      }

      // Apply upgrades (swap monster subtypes)
      for (const u of suggestion.upgrades) {
        const el = resolveElement(updated.elements, u.id, {
          subtype: u.from,
        })
        if (el && el.type === 'monster') {
          updated = updateElement(updated, el.id, { subtype: u.to })
        }
      }

      // Apply repositions
      for (const r of suggestion.repositions) {
        const el = resolveElement(updated.elements, r.id, {
          x: r.from.x,
          y: r.from.y,
        })
        if (el) {
          updated = moveElement(updated, el.id, r.to.x, r.to.y)
        }
      }

      // Add new monsters
      for (const m of suggestion.add_monsters) {
        const el = createElement('monster', m.subtype, m.x, m.y)
        updated = addElement(updated, el)
      }

      // Add new traps
      for (const t of suggestion.add_traps) {
        const el = createElement('trap', t.subtype, t.x, t.y, { hidden: true })
        updated = addElement(updated, el)
      }

      onUpdateQuest(updated)
      setSuggestion(null)
    }, [quest, suggestion, onUpdateQuest, resolveElement])

    const dismiss = useCallback(() => {
      setSuggestion(null)
    }, [])

    const totalChanges = suggestion
      ? suggestion.upgrades.length + suggestion.repositions.length + suggestion.add_monsters.length + suggestion.add_traps.length + suggestion.remove.length
      : 0

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

        {suggestion && (
          <div style={{ padding: '0 12px' }}>
            <div style={{ fontSize: 11, color: '#ccc', marginBottom: 8, lineHeight: 1.4 }}>
              {suggestion.description}
            </div>

            {suggestion.upgrades.length > 0 && (
              <ChangeSection title="Upgrades" color="#e67e22">
                {suggestion.upgrades.map((u, i) => (
                  <ChangeItem key={i} color="#e67e22">
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
                    <ChangeItem key={i} color="#3498db">
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
                  <ChangeItem key={i} color="#e74c3c">
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
                  <ChangeItem key={i} color="#f39c12">
                    <span style={{ fontWeight: 600 }}>
                      {t.subtype} ({t.x},{t.y})
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
                    <ChangeItem key={i} color="#95a5a6">
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
                Apply ({totalChanges} changes)
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

function ChangeItem({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '4px 8px',
        marginBottom: 4,
        background: `${color}15`,
        borderLeft: `2px solid ${color}`,
        borderRadius: '0 4px 4px 0',
        fontSize: 11,
        color: '#ccc',
      }}
    >
      {children}
    </div>
  )
}
