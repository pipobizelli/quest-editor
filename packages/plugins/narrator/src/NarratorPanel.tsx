import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import type { RoomGroup } from '@quest-editor/core'
import { getGroupedRooms, isGroupNarratable } from '@quest-editor/core'
import type { PluginPanelProps } from '@quest-editor/editor'
import type { NarratorConfig } from './types'
import { buildPrompt } from './prompt'
import { buildGMScript } from './export-script'

const TONE_PRESETS = [
  { value: '', label: 'Default' },
  { value: 'Dark and ominous, heavy atmosphere, dread', label: 'Dark Fantasy' },
  { value: 'Gory and visceral, blood and horror, graphic descriptions', label: 'Gore' },
  { value: 'Light-hearted and humorous, witty observations, comedic tone', label: 'Humorous' },
  { value: 'Poetic and lyrical, elegant prose, metaphors', label: 'Poetic' },
  { value: 'Tense and suspenseful, paranoia, danger around every corner', label: 'Suspense' },
  { value: 'Simple and clear, suitable for children, no violence', label: 'Children-friendly' },
]

export function createNarratorPanel(config: NarratorConfig) {
  return function NarratorPanel({ quest, onUpdateQuest, llmProvider, lock, unlock }: PluginPanelProps) {
    const [loading, setLoading] = useState<string | null>(null)
    const [tone, setTone] = useState(config.tone ?? '')
    const [narrations, setNarrations] = useState<Map<string, string>>(
      () => new Map(Object.entries(quest.narrations ?? {})),
    )
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

    // Sync local narrations when quest.narrations changes externally (e.g., quest loaded from file)
    const lastQuestIdRef = useRef(quest.id)
    useEffect(() => {
      if (quest.id !== lastQuestIdRef.current) {
        lastQuestIdRef.current = quest.id
        setNarrations(new Map(Object.entries(quest.narrations ?? {})))
      }
    }, [quest.id, quest.narrations])

    const groups = useMemo(
      () => getGroupedRooms(quest).filter((g) => isGroupNarratable(quest, g)),
      [quest],
    )

    const generateForGroup = useCallback(
      async (group: RoomGroup) => {
        if (!llmProvider) return
        setLoading(group.id)
        try {
          const prev = Object.fromEntries([...narrations].filter(([id]) => id !== group.id))
          const prompt = buildPrompt(quest, group, config.language, tone || undefined, prev)
          const text = await llmProvider.generate(prompt)
          setNarrations((prev) => {
            const next = new Map(prev)
            next.set(group.id, text)
            return next
          })
          const questNarrations = { ...(quest.narrations ?? {}), [group.id]: text }
          onUpdateQuest({ ...quest, narrations: questNarrations })
        } catch (err) {
          console.error('Narrator error:', err)
        } finally {
          setLoading(null)
        }
      },
      [quest, config, onUpdateQuest, llmProvider],
    )

    const generateAll = useCallback(
      async () => {
        if (!llmProvider) return
        const pending = groups.filter((g) => !narrations.has(g.id))
        if (pending.length === 0) return
        lock('Generating narrations...')
        let updatedNarrations = { ...(quest.narrations ?? {}) }
        // Seed with existing narrations so each room builds on all previous ones
        const accumulated: Record<string, string> = { ...Object.fromEntries(narrations) }
        try {
          for (const group of pending) {
            setLoading(group.id)
            const prompt = buildPrompt(quest, group, config.language, tone || undefined, accumulated)
            const text = await llmProvider.generate(prompt)
            setNarrations((prev) => {
              const next = new Map(prev)
              next.set(group.id, text)
              return next
            })
            updatedNarrations[group.id] = text
            accumulated[group.id] = text
          }
          onUpdateQuest({ ...quest, narrations: updatedNarrations })
        } catch (err) {
          console.error('Narrator error:', err)
        } finally {
          setLoading(null)
          unlock()
        }
      },
      [quest, groups, narrations, config, onUpdateQuest, llmProvider, lock, unlock],
    )

    const pendingCount = groups.filter((g) => !narrations.has(g.id)).length
    const hasAnyNarration = narrations.size > 0

    const exportScript = useCallback(() => {
      const script = buildGMScript(quest)
      const blob = new Blob([script], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${quest.name.toLowerCase().replace(/\s+/g, '-')}-gm-script.md`
      a.click()
      URL.revokeObjectURL(url)
    }, [quest])

    if (!llmProvider) {
      return (
        <div style={{ borderTop: '1px solid #555', padding: '8px 12px', fontSize: 11, color: '#888' }}>
          Narrator — no LLM provider configured
        </div>
      )
    }

    return (
      <div style={{ borderTop: '1px solid #555', padding: '8px 0' }}>
        <div style={{ padding: '4px 12px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#ccc' }}>Narrator</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {hasAnyNarration && (
              <button
                onClick={exportScript}
                style={{
                  padding: '3px 8px',
                  background: 'transparent',
                  border: '1px solid #666',
                  color: '#bbb',
                  fontSize: 10,
                  cursor: 'pointer',
                  borderRadius: 3,
                }}
                title="Export GM Script (markdown)"
              >
                Export
              </button>
            )}
            {pendingCount > 0 && (
              <button
                onClick={generateAll}
                disabled={loading !== null}
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
                {loading ? `${pendingCount - groups.filter((g) => !narrations.has(g.id)).length}/${pendingCount}` : `Gen All (${pendingCount})`}
              </button>
            )}
          </div>
        </div>
        <div style={{ padding: '0 12px 6px', display: 'flex', gap: 4 }}>
          <select
            value={TONE_PRESETS.some((p) => p.value === tone) ? tone : '__custom'}
            onChange={(e) => {
              if (e.target.value !== '__custom') setTone(e.target.value)
            }}
            style={{
              padding: '4px 4px',
              background: '#353535',
              border: '1px solid #555',
              color: '#ccc',
              fontSize: 10,
              borderRadius: 3,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {TONE_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
            <option value="__custom">Custom</option>
          </select>
          <input
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            placeholder="Custom tone..."
            style={{
              flex: 1,
              minWidth: 0,
              padding: '4px 6px',
              background: '#353535',
              border: '1px solid #555',
              color: '#ccc',
              fontSize: 10,
              borderRadius: 3,
              boxSizing: 'border-box',
            }}
          />
        </div>
        {groups.map((group) => {
          const narration = narrations.get(group.id)
          const isExpanded = expandedGroup === group.id
          const isLoading = loading === group.id

          return (
            <div key={group.id} style={{ padding: '0 8px', marginBottom: 4 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    background: narration ? '#1a3a1a' : 'transparent',
                    border: 'none',
                    color: narration ? '#a0d0a0' : '#999',
                    fontSize: 11,
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderRadius: 3,
                  }}
                >
                  {isExpanded ? '▾' : '▸'} {group.label}
                  {group.rooms.length > 1 && (
                    <span style={{ color: '#666', fontSize: 9, marginLeft: 4 }}>
                      ({group.rooms.length} parts)
                    </span>
                  )}
                </button>
                <button
                  onClick={() => generateForGroup(group)}
                  disabled={loading !== null}
                  style={{
                    padding: '2px 6px',
                    background: 'transparent',
                    border: '1px solid #666',
                    color: '#bbb',
                    fontSize: 10,
                    cursor: loading !== null ? 'wait' : 'pointer',
                    borderRadius: 3,
                    opacity: loading !== null ? 0.5 : 1,
                  }}
                >
                  {isLoading ? '...' : narration ? '↻' : 'Gen'}
                </button>
              </div>
              {isExpanded && narration && (
                <div
                  style={{
                    padding: '6px 8px',
                    fontSize: 11,
                    lineHeight: 1.5,
                    color: '#ddd',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {narration}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }
}
